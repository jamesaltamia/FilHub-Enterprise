import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common responses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Auth API methods
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    address?: string;
  }) => {
    const response = await api.post<ApiResponse>('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post<ApiResponse>('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, password: string, password_confirmation: string) => {
    const response = await api.post<ApiResponse>('/auth/reset-password', {
      email,
      otp,
      password,
      password_confirmation,
    });
    return response.data;
  },

  updateProfile: async (profileData: { name?: string; phone?: string; address?: string }) => {
    const response = await api.put<ApiResponse>('/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword: string, password: string, password_confirmation: string) => {
    const response = await api.put<ApiResponse>('/auth/change-password', {
      current_password: currentPassword,
      password,
      password_confirmation,
    });
    return response.data;
  },
};

// Dashboard API methods
export const dashboardAPI = {
  getOverview: async () => {
    const response = await api.get<ApiResponse>('/dashboard');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse>('/dashboard/stats');
    return response.data;
  },

  getRecentOrders: async () => {
    const response = await api.get<ApiResponse>('/dashboard/recent-orders');
    return response.data;
  },

  getLowStockProducts: async () => {
    const response = await api.get<ApiResponse>('/dashboard/low-stock-products');
    return response.data;
  },
};

// Products API methods
export const productsAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number;
    brand_id?: number;
    stock_status?: 'low' | 'out';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const response = await api.get<ApiResponse<PaginatedResponse>>('/products', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse>(`/products/${id}`);
    return response.data;
  },

  create: async (productData: FormData) => {
    const response = await api.post<ApiResponse>('/products', productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, productData: FormData) => {
    const response = await api.post<ApiResponse>(`/products/${id}?_method=PUT`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/products/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<ApiResponse>('/products/search', { params: { query } });
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get<ApiResponse>('/products/low-stock');
    return response.data;
  },

  updateStock: async (id: number, stockData: { stock_quantity: number; type: 'add' | 'subtract' | 'set' }) => {
    const response = await api.put<ApiResponse>(`/products/${id}/stock`, stockData);
    return response.data;
  },
};

// Categories API methods
export const categoriesAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: 'active' | 'inactive';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const response = await api.get<ApiResponse<PaginatedResponse>>('/categories', { params });
    return response.data;
  },

  getActive: async () => {
    const response = await api.get<ApiResponse>('/categories/active');
    return response.data;
  },

  create: async (categoryData: { name: string; description?: string; is_active?: boolean }) => {
    const response = await api.post<ApiResponse>('/categories', categoryData);
    return response.data;
  },

  update: async (id: number, categoryData: { name?: string; description?: string; is_active?: boolean }) => {
    const response = await api.put<ApiResponse>(`/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/categories/${id}`);
    return response.data;
  },
};

// Brands & Units for selects
export const brandsAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/brands');
    return response.data;
  },
};

export const unitsAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/units');
    return response.data;
  },
};

export const ordersAPI = {
  create: async (payload: { customer_id?: number; items: { product_id: number; qty: number; price: number }[]; paid_amount: number }) => {
    const response = await api.post<ApiResponse>('/orders', payload);
    return response.data;
  },
  list: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const response = await api.get<ApiResponse>('/orders', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse>(`/orders/${id}`);
    return response.data;
  },
};

// Export the main api instance for custom requests
export default api;

