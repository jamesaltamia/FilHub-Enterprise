import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { productsAPI, ordersAPI } from '../services/api';
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
  name: string;
  phone: string;
  email: string;
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
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash'>('cash');

  // Fetch products for sale
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get products from localStorage (which has updated stock levels)
      const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      if (storedProducts.length > 0) {
        // Only show active products with stock
        const activeProducts = storedProducts.filter((product: Product) => product.is_active && product.stock_quantity > 0);
        setProducts(activeProducts);
      } else {
        // Fallback to API if no localStorage data
        const response = await productsAPI.getAll({ per_page: 100 });
        if (response && response.data) {
          const productsData = Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
          const activeProducts = productsData.filter((product: Product) => product.is_active && product.stock_quantity > 0);
          setProducts(activeProducts);
        } else {
          setProducts([]);
        }
      }
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        setError('Failed to fetch products. Please check your connection.');
      }
      setProducts([]);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add product from navigation (when redirected from Products page)
  useEffect(() => {
    if (productFromNavigation) {
      addToSale(productFromNavigation);
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [productFromNavigation]);

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

      // Save order to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const newOrder = {
        id: Date.now(),
        order_number: `ORD-${Date.now()}`,
        customer: customer.name ? { name: customer.name, phone: customer.phone } : null,
        items: saleItems,
        paid_amount: paidAmount,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: total,
        subtotal: subtotal,
        created_at: new Date().toISOString(),
        payment_status: paidAmount >= total ? 'paid' : 'partial',
        order_status: 'completed',
        notes: customer.name ? `Customer: ${customer.name}, Phone: ${customer.phone}` : 'Walk-in customer'
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
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <button
          onClick={clearSale}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Clear Sale
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToSale(product)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:shadow-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {/* Product Image */}
                  <div className="mb-3 flex justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                        <span className="text-2xl text-gray-400 dark:text-gray-500">📦</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-sm mb-1 text-center">{product.name}</h3>
                  <p className={`text-xs mb-2 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    SKU: {product.sku}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600">
                      ₱{(product.selling_price || product.price).toFixed(2)}
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Stock: {product.stock_quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h2 className="text-xl font-semibold mb-4">Current Sale</h2>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {saleItems.length === 0 ? (
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No items in cart</p>
              ) : (
                saleItems.map((item) => (
                  <div key={item.id} className={`p-3 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <button
                        onClick={() => removeFromSale(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-sm">₱{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className={`border-t pt-4 space-y-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold text-lg border-t pt-2 ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <span>Total:</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowCustomerModal(true)}
                className={`w-full py-2 px-4 border rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                }`}
              >
                {customer.name ? `Customer: ${customer.name}` : 'Add Customer'}
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={saleItems.length === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg w-96`}>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) => setCustomer({...customer, name: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={customer.phone}
                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={customer.email}
                onChange={(e) => setCustomer({...customer, email: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowCustomerModal(false)}
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
    </div>
  );
};

export default Sales;
