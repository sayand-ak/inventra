import productService from "../services/product.js";

const addProduct = async (req, res, next) => {
  try {
    const product = await productService.addProduct(req.body, req.isShopKeeper);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const filters = {
      name: req.query.name,
      brandId: req.query.brandId,
      categoryId: req.query.categoryId,
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };
    const result = await productService.getProducts(
      filters,
      pagination,
      req.isShopKeeper,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(
      req.params.id,
      req.isShopKeeper,
    );
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const products = await productService.searchProducts(
      req.query.search,
      req.isShopKeeper,
    );
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};

const addStock = async (req, res, next) => {
  try {
    const entry = await productService.addStock(
      req.params.id,
      req.body,
      req.isShopKeeper,
    );
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

const getStockHistory = async (req, res, next) => {
  try {
    const result = await productService.getStockHistory(
      req.params.id,
      req.isShopKeeper,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const editStockEntry = async (req, res, next) => {
  try {
    const entry = await productService.editStockEntry(
      req.params.id,
      req.params.entryId,
      req.body,
      req.isShopKeeper,
    );
    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
};

const deleteStockEntry = async (req, res, next) => {
  try {
    await productService.deleteStockEntry(
      req.params.id,
      req.params.entryId,
      req.isShopKeeper,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export default {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProduct,
  addStock,
  getStockHistory,
  editStockEntry,
  deleteStockEntry,
};
