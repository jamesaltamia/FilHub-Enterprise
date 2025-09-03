import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-md" />
            <span className="text-lg font-semibold">POS System</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">{user?.name}</div>
            <button onClick={handleLogout} className="btn-secondary py-2 px-3">Logout</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="card p-4 sticky top-6">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-lg`}
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pos"
                  className={({ isActive }) => `${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-lg`}
                >
                  POS
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/orders"
                  className={({ isActive }) => `${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-lg`}
                >
                  Orders
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/products"
                  className={({ isActive }) => `${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-lg`}
                >
                  Products
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/categories"
                  className={({ isActive }) => `${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-lg`}
                >
                  Categories
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
