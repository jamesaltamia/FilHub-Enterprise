import api from "./api";
import type { ApiResponse, Customer } from "../types";

export const customersAPI = {
    find: async (customerId: string): Promise<ApiResponse<Customer>> => {
        const response = await api.get<ApiResponse<Customer>>(`/customer/${customerId}`);
        return response.data;
    },
};
