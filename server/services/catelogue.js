import { AppError } from "../utils/CustomError.js";
import Catalogue from "../db/models/Catelogue.js"

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

const getCatalogueById = async (id) => {
  const catalogue = await Catalogue.findById(id);
  if (!catalogue || catalogue.isDeleted) {
    throw new AppError("Catalogue not found", 404, "CATALOGUE_NOT_FOUND");
  }
  return catalogue;
};

const updateCatalogue = async (id, updateData) => {
  const catalogue = await getCatalogueById(id);
  await Catalogue.findByIdAndUpdate(id, updateData, { new: true });
  return catalogue;
};

const deleteCatalogue = async (id) => {
  const catalogue = await getCatalogueById(id);
  catalogue.isDeleted = true;
  await catalogue.save();
  return;
};

const filterCatalogues = async (filterData) => {
  const { catalogueName, customerName, customerType, status } = filterData;
  
  const whereClause = { isDeleted: false };
  
  if (catalogueName) {
    whereClause.catalogueName = { $regex: catalogueName, $options: "i" };
  }
  if (customerName) {
    whereClause.customerName = { $regex: customerName, $options: "i" };
  }
  if (customerType) {
    whereClause.customerType = customerType;
  }
  if (status) {
    whereClause.status = status;
  }
  
  const catalogues = await Catalogue.find(whereClause);
  return catalogues;
};

const addPricingRule = async (catalogueId, pricingRule) => {
  const catalogue = await getCatalogueById(catalogueId);
  
  if (!pricingRule.ruleType || !pricingRule.referenceId || !pricingRule.quantityValue || !pricingRule.quantityUnit || pricingRule.increaseAmount === undefined) {
    throw new AppError("All pricing rule fields are required", 400, "PRICING_RULE_REQUIRED_FIELDS_MISSING");
  }

  catalogue.pricingRules.push(pricingRule);
  await catalogue.save();
  
  return catalogue;
};

const removePricingRule = async (catalogueId, ruleIndex) => {
  const catalogue = await getCatalogueById(catalogueId);
  
  if (ruleIndex < 0 || ruleIndex >= catalogue.pricingRules.length) {
    throw new AppError("Invalid pricing rule index", 400, "INVALID_PRICING_RULE_INDEX");
  }

  catalogue.pricingRules.splice(ruleIndex, 1);
  await catalogue.save();
  
  return catalogue;
};

export default { 
  addCatalogue, 
  getAllCatalogues, 
  getCatalogueById, 
  updateCatalogue, 
  deleteCatalogue, 
  filterCatalogues,
  addPricingRule,
  removePricingRule
};
