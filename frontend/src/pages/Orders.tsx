import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface Order {
  id: number;
  order_number: string;
  customer_id?: number;
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  user?: {
    id: number;
    name: string;
  };
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

const Orders: React.FC = () => {
  const { role } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [orderStats, setOrderStats] = useState<any>(null);
  
  // Create Order Modal States
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{id: number, name: string, price: number, quantity: number, stock: number}[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(10); // 10% default tax
  const [paidAmount, setPaidAmount] = useState(0);
  const [productSearch, setProductSearch] = useState('');

  // Fetch orders - Demo mode only
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    // Skip API calls, use local state only
    setLoading(false);
  };

  // Fetch order statistics (only try once)
  const [statsAttempted, setStatsAttempted] = useState(false);
  
  const fetchOrderStats = async () => {
    if (statsAttempted) return;
    setStatsAttempted(true);
    // Don't calculate here - let useEffect handle it
  };

  // Calculate basic stats from orders data when API endpoint is not available
  const calculateFallbackStats = () => {
    console.log('calculateFallbackStats called with orders:', orders);
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      console.log('Order:', order, 'Total amount:', order.total_amount);
      return sum + (order.total_amount || 0);
    }, 0);
    const pendingOrders = orders.filter(order => order.order_status === 'pending').length;
    const outstandingAmount = orders.reduce((sum, order) => sum + (order.due_amount || 0), 0);

    console.log('Calculated stats:', {
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders,
      outstanding_amount: outstandingAmount
    });

    setOrderStats({
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      pending_orders: pendingOrders,
      outstanding_amount: outstandingAmount
    });
  };

  // Fetch products for order creation
  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ per_page: 100 });
      if (response && response.data) {
        setProducts(Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []));
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        console.error('Error fetching products:', err);
      }
      setProducts([]);
    }
  };

  // Load orders from localStorage and set up real-time updates
  useEffect(() => {
    const loadOrders = () => {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      console.log('Loading orders from localStorage:', savedOrders);
      
      // Apply filters
      let filteredOrders = savedOrders;
      
      if (searchTerm) {
        filteredOrders = filteredOrders.filter((order: any) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customer?.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (paymentStatusFilter) {
        filteredOrders = filteredOrders.filter((order: any) => order.payment_status === paymentStatusFilter);
      }
      
      if (orderStatusFilter) {
        filteredOrders = filteredOrders.filter((order: any) => order.order_status === orderStatusFilter);
      }
      
      if (dateFrom) {
        filteredOrders = filteredOrders.filter((order: any) => 
          new Date(order.created_at) >= new Date(dateFrom)
        );
      }
      
      if (dateTo) {
        filteredOrders = filteredOrders.filter((order: any) => 
          new Date(order.created_at) <= new Date(dateTo + 'T23:59:59')
        );
      }
      
      console.log('Filtered orders:', filteredOrders);
      setOrders(filteredOrders);
      setLoading(false);
    };

    // Initial load
    loadOrders();
    
    // Listen for storage changes (when Sales page adds new orders)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orders') {
        loadOrders();
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleOrdersUpdate = () => {
      loadOrders();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ordersUpdated', handleOrdersUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
    };
  }, [searchTerm, paymentStatusFilter, orderStatusFilter, dateFrom, dateTo]);

  // Calculate stats when orders change, without making API calls
  useEffect(() => {
    if (orders.length > 0) {
      console.log('Calculating stats for orders:', orders);
      calculateFallbackStats();
    } else {
      // Set zero stats when no orders
      setOrderStats({
        total_orders: 0,
        total_revenue: 0,
        pending_orders: 0,
        outstanding_amount: 0
      });
    }
  }, [orders]);

  useEffect(() => {
    if (showCreateModal) {
      fetchProducts();
    }
  }, [showCreateModal]);

  // Handle status update
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      // Update locally for demo mode
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: newStatus as 'pending' | 'processing' | 'completed' | 'cancelled' }
          : order
      );
      setOrders(updatedOrders);
      
      // Update localStorage
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      // Stats will be recalculated automatically by useEffect
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating status:', err);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        // Remove from local orders list for demo mode
        const orderToDelete = orders.find(order => order.id === id);
        const updatedOrders = orders.filter(order => order.id !== id);
        setOrders(updatedOrders);
        
        // Update localStorage
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        // Update stats
        if (orderToDelete && orderStats) {
          setOrderStats({
            ...orderStats,
            total_orders: Math.max(0, orderStats.total_orders - 1),
            total_revenue: Math.max(0, orderStats.total_revenue - orderToDelete.total_amount),
            pending_orders: orderToDelete.order_status === 'pending' ? Math.max(0, orderStats.pending_orders - 1) : orderStats.pending_orders,
            outstanding_amount: Math.max(0, orderStats.outstanding_amount - orderToDelete.due_amount)
          });
        }
      } catch (err) {
        setError('Failed to delete order');
        console.error('Error deleting order:', err);
      }
    }
  };

  // Handle payment update
  const handlePaymentUpdate = async () => {
    if (!selectedOrder || !paymentAmount) return;
    
    try {
      const newPaidAmount = selectedOrder.paid_amount + parseFloat(paymentAmount);
      const newDueAmount = Math.max(0, selectedOrder.total_amount - newPaidAmount);
      const newPaymentStatus = newDueAmount === 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending');
      
      // Update locally for demo mode
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              paid_amount: newPaidAmount,
              due_amount: newDueAmount,
              payment_status: newPaymentStatus as 'pending' | 'partial' | 'paid'
            }
          : order
      );
      setOrders(updatedOrders);
      
      // Update localStorage
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      // Stats will be recalculated automatically by useEffect
      
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to update payment');
      console.error('Error updating payment:', err);
    }
  };

  // Print receipt function
  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 320px; 
            margin: 0 auto; 
            padding: 24px; 
            background: #fff;
            color: #333;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            padding-bottom: 20px; 
            margin-bottom: 24px; 
            border-bottom: 1px solid #e0e0e0;
          }
          .header h2 { 
            font-size: 24px; 
            font-weight: 700; 
            color: #2563eb; 
            margin-bottom: 4px; 
          }
          .header p { 
            font-size: 12px; 
            color: #6b7280; 
            font-weight: 500; 
          }
          .order-info { 
            background: #f8fafc; 
            padding: 16px; 
            border-radius: 8px; 
            margin-bottom: 24px; 
          }
          .order-info p { 
            margin-bottom: 6px; 
            font-size: 14px; 
          }
          .order-info strong { 
            color: #374151; 
            font-weight: 600; 
          }
          .items { 
            margin-bottom: 24px; 
          }
          .items h3 { 
            font-size: 16px; 
            font-weight: 600; 
            color: #374151; 
            margin-bottom: 16px; 
            padding-bottom: 8px; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .item { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            padding: 12px 0; 
            border-bottom: 1px solid #f3f4f6; 
          }
          .item:last-child { 
            border-bottom: none; 
          }
          .item-details { 
            flex: 1; 
          }
          .item-name { 
            font-weight: 600; 
            font-size: 15px; 
            color: #111827; 
            margin-bottom: 4px; 
          }
          .item-quantity { 
            font-size: 12px; 
            color: #6b7280; 
            font-weight: 500; 
          }
          .item-price { 
            font-weight: 600; 
            font-size: 15px; 
            color: #111827; 
            margin-left: 16px; 
          }
          .totals { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 24px; 
          }
          .total-line { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            font-size: 14px; 
          }
          .total-line:last-child { 
            margin-bottom: 0; 
          }
          .final-total { 
            font-weight: 700; 
            font-size: 18px; 
            color: #111827; 
            padding-top: 12px; 
            margin-top: 12px; 
            border-top: 1px solid #d1d5db; 
          }
          .footer { 
            text-align: center; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer p { 
            font-size: 13px; 
            color: #6b7280; 
            margin-bottom: 4px; 
          }
          .footer .thank-you { 
            font-weight: 600; 
            color: #2563eb; 
            font-size: 14px; 
          }
          @media print { 
            body { margin: 0; padding: 16px; } 
            .header h2 { color: #000 !important; }
            .footer .thank-you { color: #000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>FilHub Enterprise</h2>
          <p>POS & Inventory Management System</p>
        </div>
        
        <div class="order-info">
          <p><strong>Order #:</strong> ${order.order_number}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${order.customer?.name || 'Walk-in Customer'}</p>
          ${order.customer?.phone ? `<p><strong>Phone:</strong> ${order.customer.phone}</p>` : ''}
        </div>

        <div class="items">
          <h3>Items:</h3>
          ${(order as any).items ? (order as any).items.map((item: any) => `
            <div class="item">
              <div class="item-details">
                <div class="item-name">${item.name || item.product_name || 'Product'}</div>
                <div class="item-quantity">Quantity: ${item.quantity}</div>
              </div>
              <span class="item-price">₱${(item.total || item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('') : '<p>No items available</p>'}
        </div>

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>₱${order.subtotal.toFixed(2)}</span>
          </div>
          ${order.discount_amount > 0 ? `
            <div class="total-line">
              <span>Discount:</span>
              <span>-₱${order.discount_amount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-line final-total">
            <span>Total:</span>
            <span>₱${order.total_amount.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>Paid:</span>
            <span>₱${order.paid_amount.toFixed(2)}</span>
          </div>
          ${order.due_amount > 0 ? `
            <div class="total-line">
              <span>Due:</span>
              <span>₱${order.due_amount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${order.paid_amount > order.total_amount ? `
            <div class="total-line">
              <span>Change:</span>
              <span>₱${(order.paid_amount - order.total_amount).toFixed(2)}</span>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p class="thank-you">Thank you for your business!</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Total Amount', 'Payment Status', 'Order Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        order.order_number,
        order.customer?.name || 'Walk-in Customer',
        order.total_amount,
        order.payment_status,
        order.order_status,
        new Date(order.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Add product to order
  const addProductToOrder = (product: any) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      setSelectedProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, quantity: Math.min(p.quantity + 1, p.stock) }
          : p
      ));
    } else {
      setSelectedProducts(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: product.selling_price || product.price || 0,
        quantity: 1,
        stock: product.stock_quantity || 0
      }]);
    }
  };

  // Remove product from order
  const removeProductFromOrder = (productId: number) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Update product quantity
  const updateProductQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromOrder(productId);
      return;
    }
    setSelectedProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, quantity: Math.min(quantity, p.stock) }
        : p
    ));
  };

  // Calculate order totals
  const calculateOrderTotals = () => {
    const subtotal = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const total = subtotal - discountAmount + taxAmount;
    const dueAmount = Math.max(0, total - paidAmount);
    
    return { subtotal, taxAmount, total, dueAmount };
  };

  // Create new order
  const handleCreateOrder = async () => {
    if (selectedProducts.length === 0) {
      setError('Please add at least one product to the order');
      return;
    }

    try {
      setError(null); // Clear any previous errors
      const totals = calculateOrderTotals();
      
      // Create mock order for demo mode (since API is not available)
      const mockOrder = {
        id: Date.now(),
        order_number: `ORD-${String(Date.now()).slice(-6)}`,
        customer: customerName ? { 
          id: Date.now() + 1,
          name: customerName, 
          phone: customerPhone, 
          email: customerEmail 
        } : null,
        user: {
          id: 1,
          name: 'Current User'
        },
        subtotal: totals.subtotal,
        discount_amount: discountAmount,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        paid_amount: paidAmount,
        due_amount: totals.dueAmount,
        payment_status: (paidAmount >= totals.total ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending')) as 'pending' | 'partial' | 'paid',
        order_status: 'pending' as 'pending' | 'processing' | 'completed' | 'cancelled',
        notes: orderNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to local orders list
      setOrders(prev => [mockOrder as Order, ...prev]);
      
      // Update stats
      const newStats = {
        total_orders: (orderStats?.total_orders || 0) + 1,
        total_revenue: (orderStats?.total_revenue || 0) + totals.total,
        pending_orders: (orderStats?.pending_orders || 0) + 1,
        outstanding_amount: (orderStats?.outstanding_amount || 0) + totals.dueAmount
      };
      setOrderStats(newStats);
      
      // Reset form
      resetCreateOrderForm();
      setShowCreateModal(false);
      
      // Show success message
      alert('Order created successfully!');
      
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError('Failed to create order. Please try again.');
    }
  };

  // Reset create order form
  const resetCreateOrderForm = () => {
    setSelectedProducts([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setOrderNotes('');
    setDiscountAmount(0);
    setPaidAmount(0);
    setProductSearch('');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setPaymentStatusFilter('');
    setOrderStatusFilter('');
    setDateFrom('');
    setDateTo('');
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string, type: 'payment' | 'order') => {
    if (type === 'payment') {
      switch (status) {
        case 'paid': return 'bg-green-100 text-green-800';
        case 'partial': return 'bg-yellow-100 text-yellow-800';
        case 'pending': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'processing': return 'bg-blue-100 text-blue-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-900'}`}>Order Management</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Manage customer orders and track payments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="bg-yellow-500 text-blue-900 font-medium px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center"
          >
            <span className="mr-2">📊</span>
            Export CSV
          </button>
          {role === 'admin' && (
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center space-x-2"
            >
              <span>🖨️</span>
              <span>Print Receipt</span>
            </button>
          )}
        </div>
      </div>


      {/* Filters */}
      <div className={`p-4 rounded-lg shadow mb-6 border-l-4 border-blue-800 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">All Order Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <button
              onClick={clearFilters}
              className={`w-full px-3 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <div>
              <p className="font-medium">Connection Issue</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1">The page will work in demo mode with sample data.</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className={`rounded-lg shadow overflow-hidden border-l-4 border-yellow-500 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Order Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Amount
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Payment Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Order Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-4xl mb-4">📋</div>
                      <p className="text-lg font-medium mb-2">No orders found</p>
                      <p className="text-sm">Orders will appear here after processing sales</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                <tr key={order.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {/* Product Images for Completed Orders */}
                      {order.order_status === 'completed' && (order as any).items && (order as any).items.length > 0 && (
                        <div className="flex -space-x-2">
                          {(order as any).items.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden">
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
                          {(order as any).items.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">+{(order as any).items.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.order_number}</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ID: {order.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {order.customer?.name || 'Walk-in Customer'}
                    </div>
                    {order.customer?.phone && (
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{order.customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₱{(order.total_amount || 0).toFixed(2)}</div>
                    {(order.due_amount || 0) > 0 && (
                      <div className="text-sm text-red-600">Due: ₱{(order.due_amount || 0).toFixed(2)}</div>
                    )}
                    {order.paid_amount && (order.paid_amount || 0) > (order.total_amount || 0) && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Change: ₱{((order.paid_amount || 0) - (order.total_amount || 0)).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.payment_status || 'pending', 'payment')}`}>
                      {(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.order_status || 'pending', 'order')}`}>
                      {(order.order_status || 'pending').charAt(0).toUpperCase() + (order.order_status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-800 hover:text-blue-900 font-medium"
                      >
                        View
                      </button>
                      {role === 'admin' && (
                        <>
                          <select
                            value={order.order_status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className={`text-xs border rounded px-2 py-1 ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {order.due_amount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowPaymentModal(true);
                              }}
                              className="text-yellow-600 hover:text-yellow-700 font-medium"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No orders found</div>
            <div className="text-gray-400 text-sm mt-1">
              {error ? 'Unable to load orders from server' : 
               (searchTerm || paymentStatusFilter || orderStatusFilter ? 'Try adjusting your filters' : 'Create your first order to get started')}
            </div>
            {error && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setError(null);
                    fetchOrders();
                    fetchOrderStats();
                  }}
                  className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Order Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Order Number</p>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Date</p>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Customer</p>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{selectedOrder.customer?.name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Phone</p>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{selectedOrder.customer?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className={`border-t pt-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal</p>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>₱{(selectedOrder.subtotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Discount</p>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>₱{(selectedOrder.discount_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tax</p>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>₱{(selectedOrder.tax_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total</p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>₱{(selectedOrder.total_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                    <p className="text-lg text-green-600">₱{(selectedOrder.paid_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Due Amount</p>
                    <p className="text-lg text-red-600">₱{(selectedOrder.due_amount || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.payment_status || 'pending', 'payment')}`}>
                      {(selectedOrder.payment_status || 'pending').charAt(0).toUpperCase() + (selectedOrder.payment_status || 'pending').slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Order Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.order_status || 'pending', 'order')}`}>
                      {(selectedOrder.order_status || 'pending').charAt(0).toUpperCase() + (selectedOrder.order_status || 'pending').slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-600">Notes</p>
                  <p className="text-gray-900">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order: {selectedOrder.order_number}</p>
                <p className="text-sm text-gray-600">Due Amount: ₱{selectedOrder.due_amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handlePaymentUpdate}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors disabled:bg-gray-400"
                >
                  Update Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create New Order</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateOrderForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Selection */}
              <div className="lg:col-span-2">
                <h4 className="text-lg font-semibold mb-4">Select Products</h4>
                
                {/* Product Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Available Products */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products
                      .filter(product => 
                        product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                        product.sku?.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map(product => (
                        <div key={product.id} className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{product.name}</h5>
                              <p className="text-xs text-gray-500">{product.sku}</p>
                              <p className="text-sm font-semibold text-green-600">₱{(product.selling_price || product.price || 0).toFixed(2)}</p>
                              <p className="text-xs text-gray-500">Stock: {product.stock_quantity || 0}</p>
                            </div>
                            <button
                              onClick={() => addProductToOrder(product)}
                              disabled={!product.stock_quantity || product.stock_quantity <= 0}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Selected Products */}
                <h4 className="text-lg font-semibold mb-4">Order Items</h4>
                <div className="bg-white border rounded-lg">
                  {selectedProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No products selected. Add products from above.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {selectedProducts.map(product => (
                        <div key={product.id} className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{product.name}</h5>
                            <p className="text-sm text-gray-500">₱{product.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">{product.quantity}</span>
                              <button
                                onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                                disabled={product.quantity >= product.stock}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <p className="font-semibold">₱{(product.price * product.quantity).toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => removeProductFromOrder(product.id)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Summary & Customer Details */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Customer Information</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Customer Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (Optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email (Optional)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Order Calculations */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Order Summary</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {(() => {
                      const { subtotal, taxAmount, total, dueAmount } = calculateOrderTotals();
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>₱{subtotal.toFixed(2)}</span>
                            <span className={dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                              ₱{dueAmount.toFixed(2)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Order Notes */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Order Notes</h4>
                  <textarea
                    placeholder="Add any notes for this order..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateOrder}
                    disabled={selectedProducts.length === 0}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Create Order
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateOrderForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Select Order to Print</h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orders available to print</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        printReceipt(order);
                        setShowPrintModal(false);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-gray-500">
                            {order.customer?.name || 'Walk-in Customer'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₱{order.total_amount.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
