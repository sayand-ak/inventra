import express from 'express';
import productController from '../controllers/product.js'

const router = express.Router();

router.post('/', productController.addProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;