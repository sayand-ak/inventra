import express from "express";
import productController from "../controllers/product.js";

const router = express.Router();

router
  .route("/")
  .post(productController.addProduct)
  .get(productController.getProducts);
router.get("/search", productController.searchProduct);
router
  .route("/:id")
  .get(productController.getProductById)
  .put(productController.updateProduct)
  .delete(productController.deleteProduct);

router
  .route("/:id/stock")
  .post(productController.addStock)
  .get(productController.getStockHistory);

// Edit and delete individual stock entries
router
  .route("/:id/stock/:entryId")
  .put(productController.editStockEntry) // edit count/price/retailPrice/note/stockDate
  .delete(productController.deleteStockEntry); // delete batch (admin only)

export default router;
