import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with aggressive performance settings
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1500, // Very aggressive 1.5 second timeout for instant fallback
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  // Performance optimizations
  maxRedirects: 0, // Disable redirects for faster response
  validateStatus: (status) => status < 500, // Accept all non-server-error responses
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
    // Suppress console errors for demo mode - only log critical auth failures
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/') || url.includes('/login') || url.includes('/logout');
    
    if (error.response?.status === 401 && isAuthEndpoint) {
      // Unauthorized on auth endpoints - clear token and redirect to login
      console.log('Authentication failed, redirecting to login');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Silently handle all other API failures (expected in demo mode)
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
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    payment_status?: 'pending' | 'partial' | 'paid';
    order_status?: 'pending' | 'processing' | 'completed' | 'cancelled';
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const response = await api.get<ApiResponse<PaginatedResponse>>('/orders', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse>(`/orders/${id}`);
    return response.data;
  },

  create: async (orderData: {
    customer_id?: number;
    items: { product_id: number; qty: number; price: number }[];
    paid_amount: number;
    discount_amount?: number;
    tax_amount?: number;
    notes?: string;
    order_status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  }) => {
    const response = await api.post<ApiResponse>('/orders', orderData);
    return response.data;
  },

  update: async (id: number, orderData: {
    order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
    payment_status?: 'pending' | 'partial' | 'paid';
    paid_amount?: number;
    notes?: string;
  }) => {
    const response = await api.put<ApiResponse>(`/orders/${id}`, orderData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, status: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    const response = await api.put<ApiResponse>(`/orders/${id}/status`, { status });
    return response.data;
  },

  updatePayment: async (id: number, paidAmount: number) => {
    const response = await api.put<ApiResponse>(`/orders/${id}/payment`, { paid_amount: paidAmount });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse>('/orders/stats');
    return response.data;
  },

  // Legacy methods for backward compatibility
  list: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const response = await api.get<ApiResponse>('/orders', { params });
    return response.data;
  },
};

// Customers API methods
export const customersAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const response = await api.get<ApiResponse<PaginatedResponse>>('/customers', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse>(`/customers/${id}`);
    return response.data;
  },

  create: async (customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    education_level?: string;
    year?: string;
    grade_level?: string;
    section?: string;
    strand?: string;
    college?: string;
    course?: string;
  }) => {
    const response = await api.post<ApiResponse>('/customers', customerData);
    return response.data;
  },

  update: async (id: number, customerData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    education_level?: string;
    year?: string;
    grade_level?: string;
    section?: string;
    strand?: string;
    college?: string;
    course?: string;
    is_active?: boolean;
  }) => {
    const response = await api.put<ApiResponse>(`/customers/${id}`, customerData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/customers/${id}`);
    return response.data;
  },
};

// Users API methods
export const usersAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const response = await api.get<ApiResponse<PaginatedResponse>>('/users', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse>(`/users/${id}`);
    return response.data;
  },

  create: async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: string;
    status?: string;
    phone?: string;
    address?: string;
  }) => {
    const response = await api.post<ApiResponse>('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    phone?: string;
    address?: string;
  }) => {
    const response = await api.put<ApiResponse>(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },

  updatePassword: async (id: number, passwordData: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    const response = await api.put<ApiResponse>(`/users/${id}/password`, passwordData);
    return response.data;
  },
};

// Reports API methods
export const reportsAPI = {
  getSalesReport: async (params?: {
    date_from?: string;
    date_to?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }) => {
    const response = await api.get<ApiResponse>('/reports/sales', { params });
    return response.data;
  },

  getProductsReport: async (params?: {
    date_from?: string;
    date_to?: string;
    category_id?: number;
  }) => {
    const response = await api.get<ApiResponse>('/reports/products', { params });
    return response.data;
  },

  getCustomersReport: async (params?: {
    date_from?: string;
    date_to?: string;
  }) => {
    const response = await api.get<ApiResponse>('/reports/customers', { params });
    return response.data;
  },

  getInventoryReport: async () => {
    const response = await api.get<ApiResponse>('/reports/inventory');
    return response.data;
  },

  exportReport: async (type: 'sales' | 'products' | 'customers' | 'inventory', format: 'pdf' | 'excel', params?: any) => {
    const response = await api.get<Blob>(`/reports/${type}/export`, {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response;
  },
};

// Settings API methods
export const settingsAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/settings');
    return response.data;
  },

  update: async (settings: {
    low_stock_threshold?: number;
    currency?: string;
    tax_rate?: number;
    business_name?: string;
    business_address?: string;
    business_phone?: string;
    business_email?: string;
    receipt_footer?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
  }) => {
    const response = await api.put<ApiResponse>('/settings', settings);
    return response.data;
  },

  getBusinessInfo: async () => {
    const response = await api.get<ApiResponse>('/settings/business');
    return response.data;
  },

  updateBusinessInfo: async (businessData: {
    business_name?: string;
    business_address?: string;
    business_phone?: string;
    business_email?: string;
    business_logo?: string;
  }) => {
    const response = await api.put<ApiResponse>('/settings/business', businessData);
    return response.data;
  },
};

// Enhanced Dashboard API methods
export const enhancedDashboardAPI = {
  getOverview: async () => {
    const response = await api.get<ApiResponse>('/dashboard/overview');
    return response.data;
  },

  getStats: async (period?: 'today' | 'week' | 'month' | 'year') => {
    const response = await api.get<ApiResponse>('/dashboard/stats', { params: { period } });
    return response.data;
  },

  getRecentActivity: async (limit?: number) => {
    const response = await api.get<ApiResponse>('/dashboard/recent-activity', { params: { limit } });
    return response.data;
  },

  getTopProducts: async (limit?: number) => {
    const response = await api.get<ApiResponse>('/dashboard/top-products', { params: { limit } });
    return response.data;
  },

  getTopCustomers: async (limit?: number) => {
    const response = await api.get<ApiResponse>('/dashboard/top-customers', { params: { limit } });
    return response.data;
  },

  getSalesChart: async (period?: 'week' | 'month' | 'year') => {
    const response = await api.get<ApiResponse>('/dashboard/sales-chart', { params: { period } });
    return response.data;
  },
};

// Students API methods
export const studentsAPI = {
  import: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse>(
      "/students/import",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  search: async (studentId: string) => {
    const response = await api.get<ApiResponse>(
      "/students/search",
      { params: { id: studentId } }
    );
    return response.data;
  },
};

// Export the main api instance for custom requests
export default api;

