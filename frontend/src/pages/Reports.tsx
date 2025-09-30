import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { reportsAPI, ordersAPI, customersAPI, productsAPI } from '../services/api';

interface ProductSalesData {
  productId: number;
  productName: string;
  category?: string;
  uniform_size?: string;
  uniform_gender?: string;
  monthlySales: Array<{
    year: number;
    month: number;
    monthName: string;
    quantity: number;
    revenue: number;
    orders: number;
  }>;
  totalQuantity: number;
  totalRevenue: number;
  totalOrders: number;
}

interface TeacherDebt {
  teacherId: number;
  teacherName: string;
  department?: string;
  email?: string;
  phone?: string;
  totalDebt: number;
  paidAmount: number;
  remainingBalance: number;
  transactions: Array<{
    id: number;
    date: string;
    type: 'purchase' | 'payment';
    amount: number;
    description: string;
    items?: Array<{
      productName: string;
      quantity: number;
      price: number;
      uniform_size?: string;
      uniform_gender?: string;
    }>;
  }>;
  lastTransactionDate: string;
  status: 'active' | 'cleared' | 'overdue';
}

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
  productSalesAnalysis: ProductSalesData[];
  teachersDebt: TeacherDebt[];
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
    recentActivity: [],
    productSalesAnalysis: [],
    teachersDebt: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      let orders = [];
      let products = [];

      // Try to fetch from backend API first
      try {
        const [ordersResponse, productsResponse] = await Promise.all([
          ordersAPI.getAll({ per_page: 1000 }),
          productsAPI.getAll({ per_page: 1000 })
        ]);

        if (ordersResponse && ordersResponse.data) {
          orders = Array.isArray(ordersResponse.data.data) ? ordersResponse.data.data : (Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
          localStorage.setItem('orders', JSON.stringify(orders));
        }

        if (productsResponse && productsResponse.data) {
          products = Array.isArray(productsResponse.data.data) ? productsResponse.data.data : (Array.isArray(productsResponse.data) ? productsResponse.data : []);
          localStorage.setItem('products', JSON.stringify(products));
        }

        console.log('Reports data loaded from backend API');
      } catch (apiError) {
        console.log('Backend API failed, using localStorage fallback:', apiError);
        
        // Fallback to localStorage
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
        products = JSON.parse(localStorage.getItem('products') || '[]');
      }

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

      // Calculate product sales analysis by month and year
      const productSalesMap = new Map<number, ProductSalesData>();
      
      orders.forEach((order: any) => {
        if (!order.items || !Array.isArray(order.items)) return;
        
        const orderDate = new Date(order.created_at);
        const year = orderDate.getFullYear();
        const month = orderDate.getMonth() + 1; // JavaScript months are 0-indexed
        const monthName = orderDate.toLocaleDateString('en-US', { month: 'long' });
        
        order.items.forEach((item: any) => {
          const productId = item.product_id || item.id;
          const product = products.find((p: any) => p.id === productId);
          
          if (!productSalesMap.has(productId)) {
            productSalesMap.set(productId, {
              productId,
              productName: item.name || product?.name || 'Unknown Product',
              category: product?.category?.name || 'Uncategorized',
              uniform_size: product?.uniform_size,
              uniform_gender: product?.uniform_gender,
              monthlySales: [],
              totalQuantity: 0,
              totalRevenue: 0,
              totalOrders: 0
            });
          }
          
          const productData = productSalesMap.get(productId)!;
          
          // Find or create monthly sales entry
          let monthlySale = productData.monthlySales.find(ms => ms.year === year && ms.month === month);
          if (!monthlySale) {
            monthlySale = {
              year,
              month,
              monthName: `${monthName} ${year}`,
              quantity: 0,
              revenue: 0,
              orders: 0
            };
            productData.monthlySales.push(monthlySale);
          }
          
          // Update monthly sales
          const quantity = item.qty || item.quantity || 1;
          const price = item.price || 0;
          const revenue = quantity * price;
          
          monthlySale.quantity += quantity;
          monthlySale.revenue += revenue;
          monthlySale.orders += 1;
          
          // Update totals
          productData.totalQuantity += quantity;
          productData.totalRevenue += revenue;
          productData.totalOrders += 1;
        });
      });
      
      // Convert map to array and sort monthly sales
      const productSalesAnalysis = Array.from(productSalesMap.values()).map(product => ({
        ...product,
        monthlySales: product.monthlySales.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year; // Latest year first
          return b.month - a.month; // Latest month first
        })
      })).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by total revenue

      // Calculate teachers' debt from orders
      const teachersDebtMap = new Map<number, TeacherDebt>();
      
      orders.forEach((order: any) => {
        // Check if this is a teacher order (assuming customer has teacher-related info)
        const customer = order.customer;
        if (!customer || !customer.name) return;
        
        // Identify teachers by checking the is_teacher flag or education_level
        const isTeacher = customer.is_teacher === true || 
                         customer.education_level === 'Teacher' ||
                         customer.name.toLowerCase().includes('teacher') || 
                         customer.name.toLowerCase().includes('prof') ||
                         customer.name.toLowerCase().includes('instructor') ||
                         customer.educational_summary?.toLowerCase().includes('teacher') ||
                         (customer.department && customer.department.toLowerCase().includes('college')); // College departments indicate teachers
        
        if (!isTeacher) return;
        
        const teacherId = customer.id || customer.name.hashCode?.() || Math.abs(customer.name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0));
        
        if (!teachersDebtMap.has(teacherId)) {
          teachersDebtMap.set(teacherId, {
            teacherId,
            teacherName: customer.name,
            department: customer.department || 'Unknown Department',
            email: customer.email,
            phone: customer.phone,
            totalDebt: 0,
            paidAmount: 0,
            remainingBalance: 0,
            transactions: [],
            lastTransactionDate: order.created_at,
            status: 'active'
          });
        }
        
        const teacherData = teachersDebtMap.get(teacherId)!;
        
        // Add purchase transaction
        const orderAmount = order.total_amount || 0;
        const paidAmount = order.paid_amount || 0;
        const remainingAmount = orderAmount - paidAmount;
        
        teacherData.transactions.push({
          id: order.id,
          date: order.created_at,
          type: 'purchase',
          amount: orderAmount,
          description: `Order #${order.order_number || order.id}`,
          items: order.items?.map((item: any) => ({
            productName: item.name,
            quantity: item.qty || item.quantity || 1,
            price: item.price || 0,
            uniform_size: item.uniform_size,
            uniform_gender: item.uniform_gender
          })) || []
        });
        
        // Add payment transaction if there was a payment
        if (paidAmount > 0) {
          teacherData.transactions.push({
            id: order.id + 10000, // Offset to avoid ID conflicts
            date: order.created_at,
            type: 'payment',
            amount: paidAmount,
            description: `Payment for Order #${order.order_number || order.id}`
          });
        }
        
        // Update totals
        teacherData.totalDebt += orderAmount;
        teacherData.paidAmount += paidAmount;
        teacherData.remainingBalance = teacherData.totalDebt - teacherData.paidAmount;
        
        // Update last transaction date
        if (new Date(order.created_at) > new Date(teacherData.lastTransactionDate)) {
          teacherData.lastTransactionDate = order.created_at;
        }
        
        // Update status based on balance and time
        const daysSinceLastTransaction = Math.floor((now.getTime() - new Date(teacherData.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24));
        if (teacherData.remainingBalance <= 0) {
          teacherData.status = 'cleared';
        } else if (daysSinceLastTransaction > 30) {
          teacherData.status = 'overdue';
        } else {
          teacherData.status = 'active';
        }
      });
      
      // Convert to array and sort by remaining balance (highest debt first)
      const teachersDebt = Array.from(teachersDebtMap.values())
        .map(teacher => ({
          ...teacher,
          transactions: teacher.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }))
        .sort((a, b) => b.remainingBalance - a.remainingBalance);

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
        recentActivity,
        productSalesAnalysis,
        teachersDebt
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: string; subtitle?: string; trend?: string; trendUp?: boolean }> = 
    ({ title, value, icon, subtitle, trend, trendUp }) => (
    <div className={`group relative overflow-hidden rounded-3xl shadow-lg border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
      <div className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'} backdrop-blur-sm`}>
            <span className="text-3xl">{icon}</span>
          </div>
          {trend && (
            <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className="mr-1">{trendUp ? '↗️' : '↘️'}</span>
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{title}</h3>
          <p className={`text-4xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtitle && (
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = () => {
    const formatCurrency = (value: number) => {
      return `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const csvData = [
      ['Metric', 'Value'],
      ['Total Sales', formatCurrency(stats.totalSales)],
      ['Total Orders', stats.totalOrders.toString()],
      ['Today\'s Sales', formatCurrency(stats.todaysSales)],
      ['This Week Sales', formatCurrency(stats.thisWeekSales)],
      ['This Month Sales', formatCurrency(stats.thisMonthSales)],
      ['Average Order Value', formatCurrency(stats.averageOrderValue)],
      [''],
      ['Top Selling Products', ''],
      ['Product Name', 'Quantity Sold', 'Revenue'],
      ...stats.topSellingProducts.map(p => [p.name, p.quantity.toString(), formatCurrency(p.revenue)]),
      [''],
      ['Sales by Category', ''],
      ['Category', 'Revenue'],
      ...stats.salesByCategory.map(c => [c.category, formatCurrency(c.revenue)]),
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}>
      {/* Ultra Modern Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border-b backdrop-blur-xl sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className={`relative p-4 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'} shadow-xl`}>
                <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
                <span className="relative text-3xl">📊</span>
              </div>
              <div>
                <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Analytics Dashboard</h1>
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Real-time business intelligence & insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={`appearance-none px-6 py-3 pr-12 border rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-semibold ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} shadow-lg hover:shadow-xl`}
                >
                  <option value="all">🕰️ All Time</option>
                  <option value="today">🌅 Today</option>
                  <option value="week">📅 This Week</option>
                  <option value="month">📆 This Month</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold flex items-center space-x-3 group"
              >
                <span className="text-xl group-hover:rotate-12 transition-transform duration-300">📊</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Ultra Modern Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          <StatCard
            title="Total Revenue"
            value={`₱${Number(stats.totalSales).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon="💎"
            subtitle={`${stats.totalOrders} orders completed`}
            trend="+12.5%"
            trendUp={true}
          />
          <StatCard
            title="Today's Performance"
            value={`₱${Number(stats.todaysSales).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon="🚀"
            subtitle="Daily revenue"
            trend="+8.3%"
            trendUp={true}
          />
          <StatCard
            title="Average Order Value"
            value={`₱${Number(stats.averageOrderValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon="🎯"
            subtitle="Per transaction"
            trend="+5.7%"
            trendUp={true}
          />
          <StatCard
            title="Monthly Growth"
            value={`₱${Number(stats.thisMonthSales).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon="📈"
            subtitle="This month's total"
            trend="+15.2%"
            trendUp={true}
          />
        </div>

        {/* Ultra Modern Report Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Ultra Modern Top Selling Products */}
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50'} rounded-3xl shadow-2xl border backdrop-blur-sm overflow-hidden`}>
            <div className={`p-8 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20' : 'bg-gradient-to-br from-yellow-100 to-orange-100'} backdrop-blur-sm`}>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Performers</h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Best selling products</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                  LIVE DATA
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {stats.topSellingProducts.length > 0 ? (
                  stats.topSellingProducts.map((product, index) => (
                    <div key={index} className={`group relative overflow-hidden p-6 rounded-2xl border transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-gray-600/50 hover:from-gray-700 hover:to-gray-800' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200/50 hover:from-yellow-50 hover:to-orange-50'}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' : index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' : theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </div>
                          <div>
                            <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.name}</h4>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                📦 {product.quantity} units
                              </span>
                              <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                💰 Revenue leader
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            ₱{Number(product.revenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Total revenue
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className={`text-6xl mb-6 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>🏆</div>
                    <h4 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>No sales data yet</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Start making sales to see your top performers!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ultra Modern Sales by Category */}
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50'} rounded-3xl shadow-2xl border backdrop-blur-sm overflow-hidden`}>
            <div className={`p-8 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'} backdrop-blur-sm`}>
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Category Breakdown</h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Sales performance by category</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  ANALYTICS
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {stats.salesByCategory.length > 0 ? (
                  stats.salesByCategory.map((category, index) => {
                    const maxRevenue = Math.max(...stats.salesByCategory.map(c => c.revenue));
                    const percentage = maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={index} className={`group relative overflow-hidden p-6 rounded-2xl border transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-gray-600/50 hover:from-gray-700 hover:to-gray-800' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200/50 hover:from-blue-50 hover:to-indigo-50'}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
                                📁
                              </div>
                              <div>
                                <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{category.category}</h4>
                                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                  📊 {category.orders} orders processed
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                ₱{Number(category.revenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </p>
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Category revenue
                              </p>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="relative">
                            <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div 
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Market share
                              </span>
                              <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16">
                    <div className={`text-6xl mb-6 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>📊</div>
                    <h4 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>No category data yet</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Categories will appear here as you make sales!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ultra Modern Activity & Inventory Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Ultra Modern Recent Activity */}
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50'} rounded-3xl shadow-2xl border backdrop-blur-sm overflow-hidden`}>
            <div className={`p-8 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-green-100 to-emerald-100'} backdrop-blur-sm`}>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Weekly Trends</h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Last 7 days performance</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                  TRENDING
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {stats.recentActivity.map((day, index) => {
                  const maxSales = Math.max(...stats.recentActivity.map(d => d.sales));
                  const percentage = maxSales > 0 ? (day.sales / maxSales) * 100 : 0;
                  
                  return (
                    <div key={index} className={`group relative overflow-hidden p-6 rounded-2xl border transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-gray-600/50 hover:from-gray-700 hover:to-gray-800' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200/50 hover:from-green-50 hover:to-emerald-50'}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{day.date}</h4>
                            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              📊 {day.orders} transactions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-black ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                              ₱{Number(day.sales).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Daily revenue
                            </p>
                          </div>
                        </div>
                        {/* Activity Bar */}
                        <div className={`w-full h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ultra Modern Low Stock Alert */}
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50'} rounded-3xl shadow-2xl border backdrop-blur-sm overflow-hidden`}>
            <div className={`p-8 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20' : 'bg-gradient-to-br from-red-100 to-orange-100'} backdrop-blur-sm`}>
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Inventory Alerts</h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Items requiring attention</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-bold ${stats.lowStockItems.length > 0 ? (theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700') : (theme === 'dark' ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')}`}>
                  {stats.lowStockItems.length > 0 ? 'ALERT' : 'HEALTHY'}
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {stats.lowStockItems.length > 0 ? (
                  stats.lowStockItems.map((item, index) => (
                    <div key={index} className={`group relative overflow-hidden p-6 rounded-2xl border transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-gray-600/50 hover:from-gray-700 hover:to-gray-800' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200/50 hover:from-red-50 hover:to-orange-50'}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${item.stock <= 2 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'}`}>
                            {item.stock <= 2 ? '🔴' : '🟡'}
                          </div>
                          <div>
                            <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.name}</h4>
                            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              📁 {item.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${item.stock <= 2 ? 'text-red-500' : 'text-yellow-500'}`}>
                            {item.stock}
                          </p>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Units left
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className={`text-6xl mb-6 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>🎉</div>
                    <h4 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>All Good!</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>All products are well stocked</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Product Sales Analysis */}
      <div className={`mt-8 rounded-lg shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          📊 Product Sales Analysis by Month & Year
        </h3>
        
        {stats.productSalesAnalysis.length > 0 ? (
          <div className="space-y-6">
            {stats.productSalesAnalysis.slice(0, 10).map((product, index) => (
              <div key={product.productId} className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {product.productName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                        {product.category}
                      </span>
                      {product.uniform_size && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                          📏 {product.uniform_size}
                        </span>
                      )}
                      {product.uniform_gender && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                          {product.uniform_gender === 'Men' ? '👨' : '👩'} {product.uniform_gender}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      ₱{product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.totalQuantity} units sold • {product.totalOrders} orders
                    </p>
                  </div>
                </div>
                
                {/* Monthly Sales Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.monthlySales.slice(0, 6).map((monthData, monthIndex) => (
                    <div key={`${monthData.year}-${monthData.month}`} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {monthData.monthName}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {monthData.quantity} units • {monthData.orders} orders
                          </p>
                        </div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                          ₱{monthData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {product.monthlySales.length > 6 && (
                  <p className={`text-center mt-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    ... and {product.monthlySales.length - 6} more months
                  </p>
                )}
              </div>
            ))}
            
            {stats.productSalesAnalysis.length > 10 && (
              <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Showing top 10 products • {stats.productSalesAnalysis.length - 10} more products available
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            No product sales data available yet. Start making sales to see analysis! 📈
          </p>
        )}
      </div>

      {/* Teachers' Debt Analysis */}
      <div className={`mt-8 rounded-lg shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          👩‍🏫 Teachers' Debt Management
        </h3>
        
        {stats.teachersDebt.length > 0 ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}`}>Total Outstanding</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      ₱{stats.teachersDebt.reduce((sum, teacher) => sum + teacher.remainingBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="text-3xl">💳</span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>Teachers with Debt</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {stats.teachersDebt.filter(teacher => teacher.remainingBalance > 0).length}
                    </p>
                  </div>
                  <span className="text-3xl">👥</span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>Total Collected</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      ₱{stats.teachersDebt.reduce((sum, teacher) => sum + teacher.paidAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="text-3xl">✅</span>
                </div>
              </div>
            </div>

            {/* Teachers List */}
            <div className="space-y-4">
              {stats.teachersDebt.slice(0, 10).map((teacher, index) => (
                <div key={teacher.teacherId} className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {teacher.teacherName}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          teacher.status === 'cleared' 
                            ? (theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                            : teacher.status === 'overdue'
                            ? (theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                            : (theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                        }`}>
                          {teacher.status === 'cleared' ? '✅ Cleared' : teacher.status === 'overdue' ? '⚠️ Overdue' : '🔄 Active'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                          🏢 {teacher.department}
                        </span>
                        {teacher.email && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            📧 {teacher.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        teacher.remainingBalance > 0 
                          ? (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                          : (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                      }`}>
                        ₱{teacher.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        ₱{teacher.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total • ₱{teacher.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid
                      </p>
                    </div>
                  </div>
                  
                  {/* Recent Transactions */}
                  <div className="mt-4">
                    <h5 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Recent Transactions ({teacher.transactions.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teacher.transactions.slice(0, 4).map((transaction, txIndex) => (
                        <div key={transaction.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {transaction.type === 'purchase' ? '🛒' : '💰'} {transaction.description}
                              </p>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(transaction.date).toLocaleDateString()}
                              </p>
                              {transaction.items && transaction.items.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {transaction.items.slice(0, 2).map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center space-x-1">
                                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        • {item.productName} ({item.quantity}x)
                                      </span>
                                      {item.uniform_size && (
                                        <span className={`px-1 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                                          📏 {item.uniform_size}
                                        </span>
                                      )}
                                      {item.uniform_gender && (
                                        <span className={`px-1 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                          {item.uniform_gender === 'Men' ? '👨' : '👩'}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {transaction.items.length > 2 && (
                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                      ... and {transaction.items.length - 2} more items
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className={`font-semibold ${
                              transaction.type === 'purchase' 
                                ? (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                                : (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                            }`}>
                              {transaction.type === 'purchase' ? '+' : '-'}₱{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {teacher.transactions.length > 4 && (
                      <p className={`text-center mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        ... and {teacher.transactions.length - 4} more transactions
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {stats.teachersDebt.length > 10 && (
              <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Showing top 10 teachers by debt amount • {stats.teachersDebt.length - 10} more teachers with debt records
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            No teachers' debt records found. Teachers' purchases will appear here when they have outstanding balances! 👩‍🏫
          </p>
        )}
      </div>

        {/* Ultra Modern Summary Footer */}
        <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50'} rounded-3xl shadow-2xl border backdrop-blur-sm overflow-hidden`}>
          <div className={`p-8 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' : 'bg-gradient-to-br from-indigo-100 to-purple-100'} backdrop-blur-sm`}>
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Report Summary</h3>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Generated insights & metadata</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600/50' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <span className="text-lg">🕰️</span>
                  </div>
                  <h4 className={`font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Time Period</h4>
                </div>
                <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {dateRange === 'all' ? 'All Time' : 
                   dateRange === 'today' ? 'Today' :
                   dateRange === 'week' ? 'This Week' : 'This Month'}
                </p>
              </div>
              
              <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600/50' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <span className="text-lg">🔄</span>
                  </div>
                  <h4 className={`font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Last Updated</h4>
                </div>
                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {new Date().toLocaleDateString()}
                </p>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              
              <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600/50' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'}`}>
                    <span className="text-lg">✅</span>
                  </div>
                  <h4 className={`font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Data Status</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <p className={`text-lg font-bold text-green-600`}>Live & Current</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Ultra Modern Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50'} rounded-3xl shadow-2xl border backdrop-blur-sm w-full max-w-md transform transition-all duration-300 scale-100`}>
            <div className={`p-8 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'} backdrop-blur-sm`}>
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Export Report</h3>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Choose your preferred format</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <label className={`block text-sm font-bold mb-4 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Export Format
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    exportFormat === 'csv'
                      ? (theme === 'dark' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-50 border-blue-200')
                      : (theme === 'dark' ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${exportFormat === 'csv' ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        📊
                      </div>
                      <div>
                        <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>CSV Spreadsheet</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Perfect for Excel & Google Sheets</p>
                      </div>
                    </div>
                    {exportFormat === 'csv' && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                  
                  <label className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    exportFormat === 'pdf'
                      ? (theme === 'dark' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-50 border-blue-200')
                      : (theme === 'dark' ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${exportFormat === 'pdf' ? 'bg-gradient-to-br from-red-400 to-red-500 text-white' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        📄
                      </div>
                      <div>
                        <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>PDF Document</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ready for printing & sharing</p>
                      </div>
                    </div>
                    {exportFormat === 'pdf' && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleExport}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold flex items-center justify-center space-x-2"
                >
                  <span className="text-xl">{exportFormat === 'csv' ? '📊' : '📄'}</span>
                  <span>Export {exportFormat.toUpperCase()}</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className={`px-6 py-4 rounded-2xl transition-all duration-300 font-bold ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.3)'};
            border-radius: 12px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'dark' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #3b82f6, #6366f1)'};
            border-radius: 12px;
            border: 2px solid transparent;
            background-clip: content-box;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'dark' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #2563eb, #4f46e5)'};
            background-clip: content-box;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
        `
      }} />
      </div>
    </div>
  );
};

export default Reports;
