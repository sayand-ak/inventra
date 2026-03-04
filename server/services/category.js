import Category from "../db/models/Category.js"
import { AppError } from "../utils/CustomError.js";

const addCategory = async (categoryData) => {
  const { name, description } = categoryData;

  if (!name) {
    throw new AppError("Category name is required", 200, "CATEGORY_NAME_REQUIRED");
  }

  const newCategory = Category.create({ name, description });
  return newCategory;
};

const getAllCategories = async () => {
  const categories = await Category.find();
  return categories;
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }
  return category;
};

const updateCategory = async (id, updateData) => {
  const category = await getCategoryById(id);
  await category.update(updateData);
  return category;
};

const deleteCategory = async (id) => {
  const category = await getCategoryById(id);
  category.isDeleted = true;
  await category.save();
  return;
}

export default { addCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };