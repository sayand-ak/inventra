import mongoose from "mongoose";

/**
 * Product holds only identity data.
 * Pricing and stock quantities now live in StockEntry documents.
 *
 * currentStock is a denormalised counter — incremented on stock-in,
 * decremented on sale — so you can query it cheaply without aggregating
 * all StockEntry.remainingCount values every time.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    flavour: {
      type: String,
      default: "none",
    },
    // Package size (e.g. 2 kg, 500 ml) — doesn't change per batch
    quantity: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["kg", "g", "mg", "litre", "ml", "tablet", "box", "bottle", "piece"],
        required: true,
      },
    },
    description: {
      type: String,
    },
    // Denormalised: sum of all StockEntry.remainingCount for this product.
    // Updated atomically whenever stock is added or consumed.
    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Current stock cannot go below 0"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema, "products");