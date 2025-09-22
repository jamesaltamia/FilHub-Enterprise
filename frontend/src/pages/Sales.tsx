import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  selling_price?: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SaleItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  total: number;
  image?: string;
}

interface Customer {
  id?: number;
  name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  postal_code?: string;
  total_orders?: number;
  total_spent?: number;
  is_active?: boolean;
}

const Sales: React.FC = () => {
  const { } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const location = useLocation();
  
  // Get product from navigation state (when redirected from Products page)
  const productFromNavigation = location.state?.product;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customer information
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: '',
    email: ''
  });
  
  // Payment and totals
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate] = useState(0); // No tax for school
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  
  // UI states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash'>('cash');
  
  // New customer form data
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    is_active: true
  });

  // Fetch products for sale
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always prioritize localStorage data for Sales page
      const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      if (storedProducts.length > 0) {
        // Only show active products with stock
        const activeProducts = storedProducts.filter((product: Product) => product.is_active && product.stock_quantity > 0);
        setProducts(activeProducts);
        console.log('Sales: Loaded products from localStorage');
      } else {
        // Try API as fallback, but don't let it cause logout
        try {
          console.log('Sales: Trying API fallback for products');
          const response = await productsAPI.getAll({ per_page: 100 });
          if (response && response.data) {
            const productsData = Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
            const activeProducts = productsData.filter((product: Product) => product.is_active && product.stock_quantity > 0);
            setProducts(activeProducts);
            console.log('Sales: Loaded products from API');
          } else {
            setProducts([]);
          }
        } catch (apiError) {
          console.log('Sales: API failed (expected in demo mode), using empty product list');
          setProducts([]);
          // Don't show error for API failures in demo mode
        }
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // If redirected from Products page with a product, add it to sale
    if (productFromNavigation) {
      addToSale(productFromNavigation);
      // Clear the navigation state to prevent re-adding on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [productFromNavigation]);


  // Add new customer function
  const addNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = {
        ...newCustomerForm,
        total_orders: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get existing customers
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Create new customer with unique ID
      const newCustomer = {
        ...customerData,
        id: Math.max(...existingCustomers.map((c: any) => c.id), 0) + 1
      };
      
      // Add to customers list
      const updatedCustomers = [...existingCustomers, newCustomer];
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      
      
      // Set as selected customer for this sale
      setCustomer({
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        city: newCustomer.city,
        postal_code: newCustomer.postal_code
      });
      
      // Reset form and close modal
      setNewCustomerForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        is_active: true
      });
      setShowAddCustomerModal(false);
      
      alert(`Customer "${newCustomer.name}" added and selected for this sale!`);
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer. Please try again.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Calculate totals whenever sale items change
  useEffect(() => {
    const newSubtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const newTaxAmount = (newSubtotal - discountAmount) * (taxRate / 100);
    const newTotal = newSubtotal - discountAmount + newTaxAmount;
    const newChange = Math.max(0, paidAmount - newTotal);

    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotal(newTotal);
    setChangeAmount(newChange);
  }, [saleItems, discountAmount, taxRate, paidAmount]);

  // Add product to sale
  const addToSale = (product: Product) => {
    const existingItem = saleItems.find(item => item.id === product.id);
    const price = product.selling_price || product.price;
    
    if (existingItem) {
      setSaleItems(prev => prev.map(item => 
        item.id === product.id 
          ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
          : item
      ));
    } else {
      setSaleItems(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: price,
        quantity: 1,
        stock: product.stock_quantity,
        total: price,
        image: product.image
      }]);
    }
  };

  // Remove item from sale
  const removeFromSale = (productId: number) => {
    setSaleItems(prev => prev.filter(item => item.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromSale(productId);
      return;
    }
    
    setSaleItems(prev => prev.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.min(quantity, item.stock), total: Math.min(quantity, item.stock) * item.price }
        : item
    ));
  };

  // Clear sale
  const clearSale = () => {
    setSaleItems([]);
    setCustomer({ name: '', phone: '', email: '' });
    setDiscountAmount(0);
    setPaidAmount(0);
  };

  // Process sale
  const processSale = async () => {
    if (saleItems.length === 0) return;
    
    try {
      // Create order data
      const orderData = {
        customer_id: customer.name ? undefined : undefined, // For walk-in customers
        items: saleItems.map(item => ({
          product_id: item.id,
          qty: item.quantity,
          price: item.price
        })),
        paid_amount: paidAmount,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        notes: customer.name ? `Customer: ${customer.name}, Phone: ${customer.phone}` : 'Walk-in customer',
        order_status: 'completed' as const
      };

      // Update product stock quantities
      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedProducts = existingProducts.map((product: any) => {
        const saleItem = saleItems.find(item => item.id === product.id);
        if (saleItem) {
          return {
            ...product,
            stock_quantity: Math.max(0, product.stock_quantity - saleItem.quantity)
          };
        }
        return product;
      });
      localStorage.setItem('products', JSON.stringify(updatedProducts));

      // Update customer data if customer is selected
      if (customer.id) {
        const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
        const updatedCustomers = existingCustomers.map((c: any) => {
          if (c.id === customer.id) {
            return {
              ...c,
              total_orders: (c.total_orders || 0) + 1,
              total_spent: (c.total_spent || 0) + total,
              last_order_date: new Date().toISOString().split('T')[0]
            };
          }
          return c;
        });
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      }

      // Save order to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const newOrder = {
        id: Date.now(),
        order_number: `ORD-${Date.now()}`,
        customer_id: customer.id || null,
        customer: customer.name ? { 
          id: customer.id,
          name: customer.name, 
          phone: customer.phone,
          email: customer.email
        } : null,
        user: {
          id: 1,
          name: 'Current User'
        },
        items: saleItems,
        subtotal: saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: total,
        paid_amount: paidAmount,
        due_amount: Math.max(0, total - paidAmount),
        payment_status: paidAmount >= total ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending'),
        order_status: 'completed',
        notes: customer.name ? `Customer: ${customer.name}, Phone: ${customer.phone}` : 'Walk-in customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      existingOrders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(existingOrders));
      
      // Refresh products to show updated stock
      fetchProducts();
      
      // Clear the sale after processing
      clearSale();
      setShowPaymentModal(false);
      
      // Show success message
      alert('Sale processed successfully!');
      
      // Trigger orders page refresh
      window.dispatchEvent(new Event('ordersUpdated'));
      
      // Navigate to orders page
      navigate('/orders');
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale. Please try again.');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Loading products...</p>
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
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Point of Sale</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Process sales and manage transactions</p>
              </div>
            </div>
            <button
              onClick={clearSale}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              <span className="mr-2">🗑️</span>
              Clear Sale
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <span className="text-lg">📦</span>
                    </div>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Products</h2>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {filteredProducts.length} items
                  </span>
                </div>
                
                {/* Modern Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Modern Products Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToSale(product)}
                      className={`group p-4 border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-500' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-blue-100'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="mb-3 flex justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-300 transition-colors duration-300"
                          />
                        ) : (
                          <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-colors duration-300 ${
                            theme === 'dark' 
                              ? 'bg-gray-600 border-gray-500 group-hover:border-blue-400' 
                              : 'bg-gray-100 border-gray-200 group-hover:border-blue-300'
                          }`}>
                            <span className="text-3xl text-gray-400 dark:text-gray-500">📦</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className={`font-semibold text-sm mb-1 text-center line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {product.name}
                      </h3>
                      <p className={`text-xs mb-3 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        SKU: {product.sku}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ₱{(product.selling_price || product.price).toFixed(2)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.stock_quantity > 10 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : product.stock_quantity > 0
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {product.stock_quantity} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                      <span className="text-lg">🛍️</span>
                    </div>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Current Sale</h2>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {saleItems.length} items
                  </span>
                </div>
              </div>
              
              {/* Cart Items */}
              <div className="p-6">
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                  {saleItems.length === 0 ? (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-4xl mb-3">🛒</div>
                      <p className="text-sm">No items in cart</p>
                      <p className="text-xs mt-1">Click on products to add them</p>
                    </div>
                  ) : (
                    saleItems.map((item) => (
                      <div key={item.id} className={`group p-4 border rounded-xl transition-all duration-200 ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-blue-200'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.name}</h4>
                          <button
                            onClick={() => removeFromSale(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors duration-200 ${
                                theme === 'dark' 
                                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              −
                            </button>
                            <span className={`text-sm font-semibold min-w-[2rem] text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors duration-200 ${
                                theme === 'dark' 
                                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            ₱{item.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
            </div>

            {/* Totals */}
            <div className={`border-t pt-4 space-y-3 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold text-xl border-t pt-3 ${
                theme === 'dark' ? 'border-gray-600 text-white' : 'border-gray-200 text-gray-900'
              }`}>
                <span>Total:</span>
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  ₱{total.toFixed(2)}
                </span>
              </div>
            </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-4">
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className={`w-full py-3 px-4 border rounded-xl transition-all duration-200 font-medium ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white hover:shadow-lg' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900 hover:shadow-md'
                    }`}
                  >
                    <span className="mr-2">👤</span>
                    {customer.name ? customer.name : 'Add Customer for Sale'}
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={saleItems.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    <span className="mr-2">💳</span>
                    Process Sale (₱{total.toFixed(2)})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />


      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg w-96`}>
            <h3 className="text-lg font-semibold mb-4">Payment</h3>
            
            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Amount Paid */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount Paid</label>
              <input
                type="number"
                value={paidAmount === 0 ? '' : paidAmount}
                onChange={(e) => setPaidAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0.00"
              />
            </div>

            {/* Total and Change */}
            <div className={`mb-6 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between">
                <span>Change:</span>
                <span className={`font-bold ${changeAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ₱{changeAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={processSale}
                disabled={paidAmount < total}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Complete Sale
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
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

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${
            theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
          } p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Customer</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className={`text-2xl font-bold hover:opacity-70 transition-opacity ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={addNewCustomer} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Email *</label>
                <input
                  type="email"
                  required
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Phone *</label>
                <input
                  type="tel"
                  required
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Address</label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>City</label>
                  <input
                    type="text"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, city: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Postal Code</label>
                  <input
                    type="text"
                    value={newCustomerForm.postal_code}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, postal_code: e.target.value})}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newCustomerForm.is_active}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className={`ml-2 block text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                }`}>Active Customer</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className={`px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    theme === 'dark'
                      ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-gray-500'
                      : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200 focus:ring-gray-500'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
