import axiosInstance from "./axiosInstance";

export interface Brand {
  _id: string;
  name: string;
  type: string;
  description?: string;
  isDeleted?: boolean;
}

export interface CreateBrandDTO {
  name: string;
  type: string;
  description?: string;
}

export interface UpdateBrandDTO {
  name?: string;
  type?: string;
  description?: string;
}

export interface BrandFilters {
  name?: string;
  type?: string;
}

export const createBrand = async (data: CreateBrandDTO) => {
  const response = await axiosInstance.post("/brands", data);
  return response.data;
};

export const getAllBrands = async () => {
  const response = await axiosInstance.get("/brands");
  return response.data;
};

export const getBrandById = async (id: string) => {
  const response = await axiosInstance.get(`/brands/${id}`);
  return response.data;
};

export const updateBrand = async (
  id: string,
  data: UpdateBrandDTO
) => {
  const response = await axiosInstance.put(`/brands/${id}`, data);
  return response.data;
};

export const deleteBrand = async (id: string) => {
  await axiosInstance.delete(`/brands/${id}`);
};

export const filterBrands = async (filters: BrandFilters) => {
  const response = await axiosInstance.get("/brands/filter", {
    params: filters,
  });
  return response.data;
};