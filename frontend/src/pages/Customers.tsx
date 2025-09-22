import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postal_code?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Customers: React.FC = () => {
  const { role } = useAuth();
  const { theme } = useTheme();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    is_active: true
  });

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try localStorage first for demo mode
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      } else {
        // Demo customers for initial load
        const demoCustomers: Customer[] = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+63 912 345 6789',
            address: '123 Main St',
            city: 'Manila',
            postal_code: '1000',
            total_orders: 5,
            total_spent: 15000,
            last_order_date: '2024-01-15',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@email.com',
            phone: '+63 917 123 4567',
            address: '456 Oak Ave',
            city: 'Quezon City',
            postal_code: '1100',
            total_orders: 3,
            total_spent: 8500,
            last_order_date: '2024-01-10',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setCustomers(demoCustomers);
        localStorage.setItem('customers', JSON.stringify(demoCustomers));
      }
    } catch {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);


  // Handle edit
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      is_active: customer.is_active
    });
    setShowEditModal(true);
  };

  // Handle edit save
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const updatedCustomer = {
        ...selectedCustomer,
        ...editForm,
        updated_at: new Date().toISOString()
      };

      const updatedCustomers = customers.map(customer =>
        customer.id === selectedCustomer.id ? updatedCustomer : customer
      );

      setCustomers(updatedCustomers);
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      setShowEditModal(false);
      setSelectedCustomer(null);
      
      // Show success message
      alert('Customer updated successfully!');
    } catch {
      setError('Failed to update customer');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const updatedCustomers = customers.filter(customer => customer.id !== id);
        setCustomers(updatedCustomers);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      } catch {
        setError('Failed to delete customer');
      }
    }
  };


  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
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
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Customer Management</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage your customer database and relationships</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} font-medium`}>
              <span className="mr-2">📊</span>
              {filteredCustomers.length} Customers
            </div>
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
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Search Customers</h2>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {filteredCustomers.length} found
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
                placeholder="Search customers by name, email, or phone..."
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

        {/* Modern Customers Table */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>👤</span>
                      <span>Customer</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>📞</span>
                      <span>Contact</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>📍</span>
                      <span>Location</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>📋</span>
                      <span>Orders</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>💰</span>
                      <span>Total Spent</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>🟢</span>
                      <span>Status</span>
                    </div>
                  </th>
                  {(role === 'admin' || role === 'cashier') && (
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span>⚙️</span>
                        <span>Actions</span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
            <tbody className={`divide-y ${
              theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
            }`}>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={`${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-50'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {customer.name}
                        </div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          ID: {customer.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {customer.email}
                    </div>
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {customer.city || 'N/A'}
                    </div>
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {customer.postal_code || ''}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {customer.total_orders}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    ₱{customer.total_spent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {(role === 'admin' || role === 'cashier') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowDetailsModal(true);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className={`text-4xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>👥</div>
            <div className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No customers found</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchTerm ? 'Try adjusting your search terms' : 'Customers will appear here when added through the Sales page'}
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  Customer Details - {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Email:</span> {selectedCustomer.email}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Phone:</span> {selectedCustomer.phone}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Address:</span> {selectedCustomer.address || 'N/A'}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">City:</span> {selectedCustomer.city || 'N/A'}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Postal Code:</span> {selectedCustomer.postal_code || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Order Stats */}
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    Order Statistics
                  </h4>
                  <div className="space-y-2">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Total Orders:</span> {selectedCustomer.total_orders}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Total Spent:</span> ₱{selectedCustomer.total_spent.toLocaleString()}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Last Order:</span> {selectedCustomer.last_order_date || 'Never'}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                        selectedCustomer.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  Edit Customer - {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleEditSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Address
                    </label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      City
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={editForm.postal_code}
                      onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Active Customer
                    </span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      theme === 'dark' 
                        ? 'text-gray-300 bg-gray-600 hover:bg-gray-500' 
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save Changes
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

export default Customers;
