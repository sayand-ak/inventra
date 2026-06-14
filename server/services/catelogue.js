import { AppError } from "../utils/CustomError.js";
import Catalogue from "../db/models/Catelogue.js"
import Product from "../db/models/Product.js";
import StockEntry from "../db/models/StockEntry.js";

const addCatalogue = async (catalogueData) => {
  const { catalogueName, customerName, customerType, place, pricingRules } = catalogueData;
  
  if (!catalogueName || !customerName || !customerType) {
    throw new AppError("Catalogue name, customer name, and customer type are required", 400, "CATALOGUE_REQUIRED_FIELDS_MISSING");
  }

  const newCatalogue = await Catalogue.create({
    catalogueName,
    customerName,
    customerType,
    place,
    pricingRules: pricingRules || [],
    status: "draft"
  });

  return newCatalogue;
};

const getAllCatalogues = async () => {
  const catalogues = await Catalogue.find({ isDeleted: false });
  return catalogues;
};

const generateCatalogue = async (catalogueId) => {
  console.log(catalogueId);
  
  const catalogue = await Catalogue.findById(catalogueId);
  if (!catalogue) throw new AppError("Catalogue not found", 404, "CATALOGUE_NOT_FOUND");
  if (catalogue.isDeleted) throw new AppError("Catalogue not found", 404, "CATALOGUE_NOT_FOUND");

  const { pricingRules } = catalogue;
  if (!pricingRules?.length) throw new AppError("No pricing rules defined", 400, "NO_PRICING_RULES");

  // Separate rules by type
  const categoryRules = pricingRules.filter(r => r.ruleType === "CATEGORY");
  const brandRules = pricingRules.filter(r => r.ruleType === "BRAND");

  // Build a lookup: "CATEGORY::<refId>::<value>::<unit>" -> increaseAmount
  // This lets us O(1) match each product to its rule later
  const ruleMap = new Map();
  for (const rule of pricingRules) {
    const key = `${rule.ruleType}::${rule.referenceId}::${rule.quantityValue}::${rule.quantityUnit}`;
    ruleMap.set(key, rule.increaseAmount);
  }

  // Fetch all matching products in ONE query using $or
  const orConditions = [];

  for (const rule of categoryRules) {
    orConditions.push({
      category: rule.referenceId,
      "quantity.value": rule.quantityValue,
      "quantity.unit": rule.quantityUnit,
      isDeleted: false,
    });
  }
  for (const rule of brandRules) {
    orConditions.push({
      brand: rule.referenceId,
      "quantity.value": rule.quantityValue,
      "quantity.unit": rule.quantityUnit,
      isDeleted: false,
    });
  }

  if (!orConditions.length) throw new AppError("No valid rule conditions", 400, "NO_CONDITIONS");

  const products = await Product.find({ $or: orConditions })
    .populate("category", "name")
    .populate("brand", "name")
    .lean();

  if (!products.length) throw new AppError("No products matched any pricing rule", 404, "NO_PRODUCTS_MATCHED");

  // For each matched product, grab its latest StockEntry price
  const productIds = products.map(p => p._id);

  // One aggregation: latest StockEntry per product
  const latestEntries = await StockEntry.aggregate([
    { $match: { product: { $in: productIds } } },
    { $sort: { stockDate: -1 } },
    {
      $group: {
        _id: "$product",
        price: { $first: "$price" },
        retailPrice: { $first: "$retailPrice" },
        remainingCount: { $first: "$remainingCount" },
      }
    }
  ]);

  const stockMap = new Map(latestEntries.map(e => [String(e._id), e]));

  // Build the line items
  const lineItems = [];

  for (const product of products) {
    // Determine which rule matched this product
    // Try CATEGORY match first, then BRAND
    const categoryKey = `CATEGORY::${product.category._id}::${product.quantity.value}::${product.quantity.unit}`;
    const brandKey = `BRAND::${product.brand._id}::${product.quantity.value}::${product.quantity.unit}`;

    const increaseAmount = ruleMap.get(categoryKey) ?? ruleMap.get(brandKey) ?? 0;

    const stock = stockMap.get(String(product._id));
    const basePrice = stock?.price       ?? 0;
    const baseRetail = stock?.retailPrice  ?? 0;
    const cataloguePrice = basePrice + increaseAmount;

    lineItems.push({
      productId: product._id,
      productName: product.name,
      brand: product.brand.name,
      category: product.category.name,
      flavour: product.flavour,
      quantity: product.quantity,
      basePrice,
      baseRetailPrice: baseRetail,
      increaseAmount,
      cataloguePrice,
      currentStock: product.currentStock,
    });
  }

  // Group line items by category for a cleaner catalogue layout
  const grouped = {};
  for (const item of lineItems) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  // Persist status update (PDF generation happens separately — see note below)
  await Catalogue.findByIdAndUpdate(catalogueId, {
    status: "generated",
    generatedAt: new Date(),
  });

  return {
    catalogue: {
      _id:          catalogue._id,
      catalogueName: catalogue.catalogueName,
      customerName:  catalogue.customerName,
      customerType:  catalogue.customerType,
      place:         catalogue.place,
      generatedAt:   new Date(),
    },
    grouped,
    lineItems,
  };
};

export default { 
  addCatalogue, 
  getAllCatalogues,
  generateCatalogue
};
