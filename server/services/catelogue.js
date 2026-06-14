import { AppError } from "../utils/CustomError.js";
import Catalogue from "../db/models/Catelogue.js";
import Product from "../db/models/Product.js";
import StockEntry from "../db/models/StockEntry.js";

const addCatalogue = async (catalogueData) => {
  const { catalogueName, customerName, customerType, place, pricingRules } = catalogueData;

  if (!catalogueName || !customerName || !customerType) {
    throw new AppError(
      "Catalogue name, customer name, and customer type are required",
      400,
      "CATALOGUE_REQUIRED_FIELDS_MISSING"
    );
  }

  const newCatalogue = await Catalogue.create({
    catalogueName,
    customerName,
    customerType,
    place,
    pricingRules: pricingRules || [],
    status: "draft",
  });

  return newCatalogue;
};

const getAllCatalogues = async () => {
  const catalogues = await Catalogue.find({ isDeleted: false });
  return catalogues;
};

const generateCatalogue = async (catalogueId) => {
  const catalogue = await Catalogue.findById(catalogueId);
  if (!catalogue) throw new AppError("Catalogue not found", 404, "CATALOGUE_NOT_FOUND");
  if (catalogue.isDeleted) throw new AppError("Catalogue not found", 404, "CATALOGUE_NOT_FOUND");

  const { pricingRules } = catalogue;
  if (!pricingRules?.length) throw new AppError("No pricing rules defined", 400, "NO_PRICING_RULES");

  // Build productId -> increaseAmount map
  const increaseMap = new Map();
  for (const rule of pricingRules) {
    for (const pid of rule.productIds) {
      increaseMap.set(String(pid), rule.increaseAmount);
    }
  }

  if (!increaseMap.size) throw new AppError("No products in pricing rules", 400, "NO_PRODUCTS_IN_RULES");

  const allProductIds = [...increaseMap.keys()];

  const products = await Product.find({
    _id: { $in: allProductIds },
    isDeleted: false,
  })
    .populate("category", "name")
    .populate("brand", "name")
    .lean();

  if (!products.length) throw new AppError("No products matched", 404, "NO_PRODUCTS_MATCHED");

  const productIds = products.map((p) => p._id);

  const latestEntries = await StockEntry.aggregate([
    { $match: { product: { $in: productIds } } },
    { $sort: { stockDate: -1 } },
    {
      $group: {
        _id: "$product",
        price: { $first: "$price" },
        retailPrice: { $first: "$retailPrice" },
      },
    },
  ]);

  const stockMap = new Map(latestEntries.map((e) => [String(e._id), e]));

  const lineItems = products.map((product) => {
    const increaseAmount = increaseMap.get(String(product._id)) ?? 0;
    const stock = stockMap.get(String(product._id));
    const basePrice = stock?.price ?? 0;
    const baseRetail = stock?.retailPrice ?? 0;

    return {
      productId: product._id,
      productName: product.name,
      brand: product.brand.name,
      category: product.category.name,
      flavour: product.flavour,
      quantity: product.quantity,
      imageUrl: product.images?.[0]?.url ?? null,
      basePrice,
      baseRetailPrice: baseRetail,
      increaseAmount,
      cataloguePrice: basePrice + increaseAmount,
      currentStock: product.currentStock,
    };
  });

  const grouped = {};
  for (const item of lineItems) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  await Catalogue.findByIdAndUpdate(catalogueId, {
    status: "generated",
    generatedAt: new Date(),
  });

  return {
    catalogue: {
      _id: catalogue._id,
      catalogueName: catalogue.catalogueName,
      customerName: catalogue.customerName,
      customerType: catalogue.customerType,
      place: catalogue.place,
      generatedAt: new Date(),
    },
    grouped,
    lineItems,
  };
};

export default {
  addCatalogue,
  getAllCatalogues,
  generateCatalogue,
};