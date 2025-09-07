import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavigationItem {
  name: string;
  path: string;
  icon: string;
  roles: string[];
}

const Navigation: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      roles: ['admin', 'cashier']
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: '📦',
      roles: ['admin', 'cashier']
    },
    {
      name: 'POS',
      path: '/pos',
      icon: '🛒',
      roles: ['admin', 'cashier']
    },
    {
      name: 'Products',
      path: '/products',
      icon: '🏷️',
      roles: ['admin']
    },
    {
      name: 'Categories',
      path: '/categories',
      icon: '📁',
      roles: ['admin']
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: '👥',
      roles: ['admin', 'cashier']
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: '📋',
      roles: ['admin', 'cashier']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: '📈',
      roles: ['admin', 'cashier']
    },
    {
      name: 'Users',
      path: '/users',
      icon: '👤',
      roles: ['admin']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: '⚙️',
      roles: ['admin']
    }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    role ? item.roles.includes(role) : false
  );

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-lg border-r border-gray-200 w-64 min-h-screen">
      <div className="px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center mb-8">
          <div className="text-2xl font-bold text-blue-600">FilHub</div>
          <div className="ml-2 text-sm text-gray-500">Enterprise</div>
        </div>

        {/* User Info */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize">{role || 'Loading...'}</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
          >
            <span className="mr-3">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
