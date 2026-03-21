import mongoose from "mongoose";
import Product from "../db/models/Product.js";
import StockEntry from "../db/models/StockEntry.js";
import Brand from "../db/models/Brand.js";
import Category from "../db/models/Category.js";
import { AppError } from "../utils/CustomError.js";

// ─────────────────────────────────────────────
//  PRODUCT CRUD
// ─────────────────────────────────────────────

/**
 * Create a product (identity only).
 * The first stock batch is added via addStock() after creation.
 * ShopKeepers cannot create products — only Admins can.
 */
const addProduct = async (productData, isShopKeeper) => {
  if (isShopKeeper) {
    throw new AppError("ShopKeepers cannot create products", 403);
  }

  const { name, brandId, categoryId, quantity, description, flavour } = productData;

  const [brandExists, categoryExists] = await Promise.all([
    Brand.exists({ _id: brandId }),
    Category.exists({ _id: categoryId }),
  ]);

  if (!brandExists) throw new AppError("Brand not found", 404);
  if (!categoryExists) throw new AppError("Category not found", 404);

  const product = await Product.create({
    name: name.trim(),
    brand: brandId,
    category: categoryId,
    quantity,
    description,
    flavour: flavour || "none",
    currentStock: 0,
  });

  return product;
};

const getProducts = async (filters, pagination, isShopKeeper) => {
  const { name, brandId, categoryId } = filters;
  const { page = 1, limit = 10 } = pagination;

  const query = { isDeleted: false };

  if (name) query.name = { $regex: name, $options: "i" };

  if (brandId) {
    if (!mongoose.Types.ObjectId.isValid(brandId))
      throw new AppError("Invalid brandId", 400);
    query.brand = brandId;
  }

  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId))
      throw new AppError("Invalid categoryId", 400);
    query.category = categoryId;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("brand", "name")
      .populate("category", "name")
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  // Attach live stock summary to each product.
  // For admins we also include a per-batch price breakdown.
  const enriched = await Promise.all(
    products.map((p) => enrichProduct(p, isShopKeeper))
  );

  return {
    products: enriched,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getProductById = async (id, isShopKeeper) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError("Invalid product ID", 400);

  const product = await Product.findOne({ _id: id, isDeleted: false })
    .populate("brand", "name")
    .populate("category", "name");

  if (!product) throw new AppError("Product not found", 404);

  return enrichProduct(product, isShopKeeper);
};

const updateProduct = async (id, updateData) => {
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) throw new AppError("Product not found", 404);

  const { name, brandId, categoryId, flavour, quantity, description } = updateData;

  if (brandId) {
    if (!(await Brand.exists({ _id: brandId })))
      throw new AppError("Brand not found", 404);
    product.brand = brandId;
  }

  if (categoryId) {
    if (!(await Category.exists({ _id: categoryId })))
      throw new AppError("Category not found", 404);
    product.category = categoryId;
  }

  if (name) product.name = name.trim();
  if (flavour !== undefined) product.flavour = flavour || "none";
  if (description !== undefined) product.description = description;
  if (quantity !== undefined) product.quantity = quantity;

  await product.save();
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) throw new AppError("Product not found", 404);

  product.isDeleted = true;
  await product.save();
};

const searchProducts = async (searchTerm, isShopKeeper) => {
  const products = await Product.find({
    $or: [
      { name: { $regex: searchTerm, $options: "i" } },
      { flavour: { $regex: searchTerm, $options: "i" } },
    ],
    isDeleted: false,
  })
    .populate("brand", "name")
    .populate("category", "name");

  return Promise.all(products.map((p) => enrichProduct(p, isShopKeeper)));
};

// ─────────────────────────────────────────────
//  STOCK MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Add a new stock batch for a product.
 * Each call creates a new StockEntry row with its own price.
 * ShopKeepers cannot set price — Admins must set it.
 */
const addStock = async (productId, stockData, isShopKeeper) => {
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new AppError("Invalid product ID", 400);

  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) throw new AppError("Product not found", 404);

  const { count, price, retailPrice, note } = stockData;

  if (!count || count < 1) throw new AppError("Count must be at least 1", 400);

  if (isShopKeeper && price !== undefined)
    throw new AppError("ShopKeepers cannot set price", 403);

  if (!isShopKeeper && price === undefined)
    throw new AppError("Price is required", 400);

  // Run entry creation + stock counter update in a session for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [entry] = await StockEntry.create(
      [
        {
          product: productId,
          count,
          price: isShopKeeper ? 0 : price, // ShopKeeper batches get price=0 until admin sets it
          retailPrice,
          remainingCount: count,
          note,
        },
      ],
      { session }
    );

    // Increment denormalised counter on the product
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { currentStock: count } },
      { session }
    );

    await session.commitTransaction();
    return entry;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Get full stock history for a product.
 * Admins see price per batch; ShopKeepers do not.
 */
const getStockHistory = async (productId, isShopKeeper) => {
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new AppError("Invalid product ID", 400);

  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) throw new AppError("Product not found", 404);

  const projection = isShopKeeper ? { price: 0 } : {};  // ← removed retailPrice: 0

  const entries = await StockEntry.find({ product: productId }, projection).sort({
    createdAt: -1,
  });

  return { product, entries };
};

/**
 * Update price/retailPrice on a specific stock entry (Admin only).
 * Useful when a ShopKeeper added stock without a price.
 */
const updateStockEntry = async (entryId, updateData, isShopKeeper) => {
  if (isShopKeeper)
    throw new AppError("ShopKeepers cannot update stock entries", 403);

  if (!mongoose.Types.ObjectId.isValid(entryId))
    throw new AppError("Invalid stock entry ID", 400);

  const entry = await StockEntry.findById(entryId);
  if (!entry) throw new AppError("Stock entry not found", 404);

  const { price, retailPrice, note } = updateData;

  if (price !== undefined) entry.price = price;
  if (retailPrice !== undefined) entry.retailPrice = retailPrice;
  if (note !== undefined) entry.note = note;

  await entry.save();
  return entry;
};

// ─────────────────────────────────────────────
//  INTERNAL HELPERS
// ─────────────────────────────────────────────

/**
 * Attach a stock summary (and optionally price info) to a product object.
 *
 * stockSummary included for all users:
 *   - currentStock  (from denormalised field — fast)
 *   - totalBatches
 *   - lastRestocked (date of most recent batch)
 *
 * priceSummary included for Admins only:
 *   - latestPrice   (price of the newest batch)
 *   - latestRetailPrice
 *   - priceRange    { min, max } across all active batches
 */
const enrichProduct = async (product, isShopKeeper) => {
  const base = product.toObject();

  // Active batches for stock count
  const activeBatches = await StockEntry.find(
    { product: product._id, remainingCount: { $gt: 0 } },
    isShopKeeper ? { price: 0 } : {}
  ).sort({ createdAt: -1 });

  // Latest batch regardless of remaining — for price display even when out of stock
  const latestBatch = await StockEntry.findOne(
    { product: product._id },
    isShopKeeper ? { price: 0 } : {}
  ).sort({ createdAt: -1 });

  base.stockSummary = {
    currentStock: product.currentStock,
    totalBatches: activeBatches.length,
    lastRestocked: activeBatches[0]?.createdAt ?? null,
  };

  // Build priceSummary from latest batch (even if sold out)
  if (latestBatch) {
    if (isShopKeeper) {
      base.priceSummary = {
        latestRetailPrice: latestBatch.retailPrice ?? null,
      };
    } else {
      const prices = activeBatches.length > 0
        ? activeBatches.map((b) => b.price)
        : [latestBatch.price];

      base.priceSummary = {
        latestPrice: latestBatch.price,
        latestRetailPrice: latestBatch.retailPrice ?? null,
        priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      };
    }
  }

  return base;
};

export default {
  // Product CRUD
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  // Stock management
  addStock,
  getStockHistory,
  updateStockEntry,
};