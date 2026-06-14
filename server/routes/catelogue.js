import express from 'express';
import catalogueController from '../controllers/catelogue.js';

const router = express.Router();

router.post('/', catalogueController.addCatalogue);
router.get('/', catalogueController.getAllCatalogues);
router.post('/:id/generate', catalogueController.generateCatalogue);

export default router;
