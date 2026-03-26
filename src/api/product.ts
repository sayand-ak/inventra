import axiosInstance from "./axiosInstance";

// ─────────────────────────────────────────────
//  SHARED TYPES
// ─────────────────────────────────────────────

export interface Quantity {
  value: number;
  unit: "kg" | "g" | "mg" | "litre" | "ml" | "tablet" | "box" | "bottle" | "piece";
}

export interface StockSummary {
  currentStock: number;
  totalBatches: number;
  lastRestocked: string | null;
}

export interface PriceSummary {
  latestPrice: number;
  latestRetailPrice: number | null;
  priceRange: { min: number; max: number };
}

export interface Product {
  _id: string;
  name: string;
  brand: { _id: string; name: string };
  category: { _id: string; name: string };
  flavour: string;
  quantity: Quantity;
  description?: string;
  currentStock: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Enriched fields (always present)
  stockSummary: StockSummary;
  // Admin only
  priceSummary?: PriceSummary;
}

export interface StockEntry {
  _id: string;
  product: string;
  count: number;
  remainingCount: number;
  note?: string;
  stockDate: string;      // ← new
  createdAt: string;
  updatedAt: string;
  price?: number;
  retailPrice?: number;
}

export interface AddStockDTO {
  count: number;
  price?: number;
  retailPrice?: number;
  note?: string;
  stockDate?: string;     // ← new: ISO date string, optional
}

export interface EditStockEntryDTO {
  count?: number;
  remainingCount?: number
  price?: number;
  retailPrice?: number;
  note?: string;
  stockDate?: string;
}


export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

// ─────────────────────────────────────────────
//  DTOs
// ─────────────────────────────────────────────

export interface ProductFilters {
  name?: string;
  brandId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

/** Price and stock are no longer part of product creation — use addStock() after creating. */
export interface CreateProductDTO {
  name: string;
  brandId: string;
  categoryId: string;
  quantity?: Quantity;
  description?: string;
  flavour?: string;
}

export interface UpdateProductDTO {
  name?: string;
  brandId?: string;
  categoryId?: string;
  quantity?: Quantity;
  description?: string;
  flavour?: string;
}

/** Admin must supply price. ShopKeeper omits it (admin fills it in later via updateStockEntry). */
export interface AddStockDTO {
  count: number;
  price?: number;
  retailPrice?: number;
  note?: string;
}

export interface UpdateStockEntryDTO {
  price?: number;
  retailPrice?: number;
  note?: string;
}

// ─────────────────────────────────────────────
//  PRODUCT CRUD
// ─────────────────────────────────────────────

export const createProduct = async (data: CreateProductDTO): Promise<Product> => {
  const response = await axiosInstance.post("/products", data);
  return response.data;
};

export const getProducts = async (filters: ProductFilters): Promise<PaginatedProducts> => {
  const response = await axiosInstance.get("/products", { params: filters });
  return response.data;
};

export const searchProducts = async (search: string): Promise<Product[]> => {
  const response = await axiosInstance.get("/products/search", {
    params: { search },
  });
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};

export const updateProduct = async (
  id: string,
  data: UpdateProductDTO
): Promise<Product> => {
  const response = await axiosInstance.put(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/products/${id}`);
};

// ─────────────────────────────────────────────
//  STOCK MANAGEMENT
// ─────────────────────────────────────────────

/** Add a new stock batch for a product (each batch can have a different price). */
export const addStock = async (
  productId: string,
  data: AddStockDTO
): Promise<StockEntry> => {
  const response = await axiosInstance.post(`/products/${productId}/stock`, data);
  return response.data;
};

/** Get the full stock history for a product (admins see prices, shopkeepers don't). */
export const getStockHistory = async (
  productId: string
): Promise<{ product: Product; entries: StockEntry[] }> => {
  const response = await axiosInstance.get(`/products/${productId}/stock`);
  return response.data;
};

/** Admin only — update price/retailPrice/note on a specific stock batch. */
export const updateStockEntry = async (
  productId: string,
  entryId: string,
  data: UpdateStockEntryDTO
): Promise<StockEntry> => {
  const response = await axiosInstance.patch(
    `/products/${productId}/stock/${entryId}`,
    data
  );
  return response.data;
};

/** Edit an existing stock batch (count, price, retailPrice, note, stockDate). */
export const editStockEntry = async (
  productId: string,
  entryId: string,
  data: EditStockEntryDTO
): Promise<StockEntry> => {
  const response = await axiosInstance.put(
    `/products/${productId}/stock/${entryId}`,
    data
  );
  return response.data;
};

/** Delete a stock batch (admin only). */
export const deleteStockEntry = async (
  productId: string,
  entryId: string
): Promise<void> => {
  await axiosInstance.delete(`/products/${productId}/stock/${entryId}`);
};