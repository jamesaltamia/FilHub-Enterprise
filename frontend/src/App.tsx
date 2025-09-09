import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main app routes
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">Inventory Management</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="pos" element={<Sales />} />
        <Route path="sales" element={<Sales />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="customers" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">Customer Management</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="orders" element={<Orders />} />
        <Route path="reports" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="users" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">User Management</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
        <Route path="settings" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
