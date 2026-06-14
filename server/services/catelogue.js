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

export default { 
  addCatalogue, 
  getAllCatalogues
};
