import categoryService from '../services/category.js';

const addCategory = async (req, res, next) => {
  try {
    const categoryData = req.body;
    const newCategory = await categoryService.addCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedCategory = await categoryService.updateCategory(id, updateData);
    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export default { addCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };