import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI, categoriesAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
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

const Categories: React.FC = () => {
  const { role, token } = useAuth();
  const { theme } = useTheme();
  
  // Debug: Log theme state
  console.log('Categories component theme:', theme);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    price: '',
    cost: '',
    min_stock_level: '',
    stock_quantity: '',
    image: '',
    is_active: true
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try API first
      const response = await categoriesAPI.getAll();
      // Handle paginated response
      if (response.data && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
        localStorage.setItem('categories', JSON.stringify(response.data.data));
      } else if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
        localStorage.setItem('categories', JSON.stringify(response.data));
      } else {
        setCategories([]);
      }
    } catch {
      // Silently handle API errors - don't log to console to avoid error spam
      
      // Only fallback to localStorage, don't overwrite with demo data
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        try {
          const parsedCategories = JSON.parse(storedCategories);
          setCategories(parsedCategories);
          setError('Using cached categories (API unavailable)');
        } catch {
          setCategories([]);
          setError('Failed to fetch categories');
        }
      } else {
        setCategories([]);
        setError('Failed to fetch categories');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      // Always fetch fresh data from API to get latest updates
      const response = await productsAPI.getAll();
      let productsData = [];
      if (response.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        productsData = response.data;
      }
      setProducts(productsData);
      // Update localStorage with fresh data
      localStorage.setItem('products', JSON.stringify(productsData));
    } catch {
      // Silently handle API errors - don't log to console to avoid error spam
      // Fallback to localStorage
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        try {
          setProducts(JSON.parse(storedProducts));
        } catch {
          setProducts([]);
        }
      } else {
        // Don't add demo products, keep empty array
        setProducts([]);
      }
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
      } else {
        await categoriesAPI.create(formData);
      }

      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (err) {
      setError('Failed to save category');
      console.error('Error saving category:', err);
    }
  };

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesAPI.delete(id);
        fetchCategories();
      } catch (err) {
        setError('Failed to delete category');
        console.error('Error deleting category:', err);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingCategory(null);
    resetForm();
    setShowModal(true);
  };

  // Handle product submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: productFormData.name,
        description: productFormData.description,
        sku: productFormData.sku,
        category_id: parseInt(productFormData.category_id),
        price: parseFloat(productFormData.price),
        cost: parseFloat(productFormData.cost),
        min_stock_level: parseInt(productFormData.min_stock_level),
        stock_quantity: parseInt(productFormData.stock_quantity),
        image: productFormData.image || null,
        is_active: productFormData.is_active
      };

      if (editingProduct) {
        // Update existing product
        await api.put(`/products/${editingProduct.id}`, productData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        // Create new product
        await api.post('/products', productData, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      // Refresh products and close modal
      await fetchProducts();
      setShowProductModal(false);
      setEditingProduct(null);
      
      // Trigger products updated event for Dashboard sync
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      
    } catch (err) {
      setError(editingProduct ? 'Failed to update product' : 'Failed to create product');
      console.error('Error saving product:', err);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} transition-colors duration-200`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>Inventory Management</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>Manage your product categories and inventory</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">➕</span>
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className={`p-4 rounded-lg shadow mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            theme === 'dark' 
              ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-300' 
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const categoryProducts = products.filter(product => product.category_id === category.id);
          const lowStockCount = categoryProducts.filter(product => 
            product.stock_quantity <= (product.min_stock_level || 5)
          ).length;
          
          return (
            <div key={category.id} className={`${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
              <div className="flex justify-between items-start mb-4">
                <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Categories</h2>
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>{category.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  category.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {category.description && (
                <p className={`text-gray-600 dark:text-gray-400 text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{category.description}</p>
              )}
              
              {/* Product Stats */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-400">
                    📦 {categoryProducts.length} Products
                  </span>
                  {lowStockCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full animate-pulse">
                      ⚠️ {lowStockCount} Low Stock
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowProductsModal(true);
                  }}
                  className="bg-blue-800 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-900 transition-colors"
                >
                  View Products
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg">No categories found</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first category to get started'}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="mt-3">
              <h3 className={`text-lg font-medium mb-4 ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Category Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  }`}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className={`ml-2 block text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>Active</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  📦 Products in "{selectedCategory.name}" Category
                </h3>
                <button
                  onClick={() => setShowProductsModal(false)}
                  className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ×
                </button>
              </div>
              
              {(() => {
                const categoryProducts = products.filter(product => product.category_id === selectedCategory.id);
                
                return categoryProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Image
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Product
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            SKU
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Price
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Stock
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Status
                          </th>
                          {(role === 'admin' || role === 'cashier') && (
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
                      }`}>
                        {categoryProducts.map((product) => (
                          <tr key={product.id} className={`border-b ${
                            theme === 'dark' 
                              ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' 
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          } ${product.stock_quantity <= (product.min_stock_level || 5) ? 'animate-pulse' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-16 h-16 flex-shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-2xl">📦</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className={`text-sm font-medium ${
                                    theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                                  }`}>{product.name}</div>
                                  <div className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>{product.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {product.sku}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              ₱{product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${
                                  product.stock_quantity <= (product.min_stock_level || 5)
                                    ? 'text-red-600 animate-pulse' 
                                    : theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                  {product.stock_quantity}
                                </span>
                                {product.stock_quantity <= (product.min_stock_level || 5) && (
                                  <span className="ml-2 text-xs text-red-500 animate-bounce">⚠️ Low Stock</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            {(role === 'admin' || role === 'cashier') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      console.log('Editing product:', product);
                                      console.log('Product stock_quantity:', product.stock_quantity);
                                      setEditingProduct(product);
                                      setProductFormData({
                                        name: product.name,
                                        description: product.description || '',
                                        sku: product.sku,
                                        category_id: product.category_id?.toString() || '',
                                        price: product.price.toString(),
                                        cost: product.cost.toString(),
                                        min_stock_level: product.min_stock_level.toString(),
                                        stock_quantity: product.stock_quantity.toString(),
                                        image: product.image || '',
                                        is_active: product.is_active
                                      });
                                      setShowProductModal(true);
                                    }}
                                    className="text-blue-800 hover:text-blue-900 font-medium"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg">No products in this category</div>
                    <div className="text-gray-400 text-sm mt-1">Add products to this category to see them here</div>
                  </div>
                );
              })()}
              
              <div className="flex justify-between items-center mt-6">
                {(role === 'admin' || role === 'cashier') && (
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductFormData({
                        name: '',
                        description: '',
                        sku: `SKU-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                        category_id: selectedCategory.id.toString(),
                        price: '',
                        cost: '',
                        min_stock_level: '',
                        stock_quantity: '',
                        image: '',
                        is_active: true
                      });
                      setShowProductModal(true);
                    }}
                    className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors"
                  >
                    ➕ Add Product
                  </button>
                )}
                
                <button
                  onClick={() => setShowProductsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productFormData.name}
                      onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={productFormData.sku}
                      onChange={(e) => setProductFormData({ ...productFormData, sku: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Cost *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productFormData.cost}
                      onChange={(e) => setProductFormData({ ...productFormData, cost: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={productFormData.stock_quantity}
                      onChange={(e) => setProductFormData({ ...productFormData, stock_quantity: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Min Stock Level *
                    </label>
                    <input
                      type="number"
                      value={productFormData.min_stock_level}
                      onChange={(e) => setProductFormData({ ...productFormData, min_stock_level: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={productFormData.image}
                    onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={productFormData.is_active}
                    onChange={(e) => setProductFormData({ ...productFormData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className={`ml-2 block text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    Active
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className={`px-4 py-2 text-sm font-medium border rounded-md ${
                      theme === 'dark'
                        ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600'
                        : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
