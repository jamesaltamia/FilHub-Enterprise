import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';

interface TopNavbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  
  console.log('TopNavbar render - user:', user);

  // Function to get current page name based on route
  const getCurrentPageName = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/categories':
        return 'Categories';
      case '/orders':
        return 'Orders';
      case '/pos':
      case '/sales':
        return 'Sales';
      case '/customers':
        return 'Customers';
      case '/reports':
        return 'Reports';
      case '/users':
        return 'Users';
      case '/settings':
        return 'Settings';
      case '/inventory':
        return 'Inventory';
      default:
        return 'Dashboard';
    }
  };

  return (
    <nav className="bg-blue-900 shadow-lg border-b border-blue-800 h-16 flex items-center justify-between px-4 relative z-50">
      {/* Left Section - Hamburger Menu and Logo */}
      <div className="flex items-center space-x-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-white hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <img 
            src="/Filamer_Christian_University.jpg" 
            alt="Filamer Christian University Logo" 
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="text-white">
            <div className="text-xl font-bold text-yellow-400">FilHub</div>
            <div className="text-xs text-yellow-200">Enterprise</div>
          </div>
        </div>
      </div>

      {/* Right Section - Language, POS, Dashboard, User Profile */}
      <div className="flex items-center space-x-4">
        {/* Language Selector */}
        <div className="flex items-center space-x-1 text-white text-sm">
          <span>English</span>
        </div>

        {/* POS Button */}
        <Link 
          to="/pos"
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          POS
        </Link>

        {/* Current Page Button */}
        <button className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
          {getCurrentPageName()}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-2 text-white hover:bg-blue-800 px-3 py-2 rounded-md transition-colors">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-blue-900 font-semibold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm font-medium">{user?.name || (role === 'admin' ? 'Admin' : 'User')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600">
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
