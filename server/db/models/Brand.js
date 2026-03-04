import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    default: "imported",
    values: ["imported", "local"],
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

export default mongoose.model("Brand", BrandSchema, "brands");