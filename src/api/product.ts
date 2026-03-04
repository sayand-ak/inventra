import axiosInstance from "./axiosInstance";

export interface ProductFilters {
  name?: string;
  brandId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductDTO {
  name: string;
  brandId: string;
  categoryId: string;
  price?: number;
  retailPrice?: number;
  quantity?: number;
  count?: number;
  openingStock: number;
  description?: string;
}

export interface UpdateProductDTO {
  name?: string;
  brandId?: string;
  categoryId?: string;
  price?: number;
  retailPrice?: number;
  quantity?: number;
  count?: number;
  openingStock?: number;
  description?: string;
}

export const createProduct = async (data: CreateProductDTO) => {
  const response = await axiosInstance.post("/products", data);
  return response.data;
};

export const getProducts = async (filters: ProductFilters) => {
  const response = await axiosInstance.get("/products", {
    params: filters,
  });
  return response.data;
};

export const searchProducts = async (search: string) => {
  const response = await axiosInstance.get("/products/search", {
    params: { search },
  });
  return response.data;
};

export const getProductById = async (id: string) => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};

export const updateProduct = async (
  id: string,
  data: UpdateProductDTO
) => {
  const response = await axiosInstance.put(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};