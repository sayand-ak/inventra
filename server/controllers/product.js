import productService from '../services/product.js';

const addProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const isShopKeeper = req.isShopKeeper;
    const newProduct = await productService.addProduct(productData, isShopKeeper);

    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const filters = req.query;
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };
    const products = await productService.getProducts(filters, pagination, req.isShopKeeper);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id, req.isShopKeeper);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedProduct = await productService.updateProduct(id, updateData);
    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export default { addProduct, getProducts, getProductById, updateProduct, deleteProduct };