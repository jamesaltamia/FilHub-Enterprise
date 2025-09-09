import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, productsAPI } from '../services/api';

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

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (paymentStatusFilter) params.payment_status = paymentStatusFilter;
      if (orderStatusFilter) params.order_status = orderStatusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const response = await ordersAPI.getAll(params);
      if (response && response.data) {
        setOrders(Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []));
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      // Don't set error for auth issues as they're handled by interceptor
      if (err?.response?.status !== 401) {
        setError('Failed to fetch orders. Please check your connection.');
      }
      setOrders([]);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics (only try once)
  const [statsAttempted, setStatsAttempted] = useState(false);
  
  const fetchOrderStats = async () => {
    if (statsAttempted) return; // Prevent multiple attempts
    
    try {
      setStatsAttempted(true);
      const response = await ordersAPI.getStats();
      if (response && response.data) {
        setOrderStats(response.data);
      }
    } catch (err: any) {
      // If stats endpoint doesn't exist (404), just use fallback
      if (err?.response?.status === 404) {
        console.log('Stats endpoint not available, will use calculated stats');
      } else if (err?.response?.status !== 401) {
        console.error('Error fetching order stats:', err);
      }
      // Don't set orderStats here, let calculateFallbackStats handle it
    }
  };

  // Calculate basic stats from orders data when API endpoint is not available
  const calculateFallbackStats = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const pendingOrders = orders.filter(order => order.order_status === 'pending').length;
    const outstandingAmount = orders.reduce((sum, order) => sum + order.due_amount, 0);

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

  useEffect(() => {
    // Add a small delay to prevent immediate API calls on mount
    const timer = setTimeout(() => {
      fetchOrders();
      // Try to fetch stats once on initial load
      if (!orderStats) {
        fetchOrderStats();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [searchTerm, paymentStatusFilter, orderStatusFilter, dateFrom, dateTo]);

  // Calculate stats when orders change, without making API calls
  useEffect(() => {
    if (orders.length >= 0) {
      calculateFallbackStats();
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
      await ordersAPI.updateStatus(orderId, newStatus as any);
      fetchOrders();
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating status:', err);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await ordersAPI.delete(id);
        fetchOrders();
        fetchOrderStats();
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
      await ordersAPI.updatePayment(selectedOrder.id, parseFloat(paymentAmount));
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedOrder(null);
      fetchOrders();
      fetchOrderStats();
    } catch (err) {
      setError('Failed to update payment');
      console.error('Error updating payment:', err);
    }
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
      const { taxAmount } = calculateOrderTotals();
      
      const orderData = {
        items: selectedProducts.map(p => ({
          product_id: p.id,
          qty: p.quantity,
          price: p.price
        })),
        paid_amount: paidAmount,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        notes: orderNotes,
        order_status: 'pending' as const
      };

      await ordersAPI.create(orderData);
      
      // Reset form
      setSelectedProducts([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOrderNotes('');
      setDiscountAmount(0);
      setPaidAmount(0);
      setProductSearch('');
      setShowCreateModal(false);
      
      // Refresh data
      fetchOrders();
      fetchOrderStats();
    } catch (err) {
      setError('Failed to create order');
      console.error('Error creating order:', err);
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
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage customer orders and track payments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <span className="mr-2">📊</span>
            Export CSV
          </button>
          {role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <span className="mr-2">➕</span>
              Create Order
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {orderStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                📋
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{orderStats.total_orders || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                💰
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">₱{orderStats.total_revenue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                ⏳
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{orderStats.pending_orders || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                💳
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                <p className="text-2xl font-semibold text-gray-900">₱{orderStats.outstanding_amount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-sm text-gray-500">ID: {order.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.customer?.name || 'Walk-in Customer'}
                    </div>
                    {order.customer?.phone && (
                      <div className="text-sm text-gray-500">{order.customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₱{order.total_amount.toFixed(2)}</div>
                    {order.due_amount > 0 && (
                      <div className="text-sm text-red-600">Due: ₱{order.due_amount.toFixed(2)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.payment_status, 'payment')}`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.order_status, 'order')}`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {role === 'admin' && (
                        <>
                          <select
                            value={order.order_status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
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
                              className="text-green-600 hover:text-green-900"
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
              ))}
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Order Number</p>
                  <p className="text-lg text-gray-900">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Date</p>
                  <p className="text-lg text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer</p>
                  <p className="text-lg text-gray-900">{selectedOrder.customer?.name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-lg text-gray-900">{selectedOrder.customer?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subtotal</p>
                    <p className="text-lg text-gray-900">₱{selectedOrder.subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Discount</p>
                    <p className="text-lg text-gray-900">₱{selectedOrder.discount_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tax</p>
                    <p className="text-lg text-gray-900">₱{selectedOrder.tax_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-900">₱{selectedOrder.total_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                    <p className="text-lg text-green-600">₱{selectedOrder.paid_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Due Amount</p>
                    <p className="text-lg text-red-600">₱{selectedOrder.due_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.payment_status, 'payment')}`}>
                      {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Order Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.order_status, 'order')}`}>
                      {selectedOrder.order_status.charAt(0).toUpperCase() + selectedOrder.order_status.slice(1)}
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
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Discount:</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={subtotal}
                              value={discountAmount}
                              onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Tax:</span>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="50"
                                value={taxRate}
                                onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-12 px-1 py-1 border border-gray-300 rounded text-right text-xs"
                              />
                              <span className="text-xs">%</span>
                              <span className="text-sm">₱{taxAmount.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="border-t pt-2">
                            <div className="flex justify-between font-semibold text-lg">
                              <span>Total:</span>
                              <span>₱{total.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Paid Amount:</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={total}
                              value={paidAmount}
                              onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                            />
                          </div>
                          
                          <div className="flex justify-between font-medium">
                            <span>Due Amount:</span>
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
    </div>
  );
};

export default Orders;
