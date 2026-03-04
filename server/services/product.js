import mongoose from "mongoose";
import Product from "../db/models/Product.js";
import Brand from "../db/models/Brand.js";
import Category from "../db/models/Category.js";
import { AppError } from "../utils/CustomError.js";

const addProduct = async (productData, isShopKeeper) => {
  const {
    name,
    brandId,
    categoryId,
    price,
    quantity,
    count,
    openingStock,
    retailPrice,
    description
  } = productData;  

  // Ensure brand & category exist
  const [brandExists, categoryExists] = await Promise.all([
    Brand.exists({ _id: brandId }),
    Category.exists({ _id: categoryId })
  ]);

  if (!brandExists) {
    throw new AppError("Brand not found", 404);
  }

  if (!categoryExists) {
    throw new AppError("Category not found", 404);
  }

  if (isShopKeeper && price !== undefined) {
    throw new AppError("ShopKeeper cannot set actual price", 403);
  }

  // Admin must set price
  if (!isShopKeeper && price === undefined) {
    throw new AppError("Price is required", 400);
  }

  // Prevent duplicate product
  const duplicate = await Product.exists({
    name: name.trim(),
    brand: brandId,
    category: categoryId
  });

  if (duplicate) {
    throw new AppError("Product already exists", 409);
  }

  const product = await Product.create({
    name: name.trim(),
    brand: brandId,
    category: categoryId,
    price: isShopKeeper ? undefined : price,
    retailPrice,
    quantity,
    count,
    openingStock,
    currentStock: openingStock,
    description
  });

  return product;
};

const getProducts = async (filters, pagination, isShopKeeper) => {
  const { name, brandId, categoryId } = filters;
  const { page = 1, limit = 10 } = pagination;

  const query = {};

  if (name) {
    query.name = { $regex: name, $options: "i" };
  }

  if (brandId) {
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      throw new AppError("Invalid brandId", 400);
    }
    query.brand = brandId;
  }

  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("Invalid categoryId", 400);
    }
    query.category = categoryId;
  }

  const projection = isShopKeeper
    ? { price: 0 }  // exclude price
    : {};

  const products = await Product.find(query, projection)
    .populate("brand", "name")
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Product.countDocuments(query);

  return {
    products,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

const getProductById = async (id, isShopKeeper) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product ID", 400);
  }

  const projection = isShopKeeper ? { price: 0 } : {};

  const product = await Product.findById(id, projection)
    .populate("brand", "name")
    .populate("category", "name");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

const updateProduct = async (id, updateData) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const {
    name,
    brandId,
    categoryId,
    openingStock,
    ...rest
  } = updateData;

  // If brand is being updated
  if (brandId) {
    const brandExists = await Brand.exists({ _id: brandId });
    if (!brandExists) {
      throw new AppError("Brand not found", 404);
    }
    product.brand = brandId;
  }

  // If category is being updated
  if (categoryId) {
    const categoryExists = await Category.exists({ _id: categoryId });
    if (!categoryExists) {
      throw new AppError("Category not found", 404);
    }
    product.category = categoryId;
  }

  // Update name if provided
  if (name) {
    product.name = name.trim();
  }

  // Handle opening stock change
  if (openingStock !== undefined) {
    const stockDifference = openingStock - product.openingStock;
    product.currentStock += stockDifference;
    product.openingStock = openingStock;
  }

  // Update remaining simple fields
  Object.assign(product, rest);

  await product.save();

  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.isDeleted = true;
  await product.save();
}

const searchProducts = async (searchTerm) => {
  const products = await Product.find({
    name: { $regex: searchTerm, $options: "i" },
    isDeleted: false
  })
    .populate("brand", "name")
    .populate("category", "name");

  return products;
};

export default { addProduct, getProducts, getProductById, updateProduct, deleteProduct, searchProducts };