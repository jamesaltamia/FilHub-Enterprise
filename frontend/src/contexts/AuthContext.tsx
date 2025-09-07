import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../utils/api";

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
    localStorage.getItem("token")
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
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      console.log("Fetching user with token:", token?.substring(0, 20) + "...");
      const response = await api.get("/user", token || undefined);
      console.log("API Response:", response);

      const userData = response.data?.user || response.data || null;
      const userRole = response.data?.role || role || null;
      const userPermissions = response.data?.permissions || permissions || [];

      if (!userData) {
        throw new Error("User data not found in /user response");
      }

      setUser(userData);
      setRole(userRole);
      setPermissions(userPermissions);

      // persist
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("role", userRole || "");
      localStorage.setItem("permissions", JSON.stringify(userPermissions));

      console.log("User state restored successfully");
    } catch (error: any) {
      console.error("Error fetching user:", error);
      localStorage.clear();
      setUser(null);
      setToken(null);
      setRole(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);

      const response = await api.post("/auth/login", { email, password });
      console.log("Full login response:", response.data);

      const loginData = response.data?.data || response.data || {};

      const userData = loginData.user || null;
      const userToken = loginData.token || null;
      const userRole = loginData.role || null;
      const userPermissions = loginData.permissions || [];

      if (!userData || !userToken) {
        throw new Error("Login response missing user or token");
      }

      setUser(userData);
      setToken(userToken);
      setRole(userRole);
      setPermissions(userPermissions);

      // ✅ persist
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userToken);
      localStorage.setItem("role", userRole || "");
      localStorage.setItem("permissions", JSON.stringify(userPermissions));

      console.log("Login successful, user state updated");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("Logging out user");

    if (token) {
      api.post("/auth/logout", {}, token).catch(console.error);
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
