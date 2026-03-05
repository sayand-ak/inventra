import express from 'express';
import brandController from '../controllers/brand.js';

const router = express.Router();

router.post('/', brandController.addBrand);
router.get('/', brandController.getAllBrands);
router.get('/filter', brandController.filterBrands);
router.get('/:id', brandController.getBrandById);
router.put('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

export default router;