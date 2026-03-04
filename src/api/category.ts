import axiosInstance from "./axiosInstance";

interface CategoryData {
  name: string;
  description?: string;
}

interface CategoryResponse {
  _id: number;
  name: string;
  description?: string;
}

export const addCategory = async (categoryData: CategoryData) => {
  try {
    const response = await axiosInstance.post("/categories", categoryData);
    return response.data;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const getCategories = async (): Promise<CategoryResponse[]> => {
  try {
    const response = await axiosInstance.get("/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getCategoryById = async (id: number): Promise<CategoryResponse> => {
  try {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category with id ${id}:`, error);
    throw error;
  }
};

export const updateCategory = async (id: number, categoryData: CategoryData) => {
  try {
    const response = await axiosInstance.put(`/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating category with id ${id}:`, error);
    throw error;
  }
};

export const deleteCategory = async (id: number) => {
  try {
    await axiosInstance.delete(`/categories/${id}`);
  } catch (error) {
    console.error(`Error deleting category with id ${id}:`, error);
    throw error;
  }
};