import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../services/api';
import { TwoFactorAuthService } from '../utils/twoFactorAuth';
import TwoFactorVerification from '../components/TwoFactorVerification';

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
  updateUser: (userData: Partial<User>) => void;
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
  const [showTwoFactorVerification, setShowTwoFactorVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState<User & { token?: string; role?: string; permissions?: string[] } | null>(null);


  // Restore session on mount
  useEffect(() => {
    console.log('AuthContext useEffect - token:', token, 'user:', user);
    
    if (token && !user) {
      // For demo tokens, don't fetch from API
      if (token.startsWith('demo_token_')) {
        console.log('Demo token found, setting loading to false');
        setIsLoading(false);
        return;
      }
    }
    
    // Always set loading to false after checking
    console.log('Setting isLoading to false');
    setIsLoading(false);
  }, [token, user]);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);

      // First try API login with timeout
      try {
        console.log("Trying API login...");
        const response = await authAPI.login(email, password);
        console.log("API Login successful:", response);

        if (response.success && response.data) {
          const loginData = response.data;
          const userData = loginData.user || loginData;
          
          // Check if user has 2FA enabled
          const has2FA = TwoFactorAuthService.is2FAEnabled(userData.email);
          console.log(`2FA check for ${userData.email}: ${has2FA}`);
          
          if (has2FA) {
            console.log("Showing 2FA verification modal for API user");
            // Show 2FA verification modal - store token and role info for later
            const userWithToken = {
              ...userData,
              token: response.data.token,
              role: userData.role || 'user',
              permissions: userData.permissions || []
            };
            setPendingUser(userWithToken);
            setShowTwoFactorVerification(true);
            return;
          }

          console.log("Completing API login without 2FA");
          // Complete login without 2FA - set admin role for demo
          setUser(userData);
          setToken(response.data.token);
          setRole('admin');
          setPermissions(['manage_users', 'manage_inventory', 'view_reports']);
          
          // Store in localStorage
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("auth_token", response.data.token);
          localStorage.setItem("role", 'admin');
          localStorage.setItem("permissions", JSON.stringify(['manage_users', 'manage_inventory', 'view_reports']));

          console.log("API Login successful, user state updated");
          return;
        }
      } catch {
        console.log("API login failed (expected in demo mode), using localStorage fallback");
      }

      // Fallback: Check localStorage users (demo mode)
      console.log("Using localStorage authentication...");
      const localUsers = localStorage.getItem('filhub_users');
      console.log("localStorage users data:", localUsers);
      console.log("All localStorage keys:", Object.keys(localStorage));
      
      if (localUsers) {
        const users = JSON.parse(localUsers);
        console.log("Parsed users:", users);
        console.log("Looking for email:", email, "password:", password);
        
        // Debug: Log all users first
        users.forEach((u: User & { password?: string; role?: string; status?: string }, index: number) => {
          console.log(`User ${index}:`, {
            id: u.id,
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            status: u.status
          });
        });
        
        console.log("Input credentials:", { email, password });
        
        const foundUser = users.find((user: User & { password?: string; role?: string }) => {
          const emailMatch = user.email?.toLowerCase().trim() === email.toLowerCase().trim();
          const passwordMatch = user.password?.trim() === password.trim();
          return emailMatch && passwordMatch;
        });
        
        console.log("Found user:", foundUser);
        
        if (foundUser) {
          // Check if user has 2FA enabled
          const has2FA = TwoFactorAuthService.is2FAEnabled(foundUser.email);
          console.log(`2FA check for ${foundUser.email}: ${has2FA}`);
          
          if (has2FA) {
            console.log("Showing 2FA verification modal");
            // Show 2FA verification modal
            setPendingUser(foundUser);
            setShowTwoFactorVerification(true);
            return;
          }

          console.log("Completing login without 2FA");
          // Complete login without 2FA
          completeLogin(foundUser);
          return;
        } else {
          console.log("No matching user found in localStorage");
        }
      } else {
        console.log("No localStorage users found");
        // Force initialize localStorage with default users if empty
        const defaultUsers = [
          { id: 1, name: 'Admin User', email: 'admin@filhub.com', role: 'admin', status: 'active', password: 'admin123' },
          { id: 2, name: 'Cashier User', email: 'cashier@filhub.com', role: 'cashier', status: 'active', password: 'cashier123' }
        ];
        localStorage.setItem('filhub_users', JSON.stringify(defaultUsers));
        console.log("Initialized localStorage with default users");
        
        // Try to find user in default users
        const foundUser = defaultUsers.find(u => u.email === email && u.password === password);
        if (foundUser) {
          completeLogin(foundUser);
          return;
        }
      }

      // If both API and localStorage fail
      throw new Error("Invalid email or password");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const completeLogin = (foundUser: User & { role?: string }) => {
    const demoToken = `demo_token_${Date.now()}`;
    const userData = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      phone: '',
      address: ''
    };

    setUser(userData);
    setToken(demoToken);
    const userRole = foundUser.role || 'user';
    setRole(userRole);
    setPermissions(userRole === 'admin' ? ['manage_users', 'manage_inventory', 'view_reports'] : ['manage_sales']);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", demoToken);
    localStorage.setItem("auth_token", demoToken);
    localStorage.setItem("role", userRole);
    localStorage.setItem("permissions", JSON.stringify(userRole === 'admin' ? ['manage_users', 'manage_inventory', 'view_reports'] : ['manage_sales']));

    console.log("Login successful for:", foundUser.name);
  };

  const handle2FASuccess = () => {
    if (pendingUser) {
      console.log("2FA Success - pendingUser:", pendingUser);
      
      // For API users, we need to set the token from the original response
      if (pendingUser.token) {
        console.log("Processing API user 2FA success");
        const userData = {
          id: pendingUser.id,
          name: pendingUser.name,
          email: pendingUser.email,
          phone: pendingUser.phone || '',
          address: pendingUser.address || ''
        };
        
        // For demo purposes, set admin role for API users since they don't have role in response
        const userRole = 'admin';
        const userPermissions = pendingUser.permissions || (userRole === 'admin' ? ['manage_users', 'manage_inventory', 'view_reports'] : ['manage_sales']);
        
        console.log("Setting role:", userRole);
        console.log("Setting permissions:", userPermissions);
        
        setUser(userData);
        setToken(pendingUser.token);
        setRole(userRole);
        setPermissions(userPermissions);
        
        // Store in localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", pendingUser.token);
        localStorage.setItem("auth_token", pendingUser.token);
        localStorage.setItem("role", userRole);
        localStorage.setItem("permissions", JSON.stringify(userPermissions));
        
        console.log("API user 2FA login completed");
      } else {
        // For localStorage users, use completeLogin
        console.log("Processing localStorage user 2FA success");
        completeLogin(pendingUser);
      }
      
      setShowTwoFactorVerification(false);
      setPendingUser(null);
    }
  };

  const handle2FACancel = () => {
    setShowTwoFactorVerification(false);
    setPendingUser(null);
  };

  const logout = () => {
    console.log("Logging out user");

    if (token) {
      authAPI.logout().catch(() => {
        // Ignore logout API errors - user is logging out anyway
      });
    }

    // Clear auth data but preserve user list, 2FA data, and business data
    const users = localStorage.getItem('filhub_users');
    const categories = localStorage.getItem('categories');
    const products = localStorage.getItem('products');
    const orders = localStorage.getItem('orders');
    const customers = localStorage.getItem('customers');
    const twoFactorKeys = Object.keys(localStorage).filter(key => key.startsWith('2fa_'));
    const twoFactorData: { [key: string]: string } = {};
    
    // Save 2FA data
    twoFactorKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        twoFactorData[key] = value;
      }
    });
    
    localStorage.clear();
    
    // Restore preserved data
    if (users) {
      localStorage.setItem('filhub_users', users);
    }
    
    // Restore business data
    if (categories) {
      localStorage.setItem('categories', categories);
    }
    
    if (products) {
      localStorage.setItem('products', products);
    }
    
    if (orders) {
      localStorage.setItem('orders', orders);
    }
    
    if (customers) {
      localStorage.setItem('customers', customers);
    }
    
    // Restore 2FA data
    Object.keys(twoFactorData).forEach(key => {
      localStorage.setItem(key, twoFactorData[key]);
    });
    
    setUser(null);
    setToken(null);
    setRole(null);
    setPermissions([]);

    console.log("Logout completed - business data preserved");
  };

  const hasRole = (roleName: string): boolean => {
    return role === roleName;
  };

  const updateUser = (userData: Partial<User>) => {
    console.log('updateUser called with:', userData);
    console.log('Current user:', user);
    if (user) {
      const updatedUser = { ...user, ...userData };
      console.log('Updated user:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log('User state and localStorage updated');
    } else {
      console.log('No user found, cannot update');
    }
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
    updateUser,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>{children}
      {showTwoFactorVerification && pendingUser && (
        <TwoFactorVerification
          userEmail={pendingUser.email}
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      )}
    </AuthContext.Provider>
  );
};
