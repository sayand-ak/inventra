import express from 'express';
import productController from '../controllers/product.js'

const router = express.Router();

router
  .route('/')
  .post(productController.addProduct)
  .get(productController.getProducts);

router.get('/search', productController.searchProduct);

router
  .route('/:id')
  .get(productController.getProductById)
  .put(productController.updateProduct)
  .delete(productController.deleteProduct);

export default router;