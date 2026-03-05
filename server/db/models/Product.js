import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    default: 'none'
  },
  price: {
    type: Number,
    default: 0,
    required: true,
  },
  retailPrice: {
    type: Number,
  },
  quantity: {
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ["kg", "g", "mg", "litre", "ml", "tablet", "box", "bottle", "piece"],
      required: true,
    }
  },
  count: {
    type: Number,
    required: true,
  },
  openingStock: {
    type: Number,
    required: true,
  },
  currentStock: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.model("Product", productSchema, "products");  