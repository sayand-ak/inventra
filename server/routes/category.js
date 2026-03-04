import express from 'express';
import categoryController from '../controllers/category.js'

const router = express.Router();

router.post('/', categoryController.addCategory);
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;