import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

// User interface
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, otp: string, password: string, password_confirmation: string) => Promise<void>;
  updateProfile: (profileData: { name?: string; phone?: string; address?: string }) => Promise<void>;
  changePassword: (currentPassword: string, password: string, password_confirmation: string) => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    address?: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        const { user: newUser, token: authToken } = response.data;
        
        setUser(newUser);
        setToken(authToken);
        
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      const response = await authAPI.forgotPassword(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  // Verify OTP function
  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await authAPI.verifyOtp(email, otp);
      
      if (!response.success) {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email: string, otp: string, password: string, password_confirmation: string) => {
    try {
      const response = await authAPI.resetPassword(email, otp, password, password_confirmation);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (profileData: { name?: string; phone?: string; address?: string }) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, password: string, password_confirmation: string) => {
    try {
      const response = await authAPI.changePassword(currentPassword, password, password_confirmation);
      
      if (!response.success) {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

