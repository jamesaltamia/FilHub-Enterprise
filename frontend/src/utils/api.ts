const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API Request: ${options.method || 'GET'} ${url}`);

    const config: RequestInit = {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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

  async post(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
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
