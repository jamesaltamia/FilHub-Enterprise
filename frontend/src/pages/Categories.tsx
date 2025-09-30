import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI, categoriesAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

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
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_alert: number;
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Uniform-specific fields
  uniform_size?: string;
  uniform_gender?: string;
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
  const [success, setSuccess] = useState<string | null>(null);
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
    selling_price: '',
    cost_price: '',
    low_stock_alert: '',
    stock_quantity: '',
    image: '',
    is_active: true,
    // Uniform-specific fields
    uniform_size: '',
    uniform_gender: ''
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
          
          // Ensure "Uniform" category exists for demo
          const hasUniformCategory = parsedCategories.some((cat: Category) => 
            cat.name.toLowerCase() === 'uniform'
          );
          
          if (!hasUniformCategory) {
            const uniformCategory: Category = {
              id: Date.now(),
              name: 'Uniform',
              description: 'School and work uniforms with size and gender specifications',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            parsedCategories.push(uniformCategory);
            localStorage.setItem('categories', JSON.stringify(parsedCategories));
          }
          
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
        // Update existing category
        let updateSuccess = false;
        
        try {
          const response = await categoriesAPI.update(editingCategory.id, formData);
          updateSuccess = true;
          console.log('Category updated via API');
          
          // Update localStorage with the updated category from API response
          const storedCategories = localStorage.getItem('categories');
          if (storedCategories) {
            const categories = JSON.parse(storedCategories);
            const updatedCategories = categories.map((cat: Category) => 
              cat.id === editingCategory.id 
                ? response.data
                : cat
            );
            localStorage.setItem('categories', JSON.stringify(updatedCategories));
            console.log('Category updated in localStorage');
          }
        } catch {
          console.log('API update failed (expected in demo mode), using localStorage fallback');
          
          // Fallback to localStorage for demo mode
          const storedCategories = localStorage.getItem('categories');
          if (storedCategories) {
            const categories = JSON.parse(storedCategories);
            const updatedCategories = categories.map((cat: Category) => 
              cat.id === editingCategory.id 
                ? { ...cat, ...formData, updated_at: new Date().toISOString() }
                : cat
            );
            localStorage.setItem('categories', JSON.stringify(updatedCategories));
            updateSuccess = true;
            console.log('Category updated in localStorage');
          }
        }
        
        if (!updateSuccess) {
          throw new Error('Failed to update category');
        }
        
      } else {
        // Create new category
        let createSuccess = false;
        
        try {
          const response = await categoriesAPI.create(formData);
          createSuccess = true;
          console.log('Category created via API');
          
          // Update localStorage with the new category from API response
          const storedCategories = localStorage.getItem('categories');
          const categories = storedCategories ? JSON.parse(storedCategories) : [];
          categories.push(response.data);
          localStorage.setItem('categories', JSON.stringify(categories));
        } catch {
          console.log('API create failed (expected in demo mode), using localStorage fallback');
          
          // Fallback to localStorage for demo mode
          const storedCategories = localStorage.getItem('categories');
          const categories = storedCategories ? JSON.parse(storedCategories) : [];
          const newCategory: Category = {
            id: Date.now(), // Use timestamp as ID for demo
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          categories.push(newCategory);
          localStorage.setItem('categories', JSON.stringify(categories));
          createSuccess = true;
          console.log('Category created in localStorage');
        }
        
        if (!createSuccess) {
          throw new Error('Failed to create category');
        }
      }

      // Success - close modal and refresh
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
      setError(null); // Clear any previous errors
      setSuccess(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      console.log('Category operation completed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
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
    // Check if category has products
    const categoryProducts = products.filter(product => product.category_id === id);
    
    let confirmMessage = 'Are you sure you want to delete this category?';
    if (categoryProducts.length > 0) {
      confirmMessage = `This category has ${categoryProducts.length} product(s). Deleting it will also remove all associated products. Are you sure you want to continue?`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        // Try API first
        try {
          await categoriesAPI.delete(id);
          console.log('Category deleted via API');
        } catch {
          console.log('API delete failed (expected in demo mode), using localStorage fallback');
          
          // Fallback to localStorage for demo mode
          const storedCategories = localStorage.getItem('categories');
          if (storedCategories) {
            const categories = JSON.parse(storedCategories);
            const filteredCategories = categories.filter((cat: Category) => cat.id !== id);
            localStorage.setItem('categories', JSON.stringify(filteredCategories));
            console.log('Category deleted from localStorage');
          }
          
          // Also remove associated products from localStorage
          const storedProducts = localStorage.getItem('products');
          if (storedProducts) {
            const allProducts = JSON.parse(storedProducts);
            const filteredProducts = allProducts.filter((product: Product) => product.category_id !== id);
            localStorage.setItem('products', JSON.stringify(filteredProducts));
            console.log('Associated products removed from localStorage');
          }
        }
        
        // Refresh data
        fetchCategories();
        fetchProducts();
        setError(null); // Clear any previous errors
        setSuccess('Category deleted successfully!');
        
        // Show success message
        console.log('Category and associated products deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        
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
      // Check if this is a uniform category
      const selectedCategoryName = categories.find(cat => cat.id === parseInt(productFormData.category_id))?.name?.toLowerCase();
      const isUniformCategory = selectedCategoryName === 'uniform';
      
      const productData = {
        name: productFormData.name,
        description: productFormData.description,
        sku: productFormData.sku,
        category_id: parseInt(productFormData.category_id),
        selling_price: parseFloat(productFormData.selling_price),
        cost_price: parseFloat(productFormData.cost_price),
        low_stock_alert: parseInt(productFormData.low_stock_alert),
        stock_quantity: parseInt(productFormData.stock_quantity),
        image: productFormData.image || null,
        is_active: productFormData.is_active,
        created_at: editingProduct ? editingProduct.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add uniform-specific fields only for uniform category
        ...(isUniformCategory && {
          uniform_size: productFormData.uniform_size,
          uniform_gender: productFormData.uniform_gender
        })
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 sm:p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <span className="text-xl sm:text-2xl">📦</span>
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Inventory Management</h1>
                <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage your product categories and inventory</p>
              </div>
            </div>
            <button
              onClick={handleAddNew}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <span className="mr-2">➕</span>
              Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Modern Search Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm mb-6`}>
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                  <span className="text-lg">🔍</span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Search Categories</h2>
              </div>
              <span className={`text-xs sm:text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {filteredCategories.length} categories
              </span>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>
        </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Modern Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredCategories.map((category) => {
          const categoryProducts = products.filter(product => product.category_id === category.id);
          const lowStockCount = categoryProducts.filter(product => 
            product.stock_quantity <= (product.low_stock_alert || 5)
          ).length;
          
          return (
            <div key={category.id} className={`group ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:scale-105`}>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <span className="text-lg">📁</span>
                    </div>
                    <h3 className={`text-base sm:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words`}>{category.name}</h3>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
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
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowProductsModal(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium flex items-center justify-center"
                    >
                      <span className="mr-1 sm:mr-2">👁️</span>
                      <span className="hidden sm:inline">View Products</span>
                      <span className="sm:hidden">View</span>
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
                            selling_price: '',
                            cost_price: '',
                            low_stock_alert: '',
                            stock_quantity: '',
                            image: '',
                            is_active: true,
                            uniform_size: '',
                            uniform_gender: ''
                          });
                          setSelectedImageFile(null);
                          setImagePreview('');
                          setShowProductModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium flex items-center justify-center"
                      >
                        <span className="mr-1 sm:mr-2">➕</span>
                        <span className="hidden sm:inline">Add Product</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className={`flex-1 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} flex items-center justify-center`}
                    >
                      <span className="mr-1 sm:mr-2">✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className={`flex-1 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-red-300 hover:bg-gray-600' : 'bg-red-50 text-red-700 hover:bg-red-100'} flex items-center justify-center`}
                    >
                      <span className="mr-1 sm:mr-2">🗑️</span>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className={`relative mx-auto border w-full max-w-md shadow-lg rounded-2xl ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="p-4 sm:p-6">
              <h3 className={`text-lg sm:text-xl font-medium mb-4 ${
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

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 text-sm font-medium border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-gray-500'
                        : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200 focus:ring-gray-500'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4">
          <div className={`relative mx-auto border w-full max-w-6xl shadow-lg rounded-2xl my-4 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className={`text-lg sm:text-xl font-medium ${
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
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>Product</th>
                            {selectedCategory.name.toLowerCase() === 'uniform' && (
                              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                              }`}>Uniform Details</th>
                            )}
                            <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>SKU</th>
                            <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>Price</th>
                            <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>Stock</th>
                            <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>Status</th>
                            <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>Actions</th>
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
                            } ${product.stock_quantity <= (product.low_stock_alert || 5) ? 'animate-pulse' : ''}`}>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
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
                              {selectedCategory.name.toLowerCase() === 'uniform' && (
                                <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell ${
                                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                  {product.uniform_size || product.uniform_gender ? (
                                    <div className="space-y-1">
                                      {product.uniform_size && (
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                                        }`}>
                                          <span className="mr-1">📏</span>
                                          {product.uniform_size}
                                        </div>
                                      )}
                                      {product.uniform_gender && (
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-1 ${
                                          theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          <span className="mr-1">
                                            {product.uniform_gender === 'Men' ? '👨' : '👩'}
                                          </span>
                                          {product.uniform_gender}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                      No uniform details
                                    </span>
                                  )}
                                </td>
                              )}
                              <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell ${
                                theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                                {product.sku}
                              </td>
                              <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${
                                theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                                ₱{product.selling_price.toFixed(2)}
                              </td>
                              <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${
                                theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  product.stock_quantity <= (product.low_stock_alert || 5)
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {product.stock_quantity}
                                </span>
                              </td>
                              <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell ${
                                theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  product.is_active 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setProductFormData({
                                      name: product.name,
                                      description: product.description || '',
                                      sku: product.sku,
                                      category_id: product.category_id?.toString() || '',
                                      selling_price: product.selling_price?.toString() || '',
                                      cost_price: product.cost_price?.toString() || '',
                                      low_stock_alert: product.low_stock_alert?.toString() || '',
                                      stock_quantity: product.stock_quantity.toString(),
                                      image: product.image || '',
                                      is_active: product.is_active,
                                      uniform_size: product.uniform_size || '',
                                      uniform_gender: product.uniform_gender || ''
                                    });
                                    setSelectedImageFile(null);
                                    setImagePreview('');
                                    setShowProductModal(true);
                                  }}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    theme === 'dark'
                                      ? 'text-blue-300 hover:bg-gray-700'
                                      : 'text-blue-600 hover:bg-blue-50'
                                  }`}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                      value={productFormData.selling_price}
                      onChange={(e) => setProductFormData({ ...productFormData, selling_price: e.target.value })}
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
                      value={productFormData.cost_price}
                      onChange={(e) => setProductFormData({ ...productFormData, cost_price: e.target.value })}
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
                      value={productFormData.low_stock_alert}
                      onChange={(e) => setProductFormData({ ...productFormData, low_stock_alert: e.target.value })}
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
                
                {/* Uniform-specific fields - only show for uniform category */}
                {(() => {
                  const selectedCategoryName = categories.find(cat => cat.id === parseInt(productFormData.category_id))?.name?.toLowerCase();
                  const isUniformCategory = selectedCategoryName === 'uniform';
                  
                  if (!isUniformCategory) return null;
                  
                  return (
                    <div className={`p-4 rounded-lg border-2 border-dashed ${
                      theme === 'dark' ? 'border-purple-600 bg-purple-900/20' : 'border-purple-300 bg-purple-50'
                    }`}>
                      <h4 className={`text-sm font-semibold mb-3 flex items-center ${
                        theme === 'dark' ? 'text-purple-200' : 'text-purple-800'
                      }`}>
                        <span className="mr-2">👕</span>
                        Uniform Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Size *
                          </label>
                          <select
                            value={productFormData.uniform_size}
                            onChange={(e) => setProductFormData({ ...productFormData, uniform_size: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            required
                          >
                            <option value="">Select Size</option>
                            <option value="XS">XS (Extra Small)</option>
                            <option value="S">S (Small)</option>
                            <option value="M">M (Medium)</option>
                            <option value="L">L (Large)</option>
                            <option value="XL">XL (Extra Large)</option>
                            <option value="XXL">XXL (Double Extra Large)</option>
                            <option value="XXXL">XXXL (Triple Extra Large)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Gender *
                          </label>
                          <select
                            value={productFormData.uniform_gender}
                            onChange={(e) => setProductFormData({ ...productFormData, uniform_gender: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="Men">Men</option>
                            <option value="Women">Women</option>
                          </select>
                        </div>
                      </div>
                      
                      <p className={`text-xs mt-2 ${
                        theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
                      }`}>
                        These fields are required for uniform products to help customers find the right fit.
                      </p>
                    </div>
                  );
                })()}
                
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
