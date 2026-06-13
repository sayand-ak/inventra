import express from 'express';
import catalogueController from '../controllers/catelogue.js';

const router = express.Router();

router.post('/', catalogueController.addCatalogue);
router.get('/', catalogueController.getAllCatalogues);
router.get('/filter', catalogueController.filterCatalogues);
router.get('/:id', catalogueController.getCatalogueById);
router.put('/:id', catalogueController.updateCatalogue);
router.delete('/:id', catalogueController.deleteCatalogue);
router.post('/:id/pricing-rules', catalogueController.addPricingRule);
router.delete('/:id/pricing-rules/:ruleIndex', catalogueController.removePricingRule);

export default router;
