import axiosInstance from "./axiosInstance";

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      isAdmin: boolean;
      isShopKeeper: boolean;
    };
  };
}

export const loginUser = async (
  credentials: LoginDTO
): Promise<LoginResponse> => {
  const response = await axiosInstance.post("/auth/login", credentials);

  const { token } = response.data.data;
  localStorage.setItem("token", token);

  return response.data;
};