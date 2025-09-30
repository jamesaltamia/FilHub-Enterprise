import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { productsAPI, ordersAPI, customersAPI } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { StudentsContext } from "../contexts/StudentsContext";
import { useContext } from "react";

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
  // Uniform-specific fields
  uniform_size?: string;
  uniform_gender?: string;
}

interface SaleItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  total: number;
  image?: string;
  // Uniform-specific fields
  uniform_size?: string;
  uniform_gender?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface Customer {
  id?: number;
  name: string;
  total_orders?: number;
  total_spent?: number;
  is_active?: boolean;
  last_order_date?: string | Date;
  // Educational Information
  education_level?: string;
  year?: string;
  grade_level?: string;
  section?: string;
  strand?: string;
  college?: string;
  course?: string;
  // Additional fields
  address?: string;
  barcode?: string;
  // Teacher-specific fields
  is_teacher?: boolean;
  department?: string;
  employee_id?: string;
}

// Educational Data Constants
const EDUCATION_LEVELS = [
  "Kinder",
  "Elementary",
  "High School",
  "Senior High School",
  "College",
];

const ELEMENTARY_GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];
const HIGH_SCHOOL_GRADES = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
const SENIOR_HIGH_GRADES = ["Grade 11", "Grade 12"];
const HIGH_SCHOOL_SECTIONS = ["1", "2", "3", "4", "5"];
const SENIOR_HIGH_STRANDS = ["STEM", "TVL", "ABM", "HUMMS"];
const COLLEGE_SECTIONS = ["A", "B", "C", "D", "E"];

const COLLEGE_PROGRAMS = {
  "College of Arts and Sciences": [
    "Bachelor of Arts (BA) major in Theology",
    "Bachelor of Arts major in Political Science",
    "Bachelor of Science in Biology (BS Bio)",
    "Bachelor of Science in Psychology (BS Psych)",
    "Bachelor of Science in Social Work (BSSW)",
  ],
  "College of Business and Accountancy": [
    "Bachelor of Science in Accountancy",
    "Bachelor of Science in Business Administration (BSBA) - Human Resource Management",
    "Bachelor of Science in Business Administration (BSBA) - Financial Management",
    "Bachelor of Science in Business Administration (BSBA) - Marketing Management",
    "Bachelor of Science in Business Administration (BSBA) - Operations Management",
    "Bachelor of Science in Entrepreneurship",
  ],
  "College of Computer Studies": [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
  ],
  "College of Criminal Justice Education": [
    "Bachelor of Science in Criminology (BSCrim)",
  ],
  "College of Engineering": ["Bachelor of Science in Electronics Engineering"],
  "College of Hotel and Tourism Management": [
    "Bachelor of Science in Hospitality Management (BSHM) - Cruise Ship Operations",
    "Bachelor of Science in Hospitality Management (BSHM) - Hotel & Restaurant Management",
    "Bachelor of Science in Tourism Management (BSTM)",
  ],
  "College of Nursing": ["Bachelor of Science in Nursing (BSN)"],
  "College of Teacher Education": [
    "Bachelor of Elementary Education (BEEd)",
    "Bachelor of Secondary Education (BSEd) - English",
    "Bachelor of Secondary Education (BSEd) - Mathematics",
    "Bachelor of Secondary Education (BSEd) - Filipino",
    "Bachelor of Secondary Education (BSEd) - Science",
    "Bachelor of Secondary Education (BSEd) - Social Studies",
    "Bachelor of Culture and Arts Education (BCAEd)",
    "Bachelor of Early Childhood Education (BECEd)",
    "Bachelor of Physical Education (BPEd)",
    "Bachelor of Special Needs Education (BSNEd)",
  ],
};

// Helper functions for educational form logic
const getAvailableGrades = (educationLevel: string) => {
  switch (educationLevel) {
    case "Elementary":
      return ELEMENTARY_GRADES;
    case "High School":
      return HIGH_SCHOOL_GRADES;
    case "Senior High School":
      return SENIOR_HIGH_GRADES;
    default:
      return [];
  }
};

const getAvailableSections = (educationLevel: string) => {
  switch (educationLevel) {
    case "High School":
      return HIGH_SCHOOL_SECTIONS;
    case "College":
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
    if (!customerData.education_level) return "";

    switch (customerData.education_level) {
      case "Kinder": {
        return "Kinder";
      }

      case "Elementary": {
        return customerData.grade_level
          ? customerData.grade_level
          : "Elementary";
      }

      case "High School": {
        return customerData.grade_level
          ? customerData.grade_level
          : "High School";
      }

      case "Senior High School": {
        const grade = customerData.grade_level
          ? customerData.grade_level.replace("Grade ", "")
          : "";
        const strand = customerData.strand || "";
        return strand && grade ? `${strand}-${grade}` : "Senior High School";
      }

      case "College": {
        const course = customerData.course || "";
        const year = customerData.year || "";

        // Create course abbreviation
        let courseAbbrev = "";
        if (course.includes("Bachelor of Science in Computer Science"))
          courseAbbrev = "BSCS";
        else if (
          course.includes("Bachelor of Science in Information Technology")
        )
          courseAbbrev = "BSIT";
        else if (course.includes("Bachelor of Science in Accountancy"))
          courseAbbrev = "BSA";
        else if (
          course.includes("Bachelor of Science in Business Administration")
        ) {
          if (course.includes("Human Resource Management"))
            courseAbbrev = "BSBA-HRM";
          else if (course.includes("Financial Management"))
            courseAbbrev = "BSBA-FM";
          else if (course.includes("Marketing Management"))
            courseAbbrev = "BSBA-MM";
          else if (course.includes("Operations Management"))
            courseAbbrev = "BSBA-OM";
          else courseAbbrev = "BSBA";
        } else if (course.includes("Bachelor of Science in Entrepreneurship"))
          courseAbbrev = "BSE";
        else if (course.includes("Bachelor of Science in Criminology"))
          courseAbbrev = "BSCrim";
        else if (
          course.includes("Bachelor of Science in Electronics Engineering")
        )
          courseAbbrev = "BSEE";
        else if (
          course.includes("Bachelor of Science in Hospitality Management")
        )
          courseAbbrev = "BSHM";
        else if (course.includes("Bachelor of Science in Tourism Management"))
          courseAbbrev = "BSTM";
        else if (course.includes("Bachelor of Science in Nursing"))
          courseAbbrev = "BSN";
        else if (course.includes("Bachelor of Elementary Education"))
          courseAbbrev = "BEEd";
        else if (course.includes("Bachelor of Secondary Education")) {
          if (course.includes("English")) courseAbbrev = "BSEd-Eng";
          else if (course.includes("Mathematics")) courseAbbrev = "BSEd-Math";
          else if (course.includes("Filipino")) courseAbbrev = "BSEd-Fil";
          else if (course.includes("Science")) courseAbbrev = "BSEd-Sci";
          else if (course.includes("Social Studies")) courseAbbrev = "BSEd-SS";
          else courseAbbrev = "BSEd";
        } else if (course.includes("Bachelor of Culture and Arts Education"))
          courseAbbrev = "BCAEd";
        else if (course.includes("Bachelor of Early Childhood Education"))
          courseAbbrev = "BECEd";
        else if (course.includes("Bachelor of Physical Education"))
          courseAbbrev = "BPEd";
        else if (course.includes("Bachelor of Special Needs Education"))
          courseAbbrev = "BSNEd";
        else if (
          course.includes("Bachelor of Arts") &&
          course.includes("Theology")
        )
          courseAbbrev = "BA-Theo";
        else if (
          course.includes("Bachelor of Arts") &&
          course.includes("Political Science")
        )
          courseAbbrev = "BA-PolSci";
        else if (course.includes("Bachelor of Science in Biology"))
          courseAbbrev = "BS-Bio";
        else if (course.includes("Bachelor of Science in Psychology"))
          courseAbbrev = "BS-Psych";
        else if (course.includes("Bachelor of Science in Social Work"))
          courseAbbrev = "BSSW";
        else courseAbbrev = "College";

        // Extract year number
        let yearNum = "";
        if (year.includes("1st")) yearNum = "1";
        else if (year.includes("2nd")) yearNum = "2";
        else if (year.includes("3rd")) yearNum = "3";
        else if (year.includes("4th")) yearNum = "4";
        else if (year.includes("5th")) yearNum = "5";

        return courseAbbrev && yearNum
          ? `${courseAbbrev}-${yearNum}`
          : courseAbbrev || "College";
      }

      default:
        return "";
    }
  };

  // Get product from navigation state (when redirected from Products page)
  const productFromNavigation = location.state?.product;

  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Get students from context
  const studentsContext = useContext(StudentsContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Search for students
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = studentsContext?.students.filter(
      (student) =>
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${student.first_name} ${student.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setSearchResults(results || []);
  }, [searchTerm, studentsContext?.students]);

  // Handle customer selection from search
  const handleSelectCustomer = (student: any) => {
    setCustomer({
      id: parseInt(student.student_id),
      name: `${student.first_name} ${student.last_name}`,
      education_level: student.year_level.includes("Grade")
        ? student.year_level.includes("11") || student.year_level.includes("12")
          ? "Senior High School"
          : "High School"
        : "College",
      year: student.year_level,
      course: student.course,
      address: student.address,
      barcode: student.barcode,
    });
    setShowAddCustomerModal(false);
    setCustomerSearchTerm("");
  };

  // Customer information
  const [customer, setCustomer] = useState<Customer>({
    name: "",
  });
  
  // Teacher purchase mode
  const [isTeacherPurchase, setIsTeacherPurchase] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({
    name: "",
    department: "",
    employee_id: ""
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
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash">("cash");

  // New customer form data
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    is_active: true,
    // Educational Information
    education_level: "",
    year: "",
    grade_level: "",
    section: "",
    strand: "",
    college: "",
    course: "",
  });

  // Optimized fetch products for sale - prioritize speed
  const fetchProducts = async () => {
    try {
      // Immediate localStorage load - no loading state for instant response
      const storedProducts = JSON.parse(
        localStorage.getItem("products") || "[]"
      );
      
      if (storedProducts.length > 0) {
        // Only show active products with stock - optimized filter
        const activeProducts = storedProducts.filter(
          (product: Product) => product.is_active && product.stock_quantity > 0
        );
        setProducts(activeProducts);
        console.log("Sales: Instant load from localStorage");
        return; // Exit early for maximum speed
      }

      // Only set loading if no localStorage data
      setLoading(true);
      setError(null);

      // Quick API fallback with aggressive timeout
      try {
        console.log("Sales: Quick API fallback");
        const response = await Promise.race([
          productsAPI.getAll({ per_page: 100 }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), 1000)
          )
        ]);
        
        if (response && response.data) {
          const productsData = Array.isArray(response.data.data)
            ? response.data.data
            : Array.isArray(response.data)
            ? response.data
            : [];
          const activeProducts = productsData.filter(
            (product: Product) =>
              product.is_active && product.stock_quantity > 0
          );
          setProducts(activeProducts);
          console.log("Sales: Loaded products from API");
        } else {
          setProducts([]);
        }
      } catch {
        console.log(
          "Sales: API failed (expected in demo mode), using empty product list"
        );
        setProducts([]);
        // Don't show error for API failures in demo mode
      }
    } catch (err: unknown) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Add product to sale
  const addToSale = useCallback(
    (product: Product) => {
      const existingItem = saleItems.find((item) => item.id === product.id);
      const price = product.selling_price || product.price;

      if (existingItem) {
        setSaleItems((prev) =>
          prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
              : item
          )
        );
      } else {
        setSaleItems((prev) => [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: price,
            quantity: 1,
            stock: product.stock_quantity,
            total: price,
            image: product.image,
            uniform_size: product.uniform_size,
            uniform_gender: product.uniform_gender,
            category: product.category,
          },
        ]);
      }
    },
    [saleItems]
  );

  // Single useEffect for initialization and navigation handling
  useEffect(() => {
    // Fetch products only once on mount
    fetchProducts();
    // If redirected from Products page with a product, add it to sale
    if (productFromNavigation) {
      addToSale(productFromNavigation);
      // Clear the navigation state to prevent re-adding on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []); // Empty dependency array - only run once on mount

  // Handle education level change and reset dependent fields
  const handleEducationLevelChange = (educationLevel: string) => {
    setNewCustomerForm((prev) => ({
      ...prev,
      education_level: educationLevel,
      year: "",
      grade_level: "",
      section: "",
      strand: "",
      college: "",
      course: "",
    }));
  };

  // Handle college change and reset course
  const handleCollegeChange = (college: string) => {
    setNewCustomerForm((prev) => ({
      ...prev,
      college: college,
      course: "",
    }));
  };

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
    setSaleItems((prev) => prev.filter((item) => item.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromSale(productId);
      return;
    }

    setSaleItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.min(quantity, item.stock),
              total: Math.min(quantity, item.stock) * item.price,
            }
          : item
      )
    );
  };

  // Clear sale
  const clearSale = () => {
    setSaleItems([]);
    setCustomer({ name: "" });
    setDiscountAmount(0);
    setPaidAmount(0);
  };

  // Process sale
  const processSale = async () => {
    if (saleItems.length === 0) return;

    try {
      let backendCustomerId = null;
      let backendOrderId = null;
      const educationalSummary = customer.name
        ? createEducationalSummary(customer)
        : "";

      // Handle teacher purchases or regular customer purchases
      const customerName = isTeacherPurchase ? teacherInfo.name : customer.name;
      
      // Try API calls with timeout, but don't block the sale process
      if (customerName) {
        // Non-blocking API calls with timeout
        const apiTimeout = 2000; // 2 second timeout
        
        const tryCustomerAPI = async () => {
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API timeout')), apiTimeout)
            );
            
            if (isTeacherPurchase) {
              const teacherCustomerData = {
                name: teacherInfo.name,
                department: teacherInfo.department,
                is_teacher: true,
                employee_id: teacherInfo.employee_id,
                education_level: "Teacher",
              };
              
              const customerResponse = await Promise.race([
                customersAPI.create(teacherCustomerData),
                timeoutPromise
              ]);
              backendCustomerId = customerResponse.data.id;
              console.log("Teacher created in backend:", backendCustomerId);
            } else {
              if (customer.id) {
                await Promise.race([
                  customersAPI.update(customer.id, {
                    name: customer.name,
                    education_level: customer.education_level,
                    year: customer.year,
                    grade_level: customer.grade_level,
                    section: customer.section,
                    strand: customer.strand,
                    college: customer.college,
                    course: customer.course,
                  }),
                  timeoutPromise
                ]);
                backendCustomerId = customer.id;
              } else {
                const customerResponse = await Promise.race([
                  customersAPI.create({
                    name: customer.name,
                    education_level: customer.education_level,
                    year: customer.year,
                    grade_level: customer.grade_level,
                    section: customer.section,
                    strand: customer.strand,
                    college: customer.college,
                    course: customer.course,
                  }),
                  timeoutPromise
                ]);
                backendCustomerId = customerResponse.data.id;
              }
            }
          } catch (customerError) {
            console.log("Customer API failed (using localStorage):", customerError.message || 'timeout');
          }
        };
        
        // Start API call but don't wait for it
        tryCustomerAPI();
      }

      // Try to create order in backend (non-blocking with timeout)
      const tryOrderAPI = async () => {
        try {
          const orderData = {
            customer_id: backendCustomerId,
            items: saleItems.map((item) => ({
              product_id: item.id,
              qty: item.quantity,
              price: item.price,
            })),
            paid_amount: paidAmount,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            notes: customerName
              ? isTeacherPurchase 
                ? `Teacher: ${teacherInfo.name} (${teacherInfo.department})`
                : `Customer: ${customerName}`
              : "Walk-in customer",
            order_status: "completed" as const,
          };

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Order API timeout')), 2000)
          );

          const orderResponse = await Promise.race([
            ordersAPI.create(orderData),
            timeoutPromise
          ]);
          backendOrderId = orderResponse.data.id;
          console.log("Order created in backend:", backendOrderId);
        } catch (orderError) {
          console.log("Order API failed (using localStorage):", orderError.message || 'timeout');
        }
      };
      
      // Start order API call but don't wait for it
      tryOrderAPI();

      // Update product stock quantities (localStorage fallback)
      const existingProducts = JSON.parse(
        localStorage.getItem("products") || "[]"
      );
      const updatedProducts = existingProducts.map((product: Product) => {
        const saleItem = saleItems.find((item) => item.id === product.id);
        if (saleItem) {
          return {
            ...product,
            stock_quantity: Math.max(
              0,
              product.stock_quantity - saleItem.quantity
            ),
          };
        }
        return product;
      });
      localStorage.setItem("products", JSON.stringify(updatedProducts));

      // Update customer data in localStorage (fallback/sync)
      const customerData = isTeacherPurchase ? {
        name: teacherInfo.name,
        department: teacherInfo.department,
        employee_id: teacherInfo.employee_id,
        is_teacher: true,
        education_level: "Teacher"
      } : customer;

      if (customerData.name) {
        const existingCustomers = JSON.parse(
          localStorage.getItem("customers") || "[]"
        ) as Customer[];
        const customerIndex = existingCustomers.findIndex(
          (c) => c.name === customerData.name || (isTeacherPurchase && c.employee_id === teacherInfo.employee_id)
        );

        if (customerIndex >= 0) {
          // Update existing customer
          existingCustomers[customerIndex] = {
            ...existingCustomers[customerIndex],
            ...customerData,
            total_orders:
              (existingCustomers[customerIndex].total_orders || 0) + 1,
            total_spent:
              (existingCustomers[customerIndex].total_spent || 0) + total,
            last_order_date: new Date().toISOString().split("T")[0],
          };
        } else {
          // Add new customer
          const newCustomer = {
            ...customerData,
            id: backendCustomerId || Date.now(),
            total_orders: 1,
            total_spent: total,
            last_order_date: new Date().toISOString().split("T")[0],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          existingCustomers.push(newCustomer);
        }
        localStorage.setItem("customers", JSON.stringify(existingCustomers));
      }

      // Save order to localStorage (fallback/sync)
      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      const newOrder = {
        id: backendOrderId || Date.now(),
        order_number: `ORD-${backendOrderId || Date.now()}`,
        customer_id: backendCustomerId || customerData.id || null,
        customer: customerData.name
          ? {
              id: backendCustomerId || customerData.id,
              name: customerData.name,
              educational_summary: isTeacherPurchase ? "Teacher" : educationalSummary,
              department: customerData.department,
              is_teacher: customerData.is_teacher,
              education_level: customerData.education_level,
              employee_id: customerData.employee_id,
            }
          : null,
        user: {
          id: 1,
          name: "Current User",
        },
        items: saleItems,
        subtotal: saleItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: total,
        paid_amount: paidAmount,
        due_amount: Math.max(0, total - paidAmount),
        payment_status:
          paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "pending",
        order_status: "completed",
        notes: customerData.name
          ? isTeacherPurchase 
            ? `Teacher: ${customerData.name} (${customerData.department})`
            : `Customer: ${customerData.name}`
          : "Walk-in customer",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      existingOrders.push(newOrder);
      localStorage.setItem("orders", JSON.stringify(existingOrders));

      // Refresh products to show updated stock
      fetchProducts();

      // Clear the sale after processing
      clearSale();
      setShowPaymentModal(false);

      // Show success message
      const message = backendOrderId
        ? "Sale processed successfully and saved to database!"
        : "Sale processed successfully (saved locally)!";
      alert(message);

      // Trigger orders page refresh
      window.dispatchEvent(new Event("ordersUpdated"));

      // Navigate to orders page
      navigate("/orders");
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Error processing sale. Please try again.");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div
        className={`p-6 ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Loading products...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      }`}
    >
      {/* Modern Header */}
      <div
        className={`${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border-b backdrop-blur-sm bg-opacity-95 sticky top-0 z-10`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 rounded-xl ${
                  theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                }`}
              >
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Point of Sale
                </h1>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Process sales and manage transactions
                </p>
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
            <div
              className={`${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } rounded-2xl shadow-xl border backdrop-blur-sm`}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                      }`}
                    >
                      <span className="text-lg">📦</span>
                    </div>
                    <h2
                      className={`text-xl font-bold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Products
                    </h2>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {filteredProducts.length} items
                  </span>
                </div>

                {/* Modern Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span
                      className={`text-lg ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      🔍
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
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
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-500"
                          : "bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-blue-100"
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
                          <div
                            className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-colors duration-300 ${
                              theme === "dark"
                                ? "bg-gray-600 border-gray-500 group-hover:border-blue-400"
                                : "bg-gray-100 border-gray-200 group-hover:border-blue-300"
                            }`}
                          >
                            <span className="text-3xl text-gray-400 dark:text-gray-500">
                              📦
                            </span>
                          </div>
                        )}
                      </div>

                      <h3
                        className={`font-semibold text-sm mb-1 text-center line-clamp-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {product.name}
                      </h3>
                      
                      {/* Show uniform details if available */}
                      {(product.uniform_size || product.uniform_gender) && (
                        <div className="flex justify-center items-center space-x-1 mb-2">
                          {product.uniform_size && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                            }`}>
                              <span className="mr-1">📏</span>
                              {product.uniform_size}
                            </span>
                          )}
                          {product.uniform_gender && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                              <span className="mr-1">{product.uniform_gender === 'Men' ? '👨' : '👩'}</span>
                              {product.uniform_gender}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <p
                        className={`text-xs mb-3 text-center ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        SKU: {product.sku}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ₱{(product.selling_price || product.price).toFixed(2)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.stock_quantity > 10
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : product.stock_quantity > 0
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
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
            <div
              className={`${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } rounded-2xl shadow-xl border backdrop-blur-sm`}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-green-900" : "bg-green-100"
                      }`}
                    >
                      <span className="text-lg">🛍️</span>
                    </div>
                    <h2
                      className={`text-xl font-bold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Current Sale
                    </h2>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {saleItems.length} items
                  </span>
                </div>
              </div>

              {/* Teacher Purchase Toggle */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      👩‍🏫 Teacher Purchase
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTeacherPurchase}
                        onChange={(e) => {
                          setIsTeacherPurchase(e.target.checked);
                          if (!e.target.checked) {
                            setTeacherInfo({
                              name: "",
                              department: "",
                              employee_id: ""
                            });
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        isTeacherPurchase 
                          ? 'bg-blue-600' 
                          : (theme === "dark" ? 'bg-gray-600' : 'bg-gray-300')
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          isTeacherPurchase ? 'translate-x-5' : 'translate-x-0'
                        } mt-0.5 ml-0.5`}></div>
                      </div>
                    </label>
                  </div>
                  {isTeacherPurchase && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                    }`}>
                      Debt Tracking Enabled
                    </span>
                  )}
                </div>
                
                {/* Teacher Information Form */}
                {isTeacherPurchase && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Teacher Name *
                        </label>
                        <input
                          type="text"
                          value={teacherInfo.name}
                          onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})}
                          placeholder="Enter teacher name"
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Department *
                        </label>
                        <select
                          value={teacherInfo.department}
                          onChange={(e) => setTeacherInfo({...teacherInfo, department: e.target.value})}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="College of Arts and Sciences">College of Arts and Sciences</option>
                          <option value="College of Business and Accountancy">College of Business and Accountancy</option>
                          <option value="College of Computer Studies">College of Computer Studies</option>
                          <option value="College of Criminal Justice Education">College of Criminal Justice Education</option>
                          <option value="College of Engineering">College of Engineering</option>
                          <option value="College of Hotel and Tourism Management">College of Hotel and Tourism Management</option>
                          <option value="College of Nursing">College of Nursing</option>
                          <option value="College of Teacher Education">College of Teacher Education</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={teacherInfo.employee_id}
                        onChange={(e) => setTeacherInfo({...teacherInfo, employee_id: e.target.value})}
                        placeholder="T-2024-001"
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                      />
                    </div>
                    <div className={`p-3 rounded-lg ${
                      theme === "dark" ? "bg-yellow-900/20 border border-yellow-700" : "bg-yellow-50 border border-yellow-200"
                    }`}>
                      <div className="flex items-start space-x-2">
                        <span className="text-yellow-600 mt-0.5">💡</span>
                        <div>
                          <p className={`text-xs font-medium ${
                            theme === "dark" ? "text-yellow-200" : "text-yellow-800"
                          }`}>
                            Teacher Debt Tracking
                          </p>
                          <p className={`text-xs mt-1 ${
                            theme === "dark" ? "text-yellow-300" : "text-yellow-700"
                          }`}>
                            This purchase will be tracked in the Teachers' Debt Management system. 
                            Partial payments will create debt records for follow-up.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="p-6">
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                  {saleItems.length === 0 ? (
                    <div
                      className={`text-center py-8 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <div className="text-4xl mb-3">🛒</div>
                      <p className="text-sm">No items in cart</p>
                      <p className="text-xs mt-1">
                        Click on products to add them
                      </p>
                    </div>
                  ) : (
                    saleItems.map((item) => (
                      <div
                        key={item.id}
                        className={`group p-4 border rounded-xl transition-all duration-200 ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                            : "bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4
                              className={`font-semibold text-sm ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {item.name}
                            </h4>
                            {/* Show uniform details if available */}
                            {item.category?.name?.toLowerCase() === 'uniform' && (item.uniform_size || item.uniform_gender) && (
                              <div className="flex items-center space-x-2 mt-1">
                                {item.uniform_size && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    <span className="mr-1">📏</span>
                                    {item.uniform_size}
                                  </span>
                                )}
                                {item.uniform_gender && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    <span className="mr-1">
                                      {item.uniform_gender === 'Men' ? '👨' : '👩'}
                                    </span>
                                    {item.uniform_gender}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
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
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors duration-200 ${
                                theme === "dark"
                                  ? "bg-gray-600 hover:bg-gray-500 text-white"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              }`}
                            >
                              −
                            </button>
                            <span
                              className={`text-sm font-semibold min-w-[2rem] text-center ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors duration-200 ${
                                theme === "dark"
                                  ? "bg-gray-600 hover:bg-gray-500 text-white"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              }`}
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            ₱{(item.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div
                  className={`border-t pt-4 space-y-3 ${
                    theme === "dark" ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`flex justify-between text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <span>Subtotal:</span>
                    <span>₱{(subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div
                    className={`flex justify-between font-bold text-xl border-t pt-3 ${
                      theme === "dark"
                        ? "border-gray-600 text-white"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    <span>Total:</span>
                    <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      ₱{(total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-4">
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className={`w-full py-3 px-4 border rounded-xl transition-all duration-200 font-medium ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white hover:shadow-lg"
                        : "bg-white border-gray-300 hover:bg-gray-50 text-gray-900 hover:shadow-md"
                    }`}
                  >
                    <span className="mr-2">👤</span>
                    {customer.name ? customer.name : "Add Customer for Sale"}
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={saleItems.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    <span className="mr-2">💳</span>
                    Process Sale (₱{(total || 0).toFixed(2)})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${theme === "dark" ? "#374151" : "#f3f4f6"};
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === "dark" ? "#6b7280" : "#d1d5db"};
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === "dark" ? "#9ca3af" : "#9ca3af"};
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `,
        }}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-900"
            } p-6 rounded-lg w-96`}
          >
            <h3 className="text-lg font-semibold mb-4">Payment</h3>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "cash")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Amount Paid */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Amount Paid
              </label>
              <input
                type="number"
                value={paidAmount === 0 ? "" : paidAmount}
                onChange={(e) =>
                  setPaidAmount(
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="0.00"
              />
            </div>

            {/* Total and Change/Balance */}
            <div
              className={`mb-6 p-3 rounded-lg ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              {isTeacherPurchase && paidAmount < total ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-bold">₱{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-green-600">₱{paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Debt Amount:</span>
                    <span className="font-bold text-red-600">₱{(total - paidAmount).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span
                    className={`font-bold ${
                      changeAmount < 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    ₱{(changeAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={processSale}
                disabled={!isTeacherPurchase && paidAmount < total}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isTeacherPurchase && paidAmount < total ? 'Complete Sale (Create Debt)' : 'Complete Sale'}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-gray-600 text-white hover:bg-gray-500"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
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
          <div
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700"
                : "bg-white text-gray-900 border-gray-300"
            } p-6 rounded-lg w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col border shadow-lg`}
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold">Search and Add Customer</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className={`text-2xl font-bold hover:opacity-70 transition-opacity ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                ×
              </button>
            </div>

            <div className="relative flex-shrink-0 mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span
                  className={`text-lg ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  🔍
                </span>
              </div>
              <input
                type="text"
                placeholder="Search by Student Name or ID..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            <div className="overflow-y-auto flex-grow">
              {studentsContext?.students
                .filter(
                  (student) =>
                    student.student_id
                      .toLowerCase()
                      .includes(customerSearchTerm.toLowerCase()) ||
                    `${student.first_name} ${student.last_name}`
                      .toLowerCase()
                      .includes(customerSearchTerm.toLowerCase())
                )
                .map((student) => (
                  <div
                    key={student.student_id}
                    onClick={() => handleSelectCustomer(student)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                      theme === "dark"
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-100 hover:bg-blue-100"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {student.first_name} {student.last_name}
                    </p>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      ID: {student.student_id} | {student.course} -{" "}
                      {
                        student.year_level
                      }
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
