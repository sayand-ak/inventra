import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
  {
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      }
    ],
    increaseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const catalogueSchema = new mongoose.Schema(
  {
    catalogueName: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerType: {
      type: String,
      required: true,
      trim: true,
    },
    place: {
      type: String,
      trim: true,
    },
    pricingRules: [pricingRuleSchema],
    status: {
      type: String,
      enum: ["draft", "generated"],
      default: "draft",
    },
    generatedPdfUrl: {
      type: String,
    },
    generatedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Catalogue", catalogueSchema, "catalogues");