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
    },
    // Price at which this batch was purchased (wholesale/cost price)
    price: {
      type: Number,
    },
    // Retail price for this batch (optional override per batch)
    retailPrice: {
      type: Number,
    },
    // Remaining units from this batch (starts = count, decrements on sale)
    remainingCount: {
      type: Number,
    },
    note: {
      type: String,
    },
    stockDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("StockEntry", stockEntrySchema, "stockEntries");