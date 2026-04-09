import mongoose from "mongoose";
import Product from "../db/models/Product.js";
import StockEntry from "../db/models/StockEntry.js";
import Brand from "../db/models/Brand.js";
import Category from "../db/models/Category.js";
import { AppError } from "../utils/CustomError.js";

// ─────────────────────────────────────────────
//  PRODUCT CRUD
// ─────────────────────────────────────────────

const addProduct = async (productData, isShopKeeper) => {

  const { name, brandId, categoryId, quantity, description, flavour } =
    productData;

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

  const enriched = await Promise.all(
    products.map((p) => enrichProduct(p, isShopKeeper)),
  );

  return { products: enriched, total, page, pages: Math.ceil(total / limit) };
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

  const { name, brandId, categoryId, flavour, quantity, description } =
    updateData;

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

const addStock = async (productId, stockData, isShopKeeper) => {
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new AppError("Invalid product ID", 400);

  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) throw new AppError("Product not found", 404);

  const { count, price, retailPrice, note, stockDate } = stockData;

  if (!count || count < 1) throw new AppError("Count must be at least 1", 400);
  if (isShopKeeper && price !== undefined)
    throw new AppError("ShopKeepers cannot set price", 403);
  if (!isShopKeeper && price === undefined)
    throw new AppError("Price is required", 400);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [entry] = await StockEntry.create(
      [
        {
          product: productId,
          count,
          price: isShopKeeper ? 0 : price,
          retailPrice,
          remainingCount: count,
          note,
          // Use provided date or fall back to now
          stockDate: stockDate ? new Date(stockDate) : new Date(),
        },
      ],
      { session },
    );

    await Product.findByIdAndUpdate(
      productId,
      { $inc: { currentStock: count } },
      { session },
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

const getStockHistory = async (productId, isShopKeeper) => {
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new AppError("Invalid product ID", 400);

  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) throw new AppError("Product not found", 404);

  const projection = isShopKeeper ? { price: 0 } : {};

  const entries = await StockEntry.find(
    { product: productId },
    projection,
  ).sort({ stockDate: -1, createdAt: -1 });

  return { product, entries };
};

/**
 * Edit a stock entry — price, retailPrice, note, count, stockDate.
 * Adjusts product.currentStock if count changes.
 * ShopKeepers cannot edit price.
 */
const editStockEntry = async (productId, entryId, updateData, isShopKeeper) => {
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new AppError("Invalid product ID", 400);
  if (!mongoose.Types.ObjectId.isValid(entryId))
    throw new AppError("Invalid stock entry ID", 400);

  const entry = await StockEntry.findOne({ _id: entryId, product: productId });
  if (!entry) throw new AppError("Stock entry not found", 404);

  if (isShopKeeper && updateData.price !== undefined)
    throw new AppError("ShopKeepers cannot update cost price", 403);

  const { price, retailPrice, note, stockDate, count, remainingCount } = updateData;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ── Resolve new count ──────────────────────────────────────
    if (count !== undefined && count < 0)
      throw new AppError("Count cannot be negative", 400);

    const newCount = count !== undefined ? count : entry.count;

    // ── Resolve new remainingCount ─────────────────────────────
    let newRemaining;

    if (remainingCount !== undefined) {
      // remainingCount can be 0 (fully sold out) but cannot exceed total count
      if (remainingCount < 0 || remainingCount > newCount)
        throw new AppError(
          `remainingCount must be between 0 and ${newCount}`,
          400,
        );
      newRemaining = remainingCount;
    } else if (count !== undefined && count !== entry.count) {
      // Only count changed — adjust remaining proportionally
      const soldUnits = entry.count - entry.remainingCount;
      newRemaining = Math.max(0, newCount - soldUnits);
    } else {
      // Nothing affecting stock changed
      newRemaining = entry.remainingCount;
    }

    // ── Apply stock delta to product ───────────────────────────
    const stockDelta = newRemaining - entry.remainingCount;

    if (count !== undefined) entry.count = newCount;
    entry.remainingCount = newRemaining;

    if (stockDelta !== 0) {
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { currentStock: stockDelta } },
        { session },
      );
    }

    // ── Scalar field updates ───────────────────────────────────
    if (price !== undefined) entry.price = price;
    if (retailPrice !== undefined) entry.retailPrice = retailPrice;
    if (note !== undefined) entry.note = note;
    if (stockDate !== undefined) entry.stockDate = new Date(stockDate);

    await entry.save({ session });
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
 * Delete a stock entry.
 * Decrements currentStock by the entry's remainingCount (already-sold units stay gone).
 * Admin only.
 */
const deleteStockEntry = async (productId, entryId, isShopKeeper) => {
  if (isShopKeeper)
    throw new AppError("ShopKeepers cannot delete stock entries", 403);
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new AppError("Invalid product ID", 400);
  if (!mongoose.Types.ObjectId.isValid(entryId))
    throw new AppError("Invalid stock entry ID", 400);

  const entry = await StockEntry.findOne({ _id: entryId, product: productId });
  if (!entry) throw new AppError("Stock entry not found", 404);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Only deduct the remaining (unsold) units from the live stock counter
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { currentStock: -entry.remainingCount } },
      { session },
    );

    await StockEntry.deleteOne({ _id: entryId }, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────
//  INTERNAL HELPERS
// ─────────────────────────────────────────────

const enrichProduct = async (product, isShopKeeper) => {
  const base = product.toObject();

  const activeBatches = await StockEntry.find(
    { product: product._id, remainingCount: { $gt: 0 } },
    isShopKeeper ? { price: 0 } : {},
  ).sort({ stockDate: -1, createdAt: -1 });

  const latestBatch = await StockEntry.findOne(
    { product: product._id },
    isShopKeeper ? { price: 0 } : {},
  ).sort({ stockDate: -1, createdAt: -1 });

  base.stockSummary = {
    currentStock: product.currentStock,
    totalBatches: activeBatches.length,
    lastRestocked:
      activeBatches[0]?.stockDate ?? activeBatches[0]?.createdAt ?? null,
  };

  if (latestBatch) {
    if (isShopKeeper) {
      base.priceSummary = {
        latestRetailPrice: latestBatch.retailPrice ?? null,
      };
    } else {
      const prices =
        activeBatches.length > 0
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
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  addStock,
  getStockHistory,
  editStockEntry,
  deleteStockEntry,
};
