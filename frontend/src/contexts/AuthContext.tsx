import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authAPI } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  roles?: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token") || localStorage.getItem("auth_token")
  );
  const [role, setRole] = useState<string | null>(
    localStorage.getItem("role")
  );
  const [permissions, setPermissions] = useState<string[]>(
    JSON.parse(localStorage.getItem("permissions") || "[]")
  );
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    if (token && !user) {
      // Only fetch user if we have both token and no user data
      // Add a delay to prevent immediate API calls
      const timer = setTimeout(() => {
        fetchUser();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      console.log("Fetching user profile...");
      // Use the profile endpoint from authAPI
      const response = await authAPI.updateProfile({});
      console.log("Profile response:", response);

      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("User profile updated successfully");
      } else {
        // If profile fetch fails, keep existing user data but don't logout
        console.log("Profile fetch failed, keeping existing session");
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      // Don't clear session on profile fetch failure
      // Only logout if it's a real auth issue
      if (error?.response?.status === 401) {
        localStorage.clear();
        setUser(null);
        setToken(null);
        setRole(null);
        setPermissions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);

      const response = await authAPI.login(email, password);
      console.log("Login response:", response);

      if (response.success && response.data) {
        const loginData = response.data;
        const userData = loginData.user || loginData;
        const userToken = loginData.token || loginData.access_token;
        const userRole = loginData.role || "user";
        const userPermissions = loginData.permissions || [];

        if (!userData || !userToken) {
          throw new Error("Login response missing user or token");
        }

        setUser(userData);
        setToken(userToken);
        setRole(userRole);
        setPermissions(userPermissions);

        // Store in localStorage with correct key names
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", userToken);
        localStorage.setItem("auth_token", userToken); // Also store with auth_token key for API
        localStorage.setItem("role", userRole || "");
        localStorage.setItem("permissions", JSON.stringify(userPermissions));

        console.log("Login successful, user state updated");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("Logging out user");

    if (token) {
      authAPI.logout().catch(console.error);
    }

    localStorage.clear();
    setUser(null);
    setToken(null);
    setRole(null);
    setPermissions([]);

    console.log("Logout completed");
  };

  const hasRole = (roleName: string): boolean => {
    return role === roleName;
  };

  const hasPermission = (permissionName: string): boolean => {
    return permissions.includes(permissionName);
  };

  const value: AuthContextType = {
    user,
    token,
    role,
    permissions,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
