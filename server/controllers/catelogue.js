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

const getCatalogueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const catalogue = await catalogueService.getCatalogueById(id);
    res.status(200).json(catalogue);
  } catch (error) {
    next(error);
  }
};

const updateCatalogue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedCatalogue = await catalogueService.updateCatalogue(id, updateData);
    res.status(200).json(updatedCatalogue);
  } catch (error) {
    next(error);
  }
};

const deleteCatalogue = async (req, res, next) => {
  try {
    const { id } = req.params;
    await catalogueService.deleteCatalogue(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const filterCatalogues = async (req, res, next) => {
  try {
    const filterData = req.query;
    const catalogues = await catalogueService.filterCatalogues(filterData);
    res.status(200).json(catalogues);
  } catch (error) {
    next(error);
  }
};

const addPricingRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pricingRule = req.body;
    const updatedCatalogue = await catalogueService.addPricingRule(id, pricingRule);
    res.status(200).json(updatedCatalogue);
  } catch (error) {
    next(error);
  }
};

const removePricingRule = async (req, res, next) => {
  try {
    const { id, ruleIndex } = req.params;
    const updatedCatalogue = await catalogueService.removePricingRule(id, parseInt(ruleIndex));
    res.status(200).json(updatedCatalogue);
  } catch (error) {
    next(error);
  }
};

export default { 
  addCatalogue, 
  getAllCatalogues, 
  getCatalogueById, 
  updateCatalogue, 
  deleteCatalogue, 
  filterCatalogues,
  addPricingRule,
  removePricingRule
};
