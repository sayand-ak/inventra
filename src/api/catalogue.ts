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

export interface LineItem {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  flavour: string;
  quantity: { value: number; unit: string };
  basePrice: number;
  baseRetailPrice: number;
  increaseAmount: number;
  cataloguePrice: number;
  currentStock: number;
}

export interface GenerateResponse {
  catalogue: {
    _id: string;
    catalogueName: string;
    customerName: string;
    customerType: string;
    place?: string;
    generatedAt: string;
    pricingRules?: PricingRule[];
  };
  grouped: Record<string, LineItem[]>;
  lineItems: LineItem[];
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

export const generateCatalogue = async (catalogueId: string): Promise<GenerateResponse> => {
  try {    
    const response = await axiosInstance.post(`/catalogues/${catalogueId}/generate`);
    return response.data;
  } catch (error) {
    console.error("Error generating catalogue:", error);
    throw error;
  }
};