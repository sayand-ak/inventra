import express from 'express';
import brandController from '../controllers/brand.js';

const router = express.Router();

router.post('/', brandController.addBrand);
router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);
router.put('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);
router.get('/filter', brandController.filterBrands);

export default router;