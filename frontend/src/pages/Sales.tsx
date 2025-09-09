import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';

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
}

interface Customer {
  name: string;
  phone: string;
  email: string;
}

const Sales: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
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
  const [taxRate, setTaxRate] = useState(12); // 12% VAT
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  
  // UI states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gcash'>('cash');

  // Fetch products for sale
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getAll({ per_page: 100 });
      if (response && response.data) {
        const productsData = Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        // Only show active products with stock
        const activeProducts = productsData.filter((product: Product) => product.is_active && product.stock_quantity > 0);
        setProducts(activeProducts);
      } else {
        setProducts([]);
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
      if (existingItem.quantity < existingItem.stock) {
        setSaleItems(prev => prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        ));
      }
    } else {
      const newItem: SaleItem = {
        id: product.id,
        name: product.name,
        price: price,
        quantity: 1,
        stock: product.stock_quantity,
        total: price
      };
      setSaleItems(prev => [...prev, newItem]);
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

  // Clear all items
  const clearSale = () => {
    setSaleItems([]);
    setCustomer({ name: '', phone: '', email: '' });
    setDiscountAmount(0);
    setPaidAmount(0);
  };

  // Process sale
  const processSale = async () => {
    if (saleItems.length === 0) {
      setError('Please add items to the sale');
      return;
    }

    if (paidAmount < total) {
      setError('Insufficient payment amount');
      return;
    }

    try {
      // Here you would typically call an API to process the sale
      // For now, we'll just simulate a successful sale
      
      alert(`Sale completed successfully!\nTotal: ₱${total.toFixed(2)}\nPaid: ₱${paidAmount.toFixed(2)}\nChange: ₱${changeAmount.toFixed(2)}`);
      
      // Clear the sale after successful processing
      clearSale();
      setShowPaymentModal(false);
      
    } catch (err) {
      setError('Failed to process sale');
      console.error('Error processing sale:', err);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600 mt-1">Process sales and manage transactions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={clearSale}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Sale
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Customer Info
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            
            {/* Product Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToSale(product)}
                  className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNSAxNUgzM1YzM0gxNVYxNVoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTIxIDIxQzIxLjgyODQgMjEgMjIuNSAyMC4zMjg0IDIyLjUgMTkuNUMyMi41IDE4LjY3MTYgMjEuODI4NCAxOCAyMSAxOEMyMC4xNzE2IDE4IDE5LjUgMTguNjcxNiAxOS41IDE5LjVDMTkuNSAyMC4zMjg0IDIwLjE3MTYgMjEgMjEgMjFaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xNi41IDI4LjVMMTkuNSAyNS41TDIyLjUgMjguNUwyNyAyNEwzMS41IDI4LjVWMzBIMTYuNVYyOC41WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-green-600">₱{(product.selling_price || product.price).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products available for sale
              </div>
            )}
          </div>
        </div>

        {/* Sale Summary Section */}
        <div className="space-y-6">
          {/* Sale Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sale Items</h2>
            
            {saleItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items in sale
              </div>
            ) : (
              <div className="space-y-3">
                {saleItems.map(item => {
                  const product = products.find(p => p.id === item.id);
                  return (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 flex-shrink-0">
                        {product?.image ? (
                          <img
                            src={product.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxMkgyOFYyOEgxMlYxMloiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE3IDE3QzE3LjU1MjMgMTcgMTggMTYuNTUyMyAxOCAxNkMxOCAxNS40NDc3IDE3LjU1MjMgMTUgMTcgMTVDMTYuNDQ3NyAxNSAxNiAxNS40NDc3IDE2IDE2QzE2IDE2LjU1MjMgMTYuNDQ3NyAxNyAxNyAxN1oiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEzLjUgMjMuNUwxNiAyMUwxOC41IDIzLjVMMjIgMjBMMjUuNSAyMy41VjI1SDEzLjVWMjMuNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">₱{item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                      <div className="text-right min-w-[60px]">
                        <p className="font-semibold text-sm">₱{item.total.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => removeFromSale(item.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sale Totals */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sale Summary</h2>
            
            <div className="space-y-3">
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
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={saleItems.length === 0}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Customer Information</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Total Amount:</span>
                  <span className="font-semibold">₱{total.toFixed(2)}</span>
                </div>
                {customer.name && (
                  <div className="text-sm text-gray-600">
                    Customer: {customer.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'gcash')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="gcash">GCash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  min={total}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {paidAmount >= total && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span className="font-semibold text-green-600">₱{changeAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={processSale}
                  disabled={paidAmount < total}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Complete Sale
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
