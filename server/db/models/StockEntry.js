import mongoose from "mongoose";

/**
 * StockEntry tracks every stock arrival for a product independently.
 * This allows different prices and quantities per batch.
 */
const stockEntrySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    count: {
      type: Number,
      required: true,
      min: [1, "Count must be at least 1"],
    },
    // Price at which this batch was purchased (wholesale/cost price)
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    // Retail price for this batch (optional override per batch)
    retailPrice: {
      type: Number,
      min: [0, "Retail price cannot be negative"],
    },
    // Remaining units from this batch (starts = count, decrements on sale)
    remainingCount: {
      type: Number,
      required: true,
      min: [0, "Remaining count cannot be negative"],
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("StockEntry", stockEntrySchema, "stockEntries");