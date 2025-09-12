import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavigationItem {
  name: string;
  path?: string;   // parent menus won’t always have a path
  icon: string;
  roles: string[];
  children?: NavigationItem[]; // allow submenus
}

interface NavigationProps {
  isOpen: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isOpen }) => {
  const { user, role } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      roles: ['admin', 'cashier']
    },
    {
      name: 'Inventory',
      icon: '📦',
      roles: ['admin', 'cashier'],
      children: [
        { name: 'Categories', path: '/categories', icon: '📁', roles: ['admin'] },
        { name: 'Orders', path: '/orders', icon: '📋', roles: ['admin', 'cashier'] }
      ]
    },
    {
      name: 'Sales',
      path: '/pos',
      icon: '🛒',
      roles: ['admin', 'cashier']
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: '👥',
      roles: ['admin']
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


  if (!user) return null;

  return (
    <nav className={`bg-blue-900 shadow-lg border-r border-blue-800 w-64 min-h-screen transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } fixed z-40`}>
      <div className="px-6 py-4">


        {/* Navigation Menu */}
        <div className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = item.path && location.pathname === item.path;

            // If item has children (collapsible)
            if (item.children) {
              const isOpen = openMenu === item.name;
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setOpenMenu(isOpen ? null : item.name)}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isOpen
                        ? 'bg-yellow-500 text-blue-900'
                        : 'text-gray-200 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                    <span className="ml-auto">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Submenu */}
                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children
                        .filter((child) => role && child.roles.includes(role))
                        .map((child) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={child.path}
                              to={child.path!}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                isChildActive
                                  ? 'bg-yellow-500 text-blue-900'
                                  : 'text-gray-200 hover:bg-blue-800 hover:text-white'
                              }`}
                            >
                              <span className="mr-2">{child.icon}</span>
                              {child.name}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            }

            // Normal item
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-yellow-500 text-blue-900 border-r-2 border-yellow-400'
                    : 'text-gray-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
};

export default Navigation;
