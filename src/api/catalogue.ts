import axiosInstance from "./axiosInstance";

export interface PricingRule {
  ruleType: "CATEGORY" | "BRAND";
  referenceId: string;
  quantityValue: number;
  quantityUnit: string;
  increaseAmount: number;
}

export interface CatalogueData {
  catalogueName: string;
  customerName: string;
  customerType: string;
  place?: string;
  pricingRules?: PricingRule[];
}

export interface CatalogueResponse {
  _id: string;
  catalogueName: string;
  customerName: string;
  customerType: string;
  place?: string;
  pricingRules: PricingRule[];
  status: "draft" | "generated";
  generatedPdfUrl?: string;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const addCatalogue = async (catalogueData: CatalogueData) => {
  try {
    const response = await axiosInstance.post("/catalogues", catalogueData);
    return response.data;
  } catch (error) {
    console.error("Error adding catalogue:", error);
    throw error;
  }
};

export const getCatalogues = async (): Promise<CatalogueResponse[]> => {
  try {
    const response = await axiosInstance.get("/catalogues");
    return response.data;
  } catch (error) {
    console.error("Error fetching catalogues:", error);
    throw error;
  }
};