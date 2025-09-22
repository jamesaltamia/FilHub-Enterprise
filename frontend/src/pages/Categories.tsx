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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In demo mode, prioritize localStorage first
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        try {
          const parsedCategories = JSON.parse(storedCategories);
          setCategories(parsedCategories);
          return;
        } catch {
          // If localStorage is corrupted, continue to API fallback
        }
      }
      
      // Fallback to API if localStorage is empty or corrupted
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
      // Silently handle API errors in demo mode
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      // Always fetch fresh data from localStorage first (since we're using localStorage for updates)
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const productsData = JSON.parse(storedProducts);
        setProducts(productsData);
        return;
      }

      // Fallback to API if localStorage is empty
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
      // Silently handle errors
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        try {
          setProducts(JSON.parse(storedProducts));
        } catch {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    
    // Add event listener for when products are updated from other components
    const handleProductsUpdated = () => {
      fetchProducts();
    };
    
    // Listen for custom events
    window.addEventListener('productsUpdated', handleProductsUpdated);
    
    // Listen for window focus to refresh data when navigating back
    const handleWindowFocus = () => {
      fetchProducts();
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
      window.removeEventListener('focus', handleWindowFocus);
    };
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

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setSelectedImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setProductFormData({ ...productFormData, image: result });
      };
      reader.readAsDataURL(file);
    }
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
        is_active: productFormData.is_active,
        created_at: editingProduct ? editingProduct.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get existing products from localStorage
      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      let updatedProducts;

      if (editingProduct) {
        // Update existing product
        updatedProducts = existingProducts.map((product: any) =>
          product.id === editingProduct.id ? { ...productData, id: editingProduct.id } : product
        );
        alert('Product updated successfully!');
      } else {
        // Create new product with unique ID
        const newProduct = {
          ...productData,
          id: Math.max(...existingProducts.map((p: any) => p.id), 0) + 1
        };
        updatedProducts = [...existingProducts, newProduct];
        alert('Product created successfully!');
      }
      
      // Save to localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // Update local state
      setProducts(updatedProducts);
      
      // Close modal and reset form
      setShowProductModal(false);
      setEditingProduct(null);
      setSelectedImageFile(null);
      setImagePreview('');
      
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Modern Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b backdrop-blur-sm bg-opacity-95 sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Inventory Management</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage your product categories and inventory</p>
              </div>
            </div>
            <button
              onClick={handleAddNew}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center"
            >
              <span className="mr-2">➕</span>
              Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Modern Search Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm mb-6`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                  <span className="text-lg">🔍</span>
                </div>
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Search Categories</h2>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {filteredCategories.length} categories
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Modern Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const categoryProducts = products.filter(product => product.category_id === category.id);
          const lowStockCount = categoryProducts.filter(product => 
            product.stock_quantity <= (product.min_stock_level || 5)
          ).length;
          
          return (
            <div key={category.id} className={`group ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:scale-105`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <span className="text-lg">📁</span>
                    </div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{category.name}</h3>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    category.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {category.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                
                {category.description && (
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{category.description}</p>
                )}
                
                {/* Modern Product Stats */}
                <div className={`mb-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} border-l-4 border-blue-500`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                      📦 {categoryProducts.length} Products
                    </span>
                    {lowStockCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full animate-pulse font-medium">
                        ⚠️ {lowStockCount} Low Stock
                      </span>
                    )}
                  </div>
                </div>
            
                {/* Modern Action Buttons */}
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowProductsModal(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium flex items-center justify-center"
                    >
                      <span className="mr-2">👁️</span>
                      View Products
                    </button>
                    {(role === 'admin' || role === 'cashier') && (
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setEditingProduct(null);
                          setProductFormData({
                            name: '',
                            description: '',
                            sku: `SKU-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                            category_id: category.id.toString(),
                            price: '',
                            cost: '',
                            min_stock_level: '',
                            stock_quantity: '',
                            image: '',
                            is_active: true
                          });
                          setSelectedImageFile(null);
                          setImagePreview('');
                          setShowProductModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2.5 rounded-xl text-sm hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium flex items-center justify-center"
                      >
                        <span className="mr-2">➕</span>
                        Add Product
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} flex items-center justify-center`}
                    >
                      <span className="mr-2">✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-red-300 hover:bg-gray-600' : 'bg-red-50 text-red-700 hover:bg-red-100'} flex items-center justify-center`}
                    >
                      <span className="mr-2">🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className={`text-4xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>📁</div>
          <div className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No categories found</div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first category to get started'}
          </div>
        </div>
      )}
      </div>

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
                                      setSelectedImageFile(null);
                                      setImagePreview(product.image || '');
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
              
              <div className="flex justify-end mt-6">
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
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedImageFile(null);
                    setImagePreview('');
                  }}
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
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Supported formats: JPG, PNG, GIF (Max 5MB)
                  </p>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3">
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Preview:
                      </label>
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setSelectedImageFile(null);
                            setProductFormData({ ...productFormData, image: '' });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
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

export default Categories;
