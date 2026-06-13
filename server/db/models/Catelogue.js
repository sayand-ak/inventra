import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
  {
    ruleType: {
      type: String,
      enum: ["CATEGORY", "BRAND"],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    quantityValue: {
      type: Number,
      required: true,
    },

    quantityUnit: {
      type: String,
      enum: [
        "kg",
        "g",
        "mg",
        "litre",
        "ml",
        "tablet",
        "box",
        "bottle",
        "piece",
      ],
      required: true,
    },

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
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Catalogue",
  catalogueSchema,
  "catalogues"
);