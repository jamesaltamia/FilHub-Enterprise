const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API Request: ${options.method || 'GET'} ${url}`);

    const config: RequestInit = {
      ...options,
      headers: {
        // Don't set Content-Type for FormData - let browser handle it
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      console.log(`API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);

        let errorMessage = 'Request failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API Success Response:', data);

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },

  async get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return this.request(endpoint, { method: 'GET', headers });
  },

  async post(endpoint: string, data: any, token?: string, customHeaders?: Record<string, string>) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    // Handle FormData for file uploads
    const isFormData = data instanceof FormData;
    
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: {
        ...headers,
        ...(customHeaders || {}),
        // Don't set Content-Type for FormData, let browser set it with boundary
        ...(isFormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
  },

  async put(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers,
    });
  },

  async delete(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return this.request(endpoint, { method: 'DELETE', headers });
  },
};
