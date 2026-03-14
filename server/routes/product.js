import express from "express";
import productController from "../controllers/product.js";

const router = express.Router();

// ─── Product CRUD ─────────────────────────────
router
  .route("/")
  .post(productController.addProduct)   // Admin only
  .get(productController.getProducts);  // All roles

router.get("/search", productController.searchProduct);

router
  .route("/:id")
  .get(productController.getProductById)
  .put(productController.updateProduct)    // Admin only
  .delete(productController.deleteProduct); // Admin only

// ─── Stock management ────────────────────────
// POST   /products/:id/stock          → add a new stock batch
// GET    /products/:id/stock          → view full stock history
router
  .route("/:id/stock")
  .post(productController.addStock)
  .get(productController.getStockHistory);

// PATCH  /products/:id/stock/:entryId → update price/notes on a batch (Admin only)
router.patch("/:id/stock/:entryId", productController.updateStockEntry);

export default router;