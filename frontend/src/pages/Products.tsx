import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  discount_percentage?: number;
  discount_amount?: number;
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
}

interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

const Products: React.FC = () => {
  const { token, role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    selling_price: '',
    cost_price: '',
    low_stock_alert: '',
    stock_quantity: '',
    image: '',
    is_active: true
  });
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      
      // Handle different response structures
      let productsData = [];
      if (response.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response && Array.isArray(response)) {
        productsData = response;
      }
      
      setProducts(productsData);
      
      // Save products to localStorage for Dashboard real-time updates
      localStorage.setItem('products', JSON.stringify(productsData));
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
    }
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    try {
      let imageUrl = '';
      
      // Handle file upload if selected
      if (imageUploadType === 'file' && selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', selectedFile);
        
        try {
          const uploadResponse = await api.post('/upload-image', formDataUpload);
          
          // Handle the new API response format
          if (uploadResponse.data.success && uploadResponse.data.data) {
            imageUrl = uploadResponse.data.data.url;
          } else {
            throw new Error(uploadResponse.data.message || 'Upload failed');
          }
        } catch (uploadError: any) {
          setError(`Failed to upload image: ${uploadError?.message || 'Unknown error'}. Please try again.`);
          return;
        }
      } else if (imageUploadType === 'url') {
        imageUrl = formData.image;
      }
      
      const productData = {
        name: formData.name || '',
        description: formData.description || '',
        sku: formData.sku || '',
        category_id: formData.category_id ? parseInt(formData.category_id) || 0 : 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        low_stock_alert: parseInt(formData.low_stock_alert) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image: imageUrl,
        is_active: formData.is_active
      };

      // Validate required fields
      if (!productData.name || !productData.sku) {
        setError('Name and SKU are required');
        return;
      }
      if (isNaN(productData.selling_price) || productData.selling_price < 0) {
        setError('Valid selling price is required');
        return;
      }
      if (isNaN(productData.cost_price) || productData.cost_price < 0) {
        setError('Valid cost price is required');
        return;
      }

      if (editingProduct) {
      } else {
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
      
      // Trigger dashboard update
      window.dispatchEvent(new Event('productsUpdated'));
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save product';
      setError(errorMessage);
    }
  };

  // Handle edit
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      category_id: product.category_id?.toString() || '',
      selling_price: product.selling_price.toString(),
      cost_price: product.cost_price.toString(),
      low_stock_alert: product.low_stock_alert.toString(),
      stock_quantity: product.stock_quantity.toString(),
      image: product.image || '',
      is_active: product.is_active
    });
    setImageUploadType('url');
    setSelectedFile(null);
    setPreviewUrl(product.image || '');
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        
        // Immediately remove from local state
        setProducts(prevProducts => {
          const updatedProducts = prevProducts.filter(product => product.id !== id);
          // Update localStorage
          localStorage.setItem('products', JSON.stringify(updatedProducts));
          return updatedProducts;
        });
        
      } catch (err: any) {
        setError('Failed to delete product');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category_id: '',
      selling_price: '',
      cost_price: '',
      low_stock_alert: '',
      stock_quantity: '',
      image: '',
      is_active: true
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setImageUploadType('url');
  };

  // Generate SKU
  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SKU-${timestamp}${random}`;
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingProduct(null);
    resetForm();
    // Auto-generate SKU for new products
    setFormData(prev => ({
      ...prev,
      sku: generateSKU()
    }));
    setShowModal(true);
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your inventory products</p>
        </div>
        {(role === 'admin' || role === 'cashier') && (
          <button
            onClick={handleAddNew}
            className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center"
          >
            <span className="mr-2">➕</span>
            Add Product
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 border-l-4 border-blue-800">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {(role === 'admin' || role === 'cashier') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`bg-white border-b hover:bg-gray-50 ${
                  product.stock_quantity <= product.low_stock_alert ? 'animate-pulse' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-16 h-16 flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI4QzI5LjEwNDYgMjggMzAgMjcuMTA0NiAzMCAyNkMzMCAyNC44OTU0IDI5LjEwNDYgMjQgMjggMjRDMjYuODk1NCAyNCAyNiAyNC44OTU0IDI2IDI2QzI2IDI3LjEwNDYgMjYuODk1NCAyOCAyOCAyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIyIDM4TDI2IDM0TDMwIDM4TDM2IDMyLDQyIDM4VjQwSDIyVjM4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category?.name || 'No Category'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{product.selling_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        product.stock_quantity <= product.low_stock_alert 
                          ? 'text-red-600 animate-pulse' 
                          : 'text-gray-900'
                      }`}>
                        {product.stock_quantity}
                      </span>
                      {product.stock_quantity <= product.low_stock_alert && (
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
                          onClick={() => handleEdit(product)}
                          className="text-blue-800 hover:text-blue-900 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No products found</div>
            <div className="text-gray-400 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first product to get started'}
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {!editingProduct && (
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, sku: generateSKU()})}
                          className="mt-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          title="Generate new SKU"
                        >
                          🔄
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.selling_price}
                      onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cost (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.cost_price}
                      onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Product Image</label>
                  
                  {/* Image Upload Type Toggle */}
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="imageUploadType"
                        value="url"
                        checked={imageUploadType === 'url'}
                        onChange={() => {
                          setImageUploadType('url');
                          setSelectedFile(null);
                          setPreviewUrl('');
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Image URL</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="imageUploadType"
                        value="file"
                        checked={imageUploadType === 'file'}
                        onChange={() => {
                          setImageUploadType('file');
                          setFormData({...formData, image: ''});
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Upload from Device</span>
                    </label>
                  </div>

                  {/* URL Input */}
                  {imageUploadType === 'url' && (
                    <div>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={(e) => {
                          setFormData({...formData, image: e.target.value});
                          setPreviewUrl(e.target.value);
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">Enter a URL for the product image</p>
                    </div>
                  )}

                  {/* File Upload */}
                  {imageUploadType === 'file' && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              setPreviewUrl(result);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setSelectedFile(null);
                            setPreviewUrl('');
                          }
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-sm text-gray-500">Select an image file from your device</p>
                    </div>
                  )}

                  {/* Image Preview */}
                  {(previewUrl || (imageUploadType === 'url' && formData.image)) && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                      <img
                        src={previewUrl || formData.image}
                        alt="Product preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'block';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                    <input
                      type="number"
                      required
                      value={formData.low_stock_alert}
                      onChange={(e) => setFormData({...formData, low_stock_alert: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-800 border border-transparent rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800"
                  >
                    {editingProduct ? 'Update' : 'Create'}
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

export default Products;
