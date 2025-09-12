import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LowStockService } from '../utils/lowStockUtils';
import LowStockAlert from '../components/LowStockAlert';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  pendingOrders: number;
  todaysSales: number;
  recentOrders: any[];
}

const Dashboard: React.FC = () => {
  const { role } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    todaysSales: 0,
    recentOrders: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStockProductsList, setLowStockProductsList] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    const handleStorageChange = () => {
      fetchDashboardData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ordersUpdated', handleStorageChange);
    window.addEventListener('productsUpdated', handleStorageChange);
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ordersUpdated', handleStorageChange);
      window.removeEventListener('productsUpdated', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Load data from localStorage (real-time from Sales/Orders)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      
      // Calculate real-time stats
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
      const pendingOrders = orders.filter((order: any) => order.order_status === 'pending').length;
      // Calculate today's sales (orders from today)
      const today = new Date().toDateString();
      const todaysSales = orders
        .filter((order: any) => new Date(order.created_at).toDateString() === today)
        .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
      // Use the functional low stock threshold
      const lowStockProductsArray = products.filter((product: any) => {
        const stock = product.stock_quantity || product.stock || 0;
        return LowStockService.isLowStock({ ...product, stock });
      });
      const lowStockProducts = lowStockProductsArray.length;
      
      setStats({
        totalSales,
        totalOrders,
        totalProducts: products.length,
        totalCustomers: 0, // Will be calculated when customers are implemented
        lowStockProducts,
        pendingOrders,
        todaysSales,
        recentOrders: orders.reverse() // Show all orders (newest first)
      });
      
      // Store low stock products for modal
      setLowStockProductsList(lowStockProductsArray);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className={`rounded-lg shadow-sm border-l-4 ${color} p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{value}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">

        {/* Low Stock Alert */}
        <LowStockAlert 
          products={JSON.parse(localStorage.getItem('products') || '[]').map((p: any) => ({
            ...p,
            stock: p.stock_quantity || p.stock || 0
          }))}
          className="mb-6"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Revenue"
            value={`₱${stats.totalSales.toLocaleString()}`}
            icon="💰"
            color="border-yellow-500"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="📋"
            color="border-blue-800"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon="⏳"
            color="border-yellow-600"
          />
          <StatCard
            title="Today's Sales"
            value={`₱${stats.todaysSales.toLocaleString()}`}
            icon="📈"
            color="border-green-500"
          />
        </div>

        {/* Additional Stats for Admin */}
        {role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Low Stock Alert */}
            <div 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-yellow-500 p-6 ${
                stats.lowStockProducts > 0 ? 'animate-pulse cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
              }`}
              onClick={() => stats.lowStockProducts > 0 && setShowLowStockModal(true)}
            >
              <h3 className={`text-lg font-medium text-blue-900 dark:text-blue-400 mb-4 ${
                stats.lowStockProducts > 0 ? 'animate-bounce' : ''
              }`}>⚠️ Low Stock Alert</h3>
              <div className={`text-3xl font-bold ${
                stats.lowStockProducts > 0 ? 'text-red-600 animate-pulse' : 'text-yellow-600'
              }`}>{stats.lowStockProducts}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.lowStockProducts > 0 ? 'Click to view products' : 'products need restocking'}
              </p>
            </div>

            {/* Total Products */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-800 p-6">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-400 mb-4">🏷️ Total Products</h3>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-400">{stats.totalProducts}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">products in inventory</p>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-green-500 p-6">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-400 mb-4">✅ System Status</h3>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">Online</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">all systems operational</p>
            </div>
          </div>
        )}


        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-400">📋 Recent Orders</h3>
          </div>
          <div className="p-6">
            {stats.recentOrders.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {stats.recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600">
                    <div className="flex items-center space-x-3">
                      {/* Product Images for Completed Orders */}
                      {order.order_status === 'completed' && order.items && order.items.length > 0 && (
                        <div className="flex -space-x-1">
                          {order.items.slice(0, 2).map((item: any, index: number) => (
                            <div key={index} className="w-6 h-6 rounded-full border border-white dark:border-gray-800 overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">📦</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="w-6 h-6 rounded-full border border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">+{order.items.length - 2}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-400">Order #{order.order_number}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">₱{order.total_amount}</p>
                        {order.paid_amount && order.paid_amount > order.total_amount && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Change: ₱{(order.paid_amount - order.total_amount).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.order_status === 'completed' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : order.order_status === 'pending' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent orders</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Products Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">⚠️ Low Stock Products</h3>
                <button
                  onClick={() => setShowLowStockModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {lowStockProductsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Min Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lowStockProductsList.map((product: any) => (
                        <tr key={product.id} className="animate-pulse">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {product.image ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={product.image}
                                    alt={product.name}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">📦</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-red-600 animate-pulse">
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.min_stock_level || 5}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 animate-bounce">
                              ⚠️ Low Stock
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg">No low stock products</div>
                  <div className="text-gray-400 text-sm mt-1">All products are adequately stocked</div>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowLowStockModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
