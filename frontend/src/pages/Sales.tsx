import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { productsAPI, ordersAPI, customersAPI } from '../services/api';
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
  total_orders?: number;
  total_spent?: number;
  is_active?: boolean;
  // Educational Information
  education_level?: string;
  year?: string;
  grade_level?: string;
  section?: string;
  strand?: string;
  college?: string;
  course?: string;
}

// Educational Data Constants
const EDUCATION_LEVELS = [
  'Kinder',
  'Elementary',
  'High School',
  'Senior High School',
  'College'
];

const ELEMENTARY_GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
const HIGH_SCHOOL_GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
const SENIOR_HIGH_GRADES = ['Grade 11', 'Grade 12'];
const HIGH_SCHOOL_SECTIONS = ['1', '2', '3', '4', '5'];
const SENIOR_HIGH_STRANDS = ['STEM', 'TVL', 'ABM', 'HUMMS'];
const COLLEGE_SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const COLLEGE_PROGRAMS = {
  'College of Arts and Sciences': [
    'Bachelor of Arts (BA) major in Theology',
    'Bachelor of Arts major in Political Science',
    'Bachelor of Science in Biology (BS Bio)',
    'Bachelor of Science in Psychology (BS Psych)',
    'Bachelor of Science in Social Work (BSSW)'
  ],
  'College of Business and Accountancy': [
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Business Administration (BSBA) - Human Resource Management',
    'Bachelor of Science in Business Administration (BSBA) - Financial Management',
    'Bachelor of Science in Business Administration (BSBA) - Marketing Management',
    'Bachelor of Science in Business Administration (BSBA) - Operations Management',
    'Bachelor of Science in Entrepreneurship'
  ],
  'College of Computer Studies': [
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Information Technology'
  ],
  'College of Criminal Justice Education': [
    'Bachelor of Science in Criminology (BSCrim)'
  ],
  'College of Engineering': [
    'Bachelor of Science in Electronics Engineering'
  ],
  'College of Hotel and Tourism Management': [
    'Bachelor of Science in Hospitality Management (BSHM) - Cruise Ship Operations',
    'Bachelor of Science in Hospitality Management (BSHM) - Hotel & Restaurant Management',
    'Bachelor of Science in Tourism Management (BSTM)'
  ],
  'College of Nursing': [
    'Bachelor of Science in Nursing (BSN)'
  ],
  'College of Teacher Education': [
    'Bachelor of Elementary Education (BEEd)',
    'Bachelor of Secondary Education (BSEd) - English',
    'Bachelor of Secondary Education (BSEd) - Mathematics',
    'Bachelor of Secondary Education (BSEd) - Filipino',
    'Bachelor of Secondary Education (BSEd) - Science',
    'Bachelor of Secondary Education (BSEd) - Social Studies',
    'Bachelor of Culture and Arts Education (BCAEd)',
    'Bachelor of Early Childhood Education (BECEd)',
    'Bachelor of Physical Education (BPEd)',
    'Bachelor of Special Needs Education (BSNEd)'
  ]
};

// Helper functions for educational form logic
const getAvailableGrades = (educationLevel: string) => {
  switch (educationLevel) {
    case 'Elementary':
      return ELEMENTARY_GRADES;
    case 'High School':
      return HIGH_SCHOOL_GRADES;
    case 'Senior High School':
      return SENIOR_HIGH_GRADES;
    default:
      return [];
  }
};

const getAvailableSections = (educationLevel: string) => {
  switch (educationLevel) {
    case 'High School':
      return HIGH_SCHOOL_SECTIONS;
    case 'College':
      return COLLEGE_SECTIONS;
    default:
      return [];
  }
};

const getAvailableColleges = () => {
  return Object.keys(COLLEGE_PROGRAMS);
};

const getAvailableCourses = (college: string) => {
  return COLLEGE_PROGRAMS[college as keyof typeof COLLEGE_PROGRAMS] || [];
};

const Sales: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const auth = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const location = useLocation();

  // Helper function to create educational summary
  const createEducationalSummary = (customerData: Customer) => {
    if (!customerData.education_level) return '';
    
    switch (customerData.education_level) {
      case 'Kinder': {
        return 'Kinder';
      }
      
      case 'Elementary': {
        return customerData.grade_level ? customerData.grade_level : 'Elementary';
      }
      
      case 'High School': {
        return customerData.grade_level ? customerData.grade_level : 'High School';
      }
      
      case 'Senior High School': {
        const grade = customerData.grade_level ? customerData.grade_level.replace('Grade ', '') : '';
        const strand = customerData.strand || '';
        return strand && grade ? `${strand}-${grade}` : 'Senior High School';
      }
      
      case 'College': {
        const course = customerData.course || '';
        const year = customerData.year || '';
        
        // Create course abbreviation
        let courseAbbrev = '';
        if (course.includes('Bachelor of Science in Computer Science')) courseAbbrev = 'BSCS';
        else if (course.includes('Bachelor of Science in Information Technology')) courseAbbrev = 'BSIT';
        else if (course.includes('Bachelor of Science in Accountancy')) courseAbbrev = 'BSA';
        else if (course.includes('Bachelor of Science in Business Administration')) {
          if (course.includes('Human Resource Management')) courseAbbrev = 'BSBA-HRM';
          else if (course.includes('Financial Management')) courseAbbrev = 'BSBA-FM';
          else if (course.includes('Marketing Management')) courseAbbrev = 'BSBA-MM';
          else if (course.includes('Operations Management')) courseAbbrev = 'BSBA-OM';
          else courseAbbrev = 'BSBA';
        }
        else if (course.includes('Bachelor of Science in Entrepreneurship')) courseAbbrev = 'BSE';
        else if (course.includes('Bachelor of Science in Criminology')) courseAbbrev = 'BSCrim';
        else if (course.includes('Bachelor of Science in Electronics Engineering')) courseAbbrev = 'BSEE';
        else if (course.includes('Bachelor of Science in Hospitality Management')) courseAbbrev = 'BSHM';
        else if (course.includes('Bachelor of Science in Tourism Management')) courseAbbrev = 'BSTM';
        else if (course.includes('Bachelor of Science in Nursing')) courseAbbrev = 'BSN';
        else if (course.includes('Bachelor of Elementary Education')) courseAbbrev = 'BEEd';
        else if (course.includes('Bachelor of Secondary Education')) {
          if (course.includes('English')) courseAbbrev = 'BSEd-Eng';
          else if (course.includes('Mathematics')) courseAbbrev = 'BSEd-Math';
          else if (course.includes('Filipino')) courseAbbrev = 'BSEd-Fil';
          else if (course.includes('Science')) courseAbbrev = 'BSEd-Sci';
          else if (course.includes('Social Studies')) courseAbbrev = 'BSEd-SS';
          else courseAbbrev = 'BSEd';
        }
        else if (course.includes('Bachelor of Culture and Arts Education')) courseAbbrev = 'BCAEd';
        else if (course.includes('Bachelor of Early Childhood Education')) courseAbbrev = 'BECEd';
        else if (course.includes('Bachelor of Physical Education')) courseAbbrev = 'BPEd';
        else if (course.includes('Bachelor of Special Needs Education')) courseAbbrev = 'BSNEd';
        else if (course.includes('Bachelor of Arts') && course.includes('Theology')) courseAbbrev = 'BA-Theo';
        else if (course.includes('Bachelor of Arts') && course.includes('Political Science')) courseAbbrev = 'BA-PolSci';
        else if (course.includes('Bachelor of Science in Biology')) courseAbbrev = 'BS-Bio';
        else if (course.includes('Bachelor of Science in Psychology')) courseAbbrev = 'BS-Psych';
        else if (course.includes('Bachelor of Science in Social Work')) courseAbbrev = 'BSSW';
        else courseAbbrev = 'College';
        
        // Extract year number
        let yearNum = '';
        if (year.includes('1st')) yearNum = '1';
        else if (year.includes('2nd')) yearNum = '2';
        else if (year.includes('3rd')) yearNum = '3';
        else if (year.includes('4th')) yearNum = '4';
        else if (year.includes('5th')) yearNum = '5';
        
        return courseAbbrev && yearNum ? `${courseAbbrev}-${yearNum}` : courseAbbrev || 'College';
      }
      
      default:
        return '';
    }
  };
  
  // Get product from navigation state (when redirected from Products page)
  const productFromNavigation = location.state?.product;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customer information
  const [customer, setCustomer] = useState<Customer>({
    name: ''
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
    is_active: true,
    // Educational Information
    education_level: '',
    year: '',
    grade_level: '',
    section: '',
    strand: '',
    college: '',
    course: ''
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
        } catch {
          console.log('Sales: API failed (expected in demo mode), using empty product list');
          setProducts([]);
          // Don't show error for API failures in demo mode
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Add product to sale
  const addToSale = useCallback((product: Product) => {
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
  }, [saleItems]);

  useEffect(() => {
    fetchProducts();
    
    // If redirected from Products page with a product, add it to sale
    if (productFromNavigation) {
      addToSale(productFromNavigation);
      // Clear the navigation state to prevent re-adding on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [productFromNavigation, addToSale, location.pathname, navigate]);

  // Handle education level change and reset dependent fields
  const handleEducationLevelChange = (educationLevel: string) => {
    setNewCustomerForm(prev => ({
      ...prev,
      education_level: educationLevel,
      year: '',
      grade_level: '',
      section: '',
      strand: '',
      college: '',
      course: ''
    }));
  };

  // Handle college change and reset course
  const handleCollegeChange = (college: string) => {
    setNewCustomerForm(prev => ({
      ...prev,
      college: college,
      course: ''
    }));
  };

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
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]') as Customer[];
      
      // Create new customer with unique ID
      const newCustomer = {
        ...customerData,
        id: Math.max(...existingCustomers.map((c: Customer) => c.id || 0), 0) + 1
      };
      
      // Add to customers list
      const updatedCustomers = [...existingCustomers, newCustomer];
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      
      
      // Set as selected customer for this sale
      setCustomer({
        id: newCustomer.id,
        name: newCustomer.name
      });
      
      // Reset form and close modal
      setNewCustomerForm({
        name: '',
        is_active: true,
        // Educational Information
        education_level: '',
        year: '',
        grade_level: '',
        section: '',
        strand: '',
        college: '',
        course: ''
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
    setCustomer({ name: '' });
    setDiscountAmount(0);
    setPaidAmount(0);
  };

  // Process sale
  const processSale = async () => {
    if (saleItems.length === 0) return;
    
    try {
      let backendCustomerId = null;
      let backendOrderId = null;
      const educationalSummary = customer.name ? createEducationalSummary(customer) : '';

      // Try to create/update customer in backend first
      if (customer.name) {
        try {
          if (customer.id) {
            // Update existing customer
            await customersAPI.update(customer.id, {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              education_level: customer.education_level,
              year: customer.year,
              grade_level: customer.grade_level,
              section: customer.section,
              strand: customer.strand,
              college: customer.college,
              course: customer.course
            });
            backendCustomerId = customer.id;
          } else {
            // Create new customer
            const customerResponse = await customersAPI.create({
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              education_level: customer.education_level,
              year: customer.year,
              grade_level: customer.grade_level,
              section: customer.section,
              strand: customer.strand,
              college: customer.college,
              course: customer.course
            });
            backendCustomerId = customerResponse.data.id;
          }
        } catch (customerError) {
          console.log('Customer API failed, using localStorage fallback:', customerError);
        }
      }

      // Try to create order in backend
      try {
        const orderData = {
          customer_id: backendCustomerId,
          items: saleItems.map(item => ({
            product_id: item.id,
            qty: item.quantity,
            price: item.price
          })),
          paid_amount: paidAmount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          notes: customer.name ? `Customer: ${customer.name}` : 'Walk-in customer',
          order_status: 'completed' as const
        };

        const orderResponse = await ordersAPI.create(orderData);
        backendOrderId = orderResponse.data.id;
        console.log('Order created in backend successfully:', backendOrderId);
      } catch (orderError) {
        console.log('Order API failed, using localStorage fallback:', orderError);
      }

      // Update product stock quantities (localStorage fallback)
      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedProducts = existingProducts.map((product: Product) => {
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

      // Update customer data in localStorage (fallback/sync)
      if (customer.id || customer.name) {
        const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]') as Customer[];
        const customerIndex = existingCustomers.findIndex(c => c.id === customer.id || c.name === customer.name);
        
        if (customerIndex >= 0) {
          // Update existing customer
          existingCustomers[customerIndex] = {
            ...existingCustomers[customerIndex],
            ...customer,
            total_orders: (existingCustomers[customerIndex].total_orders || 0) + 1,
            total_spent: (existingCustomers[customerIndex].total_spent || 0) + total,
            last_order_date: new Date().toISOString().split('T')[0]
          };
        } else if (customer.name) {
          // Add new customer
          const newCustomer = {
            ...customer,
            id: backendCustomerId || Date.now(),
            total_orders: 1,
            total_spent: total,
            last_order_date: new Date().toISOString().split('T')[0],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          existingCustomers.push(newCustomer);
        }
        localStorage.setItem('customers', JSON.stringify(existingCustomers));
      }

      // Save order to localStorage (fallback/sync)
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const newOrder = {
        id: backendOrderId || Date.now(),
        order_number: `ORD-${backendOrderId || Date.now()}`,
        customer_id: backendCustomerId || customer.id || null,
        customer: customer.name ? { 
          id: backendCustomerId || customer.id,
          name: customer.name,
          educational_summary: educationalSummary
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
        notes: customer.name ? `Customer: ${customer.name}` : 'Walk-in customer',
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
      const message = backendOrderId 
        ? 'Sale processed successfully and saved to database!' 
        : 'Sale processed successfully (saved locally)!';
      alert(message);
      
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
          } p-6 rounded-lg w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto border shadow-lg`}>
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


              {/* Educational Information Section */}
              <div className={`border-t pt-4 mt-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                <h4 className={`text-md font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  Educational Information
                </h4>

                {/* Education Level */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Education Level</label>
                  <select
                    value={newCustomerForm.education_level}
                    onChange={(e) => handleEducationLevelChange(e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Education Level</option>
                    {EDUCATION_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Year (for College only) */}
                {newCustomerForm.education_level === 'College' && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Year</label>
                    <input
                      type="text"
                      value={newCustomerForm.year}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, year: e.target.value})}
                      placeholder="e.g 1st year"
                      className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                )}

                {/* Grade Level for Elementary, High School, and Senior High School */}
                {(newCustomerForm.education_level === 'Elementary' || newCustomerForm.education_level === 'High School' || newCustomerForm.education_level === 'Senior High School') && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Grade Level</label>
                    <select
                      value={newCustomerForm.grade_level}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, grade_level: e.target.value})}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Grade Level</option>
                      {getAvailableGrades(newCustomerForm.education_level).map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Section for High School and College */}
                {(newCustomerForm.education_level === 'High School' || newCustomerForm.education_level === 'College') && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Section</label>
                    <select
                      value={newCustomerForm.section}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, section: e.target.value})}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Section</option>
                      {getAvailableSections(newCustomerForm.education_level).map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Strand for Senior High School */}
                {newCustomerForm.education_level === 'Senior High School' && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Strand</label>
                    <select
                      value={newCustomerForm.strand}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, strand: e.target.value})}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Strand</option>
                      {SENIOR_HIGH_STRANDS.map(strand => (
                        <option key={strand} value={strand}>{strand}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* College and Course for College level */}
                {newCustomerForm.education_level === 'College' && (
                  <>
                    <div className="mb-4">
                      <label className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>College</label>
                      <select
                        value={newCustomerForm.college}
                        onChange={(e) => handleCollegeChange(e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select College</option>
                        {getAvailableColleges().map(college => (
                          <option key={college} value={college}>{college}</option>
                        ))}
                      </select>
                    </div>

                    {newCustomerForm.college && (
                      <div className="mb-4">
                        <label className={`block text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>Course</label>
                        <select
                          value={newCustomerForm.course}
                          onChange={(e) => setNewCustomerForm({...newCustomerForm, course: e.target.value})}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select Course</option>
                          {getAvailableCourses(newCustomerForm.college).map(course => (
                            <option key={course} value={course}>{course}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
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
