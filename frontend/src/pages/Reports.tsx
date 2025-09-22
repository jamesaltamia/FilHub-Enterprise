import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface ReportStats {
  totalSales: number;
  totalOrders: number;
  todaysSales: number;
  thisWeekSales: number;
  thisMonthSales: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    orders: number;
  }>;
  lowStockItems: Array<{
    name: string;
    stock: number;
    category: string;
  }>;
  recentActivity: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

const Reports: React.FC = () => {
  const { role } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<ReportStats>({
    totalSales: 0,
    totalOrders: 0,
    todaysSales: 0,
    thisWeekSales: 0,
    thisMonthSales: 0,
    averageOrderValue: 0,
    topSellingProducts: [],
    salesByCategory: [],
    lowStockItems: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = () => {
    setIsLoading(true);
    try {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const products = JSON.parse(localStorage.getItem('products') || '[]');

      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filter orders based on date range
      let filteredOrders = orders;
      if (dateRange === 'today') {
        filteredOrders = orders.filter((order: any) => 
          new Date(order.created_at).toDateString() === today.toDateString()
        );
      } else if (dateRange === 'week') {
        filteredOrders = orders.filter((order: any) => 
          new Date(order.created_at) >= weekAgo
        );
      } else if (dateRange === 'month') {
        filteredOrders = orders.filter((order: any) => 
          new Date(order.created_at) >= monthAgo
        );
      }

      // Calculate basic metrics
      const totalSales = filteredOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
      const totalOrders = filteredOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Today's sales
      const todaysSales = orders
        .filter((order: any) => new Date(order.created_at).toDateString() === today.toDateString())
        .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

      // This week's sales
      const thisWeekSales = orders
        .filter((order: any) => new Date(order.created_at) >= weekAgo)
        .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

      // This month's sales
      const thisMonthSales = orders
        .filter((order: any) => new Date(order.created_at) >= monthAgo)
        .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

      // Calculate top selling products
      const productSales: { [key: string]: { quantity: number; revenue: number; name: string } } = {};
      
      filteredOrders.forEach((order: any) => {
        if (order.items) {
          order.items.forEach((item: any) => {
            const key = item.product_id || item.id;
            if (!productSales[key]) {
              productSales[key] = { quantity: 0, revenue: 0, name: item.name || 'Unknown Product' };
            }
            productSales[key].quantity += item.quantity || item.qty || 1;
            productSales[key].revenue += (item.price || 0) * (item.quantity || item.qty || 1);
          });
        }
      });

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Calculate sales by category
      const categorySales: { [key: string]: { revenue: number; orders: number } } = {};
      
      filteredOrders.forEach((order: any) => {
        if (order.items) {
          order.items.forEach((item: any) => {
            const category = item.category || 'Uncategorized';
            if (!categorySales[category]) {
              categorySales[category] = { revenue: 0, orders: 0 };
            }
            categorySales[category].revenue += (item.price || 0) * (item.quantity || item.qty || 1);
          });
        }
      });

      const salesByCategory = Object.entries(categorySales)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Get low stock items
      const lowStockItems = products
        .filter((product: any) => product.stock_quantity <= (product.min_stock_level || 5))
        .map((product: any) => ({
          name: product.name,
          stock: product.stock_quantity,
          category: product.category?.name || 'Uncategorized'
        }))
        .slice(0, 10);

      // Calculate recent activity (last 7 days)
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter((order: any) => 
          new Date(order.created_at).toDateString() === date.toDateString()
        );
        const daySales = dayOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        
        recentActivity.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          sales: daySales,
          orders: dayOrders.length
        });
      }

      setStats({
        totalSales,
        totalOrders,
        todaysSales,
        thisWeekSales,
        thisMonthSales,
        averageOrderValue,
        topSellingProducts,
        salesByCategory,
        lowStockItems,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; subtitle?: string; gradient?: string }> = 
    ({ title, value, icon, color, subtitle, gradient }) => (
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
          <p className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtitle && (
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Sales', `₱${stats.totalSales.toLocaleString()}`],
      ['Total Orders', stats.totalOrders.toString()],
      ['Today\'s Sales', `₱${stats.todaysSales.toLocaleString()}`],
      ['This Week Sales', `₱${stats.thisWeekSales.toLocaleString()}`],
      ['This Month Sales', `₱${stats.thisMonthSales.toLocaleString()}`],
      ['Average Order Value', `₱${stats.averageOrderValue.toFixed(2)}`],
      [''],
      ['Top Selling Products', ''],
      ['Product Name', 'Quantity Sold', 'Revenue'],
      ...stats.topSellingProducts.map(p => [p.name, p.quantity.toString(), `₱${p.revenue.toLocaleString()}`]),
      [''],
      ['Sales by Category', ''],
      ['Category', 'Revenue'],
      ...stats.salesByCategory.map(c => [c.category, `₱${c.revenue.toLocaleString()}`]),
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
    setShowExportModal(false);
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Loading reports...</p>
          </div>
        </div>
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
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Business Reports</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Comprehensive overview of your business performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              >
                <option value="all">🕰️ All Time</option>
                <option value="today">🌅 Today</option>
                <option value="week">📅 This Week</option>
                <option value="month">📆 This Month</option>
              </select>
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Modern Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sales"
            value={`₱${stats.totalSales.toLocaleString()}`}
            icon="💰"
            color="border-green-500"
            subtitle={`${stats.totalOrders} orders`}
            gradient={theme === 'dark' ? 'bg-green-900' : 'bg-gradient-to-br from-green-100 to-emerald-100'}
          />
          <StatCard
            title="Today's Sales"
            value={`₱${stats.todaysSales.toLocaleString()}`}
            icon="📈"
            color="border-blue-500"
            gradient={theme === 'dark' ? 'bg-blue-900' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}
          />
          <StatCard
            title="Average Order"
            value={`₱${stats.averageOrderValue.toFixed(2)}`}
            icon="🎯"
            color="border-purple-500"
            gradient={theme === 'dark' ? 'bg-purple-900' : 'bg-gradient-to-br from-purple-100 to-violet-100'}
          />
          <StatCard
            title="This Month"
            value={`₱${stats.thisMonthSales.toLocaleString()}`}
            icon="📅"
            color="border-orange-500"
            gradient={theme === 'dark' ? 'bg-orange-900' : 'bg-gradient-to-br from-orange-100 to-red-100'}
          />
        </div>

        {/* Modern Report Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Modern Top Selling Products */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
                  <span className="text-lg">🏆</span>
                </div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Selling Products</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {stats.topSellingProducts.length > 0 ? (
                  stats.topSellingProducts.map((product, index) => (
                    <div key={index} className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-100 hover:from-yellow-100 hover:to-orange-100'}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-200 text-yellow-800'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            📦 {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        ₱{product.revenue.toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className={`text-4xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>🏆</div>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No sales data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modern Sales by Category */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <span className="text-lg">📊</span>
                </div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sales by Category</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {stats.salesByCategory.length > 0 ? (
                  stats.salesByCategory.map((category, index) => (
                    <div key={index} className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 hover:from-blue-100 hover:to-indigo-100'}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-200 text-blue-800'}`}>
                          📁
                        </div>
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{category.category}</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            📊 {category.orders} orders
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        ₱{category.revenue.toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className={`text-4xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>📊</div>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No category data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Recent Activity & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className={`rounded-lg shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            📈 Recent Activity (Last 7 Days)
          </h3>
          <div className="space-y-3">
            {stats.recentActivity.map((day, index) => (
              <div key={index} className={`flex justify-between items-center p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{day.date}</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {day.orders} orders
                  </p>
                </div>
                <p className={`font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  ₱{day.sales.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className={`rounded-lg shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            ⚠️ Low Stock Items
          </h3>
          <div className="space-y-3">
            {stats.lowStockItems.length > 0 ? (
              stats.lowStockItems.map((item, index) => (
                <div key={index} className={`flex justify-between items-center p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.category}
                    </p>
                  </div>
                  <p className={`font-semibold ${item.stock <= 2 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {item.stock} left
                  </p>
                </div>
              ))
            ) : (
              <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                All products are well stocked! 🎉
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className={`mt-8 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          📋 Report Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Period:</p>
            <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {dateRange === 'all' ? 'All Time' : 
               dateRange === 'today' ? 'Today' :
               dateRange === 'week' ? 'This Week' : 'This Month'}
            </p>
          </div>
          <div>
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Generated:</p>
            <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Status:</p>
            <p className="text-green-600">✅ Up to date</p>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg w-96 max-w-md mx-4`}>
            <h3 className="text-lg font-semibold mb-4">Export Report</h3>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="pdf">PDF (Print)</option>
              </select>
            </div>

            <div className={`mb-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {exportFormat === 'csv' 
                  ? '📊 Export data as CSV file for analysis in Excel or Google Sheets'
                  : '📄 Export as PDF for printing or sharing'
                }
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export {exportFormat.toUpperCase()}
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Cancel
              </button>
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
    </div>
  );
};

export default Reports;
