import catalogueService from '../services/catelogue.js';

const addCatalogue = async (req, res, next) => {
  try {
    const catalogueData = req.body;
    const newCatalogue = await catalogueService.addCatalogue(catalogueData);
    res.status(201).json(newCatalogue);
  } catch (error) {
    next(error);
  }
};

const getAllCatalogues = async (req, res, next) => {
  try {
    const catalogues = await catalogueService.getAllCatalogues();
    res.status(200).json(catalogues);
  } catch (error) {
    next(error);
  }
};

const generateCatalogue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await catalogueService.generateCatalogue(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default { 
  addCatalogue, 
  getAllCatalogues,
  generateCatalogue
};
