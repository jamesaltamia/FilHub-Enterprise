import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LowStockService } from '../utils/lowStockUtils';
import LowStockAlert from '../components/LowStockAlert';
import { enhancedDashboardAPI, ordersAPI, customersAPI, productsAPI } from '../services/api';

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
      let orders = [];
      let products = [];
      let customers = [];
      let dashboardStats = null;

      // Try to fetch from backend API first
      try {
        const [statsResponse, ordersResponse, productsResponse, customersResponse] = await Promise.all([
          enhancedDashboardAPI.getStats('today'),
          ordersAPI.getAll({ per_page: 1000 }),
          productsAPI.getAll({ per_page: 1000 }),
          customersAPI.getAll({ per_page: 1000 })
        ]);

        if (statsResponse && statsResponse.data) {
          dashboardStats = statsResponse.data;
          console.log('Dashboard stats loaded from backend API');
        }

        if (ordersResponse && ordersResponse.data) {
          orders = Array.isArray(ordersResponse.data.data) ? ordersResponse.data.data : (Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
          localStorage.setItem('orders', JSON.stringify(orders));
        }

        if (productsResponse && productsResponse.data) {
          products = Array.isArray(productsResponse.data.data) ? productsResponse.data.data : (Array.isArray(productsResponse.data) ? productsResponse.data : []);
          localStorage.setItem('products', JSON.stringify(products));
        }

        if (customersResponse && customersResponse.data) {
          customers = Array.isArray(customersResponse.data.data) ? customersResponse.data.data : (Array.isArray(customersResponse.data) ? customersResponse.data : []);
          localStorage.setItem('customers', JSON.stringify(customers));
        }
      } catch (apiError) {
        console.log('Backend API failed, using localStorage fallback:', apiError);
        
        // Fallback to localStorage
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
        products = JSON.parse(localStorage.getItem('products') || '[]');
        customers = JSON.parse(localStorage.getItem('customers') || '[]');
      }

      // Calculate stats (use backend stats if available, otherwise calculate from localStorage)
      let totalOrders, totalSales, pendingOrders, todaysSales, totalCustomers;
      
      if (dashboardStats) {
        totalOrders = dashboardStats.total_orders || orders.length;
        totalSales = dashboardStats.total_sales || 0;
        pendingOrders = dashboardStats.pending_orders || 0;
        todaysSales = dashboardStats.todays_sales || 0;
        totalCustomers = dashboardStats.total_customers || customers.length;
      } else {
        // Calculate from localStorage data
        totalOrders = orders.length;
        totalSales = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        pendingOrders = orders.filter((order: any) => order.order_status === 'pending').length;
        
        // Calculate today's sales (orders from today)
        const today = new Date().toDateString();
        todaysSales = orders
          .filter((order: any) => new Date(order.created_at).toDateString() === today)
          .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        
        totalCustomers = customers.length;
      }

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
        totalCustomers,
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

  const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; gradient?: string }> = ({ title, value, icon, color, gradient }) => (
    <div className={`group rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:scale-105 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradient || 'bg-blue-100'}`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            Live
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-3xl font-bold bg-gradient-to-r ${gradient ? 'from-blue-600 to-purple-600' : 'from-gray-900 to-gray-700'} bg-clip-text text-transparent ${theme === 'dark' ? 'from-white to-gray-300' : ''}`}>{value}</p>
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Modern Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b backdrop-blur-sm bg-opacity-95 sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Welcome back! Here's your business overview</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'} font-medium`}>
              <span className="mr-2">🟢</span>
              System Online
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Revenue"
            value={`₱${Number(stats.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="💰"
            color="border-yellow-500"
            gradient={theme === 'dark' ? 'bg-yellow-900' : 'bg-gradient-to-br from-yellow-100 to-orange-100'}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="📋"
            color="border-blue-800"
            gradient={theme === 'dark' ? 'bg-blue-900' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon="⏳"
            color="border-yellow-600"
            gradient={theme === 'dark' ? 'bg-orange-900' : 'bg-gradient-to-br from-orange-100 to-red-100'}
          />
          <StatCard
            title="Today's Sales"
            value={`₱${Number(stats.todaysSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="📈"
            color="border-green-500"
            gradient={theme === 'dark' ? 'bg-green-900' : 'bg-gradient-to-br from-green-100 to-emerald-100'}
          />
        </div>

        {/* Modern Additional Stats for Admin */}
        {role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Modern Low Stock Alert */}
            <div 
              className={`group ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:scale-105 p-6 ${
                stats.lowStockProducts > 0 ? 'cursor-pointer' : ''
              }`}
              onClick={() => stats.lowStockProducts > 0 && setShowLowStockModal(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-red-900' : 'bg-gradient-to-br from-red-100 to-orange-100'}`}>
                  <span className="text-2xl">⚠️</span>
                </div>
                {stats.lowStockProducts > 0 && (
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse">
                    Action Required
                  </div>
                )}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Low Stock Alert</h3>
              <div className={`text-3xl font-bold mb-2 ${
                stats.lowStockProducts > 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>{stats.lowStockProducts}</div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {stats.lowStockProducts > 0 ? 'Click to view products' : 'products need restocking'}
              </p>
            </div>

            {/* Modern Total Products */}
            <div className={`group ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:scale-105 p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-900' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
                  <span className="text-2xl">🏷️</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  Inventory
                </div>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total Products</h3>
              <div className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{stats.totalProducts}</div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>products in inventory</p>
            </div>

            {/* Modern System Status */}
            <div className={`group ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:scale-105 p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-green-900' : 'bg-gradient-to-br from-green-100 to-emerald-100'}`}>
                  <span className="text-2xl">✅</span>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <span className="mr-1">🟢</span>Live
                </div>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>System Status</h3>
              <div className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Online</div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>all systems operational</p>
            </div>
          </div>
        )}


        {/* Modern Recent Orders */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                  <span className="text-lg">📋</span>
                </div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Orders</h3>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                Last 5 orders
              </span>
            </div>
          </div>
          <div className="p-6">
            {stats.recentOrders.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {stats.recentOrders.map((order: any) => (
                  <div key={order.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 hover:from-blue-100 hover:to-indigo-100'}`}>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₱{Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {order.paid_amount && order.paid_amount > order.total_amount && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Change: ₱{(Number(order.paid_amount) - Number(order.total_amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'dark' ? '#374151' : '#f3f4f6'};
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'dark' ? '#6b7280' : '#d1d5db'};
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'dark' ? '#9ca3af' : '#9ca3af'};
          }
        `
      }} />
    </div>
  );
};

export default Dashboard;
