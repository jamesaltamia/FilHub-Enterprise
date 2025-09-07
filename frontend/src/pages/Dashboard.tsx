import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  recentOrders: any[];
}

const Dashboard: React.FC = () => {
  const { user, role, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    recentOrders: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, recentOrdersResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://127.0.0.1:8000/api/dashboard/recent-orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prev => ({ ...prev, ...statsData.data }));
      }

      if (recentOrdersResponse.ok) {
        const ordersData = await recentOrdersResponse.json();
        setStats(prev => ({ ...prev, recentOrders: ordersData.data }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-6`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
        <p className="text-blue-100 mt-1">
          You're logged in as a <span className="font-semibold capitalize">{role}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales.toLocaleString()}`}
          icon="💰"
          color="border-green-500"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="📋"
          color="border-blue-500"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="🏷️"
          color="border-purple-500"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon="👥"
          color="border-orange-500"
        />
      </div>

      {/* Role-based Content */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">⚠️ Low Stock Alert</h3>
            <div className="text-3xl font-bold text-red-600">{stats.lowStockProducts}</div>
            <p className="text-sm text-gray-600 mt-1">products need restocking</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Add New Product
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Create New Order
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                View Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'cashier' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">💼 Cashier Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              🛒 Open POS
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              📦 Check Inventory
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              📊 View Reports
            </button>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📋 Recent Orders</h3>
        </div>
        <div className="p-6">
          {stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-600">${order.total_amount}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.order_status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
