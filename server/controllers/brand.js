import brandService from '../services/brand.js';

const addBrand = async (req, res, next) => {
  try {
    const brandData = req.body;
    const newBrand = await brandService.addBrand(brandData);
    res.status(201).json(newBrand);
  } catch (error) {
    next(error);
  }
};

const getAllBrands = async (req, res, next) => {
  try {
    const brands = await brandService.getAllBrands();
    res.status(200).json(brands);
  } catch (error) {
    next(error);
  }
};

const getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const brand = await brandService.getBrandById(id);
    res.status(200).json(brand);
  } catch (error) {
    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBrand = await brandService.updateBrand(id, updateData);
    res.status(200).json(updatedBrand);
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    await brandService.deleteBrand(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const filterBrands = async (req, res, next) => {
  try {
    const filterData = req.query;
    const brands = await brandService.filterBrands(filterData);
    res.status(200).json(brands);
  } catch (error) {
    next(error);
  }
};

export default { addBrand, getAllBrands, getBrandById, updateBrand, deleteBrand, filterBrands };