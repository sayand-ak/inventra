import { AppError } from "../utils/CustomError.js";
import Brand from "../db/models/Brand.js"

const addBrand = async (brandData) => {
  const { name, type, description } = brandData;
  if(!name || !type) {
    throw new AppError("Brand name and type are required", 200, "BRAND_NAME_TYPE_REQUIRED");
  }
  const newBrand = await Brand.create({ name, type, description });
  return newBrand;
};

const getAllBrands = async () => {
  const brands = await Brand.find();
  return brands;
};

const getBrandById = async (id) => {
  const brand = await Brand.findById(id);
  if (!brand) {
    throw new AppError("Brand not found", 404, "BRAND_NOT_FOUND");
  }
  return brand;
};

const updateBrand = async (id, updateData) => {
  const brand = await getBrandById(id);
  await brand.update(updateData);
  return brand;
};

const deleteBrand = async (id) => {
  const brand = await getBrandById(id);
  brand.isDeleted = true;
  await brand.save();
  return;
}

const filterBrands = async (filterData) => {
  const { name, type } = filterData;
  const whereClause = {};
  if (name) {
    whereClause.name = name;
  }
  if (type) {
    whereClause.type = type;
  }
  const brands = await Brand.find({ where: whereClause });
  return brands;
};

export default { addBrand, getAllBrands, getBrandById, updateBrand, deleteBrand, filterBrands };