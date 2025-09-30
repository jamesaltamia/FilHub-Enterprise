import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { canteenRentalAPI } from '../services/canteenRentalAPI';
import type { Stall, Tenant, RentalPayment, RentalContract } from '../services/canteenRentalAPI';

const CanteenManagement: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalStalls: 0,
    occupiedStalls: 0,
    vacantStalls: 0,
    totalMonthlyRent: 0,
    paidThisMonth: 0,
    unpaidThisMonth: 0,
    overduePayments: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<RentalPayment | null>(null);

  // Form states
  const [tenantForm, setTenantForm] = useState({
    name: '',
    contact_number: '',
    email: '',
    business_name: '',
    business_type: '',
  });

  const [contractForm, setContractForm] = useState({
    stall_id: 0,
    tenant_id: 0,
    start_date: '',
    end_date: '',
    monthly_rent: 5000,
    deposit_amount: 10000,
    contract_terms: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load data with faster localStorage-first approach
      console.log('Loading canteen data...');
      
      // Load stalls first (most important for UI)
      const stallsData = await canteenRentalAPI.getStalls();
      setStalls(stallsData);
      
      // Load other data in parallel but don't wait for all
      const loadPromises = [
        canteenRentalAPI.getTenants().then(setTenants).catch(() => console.log('Tenants load failed, using localStorage')),
        canteenRentalAPI.getPayments().then(setPayments).catch(() => console.log('Payments load failed, using localStorage')),
        canteenRentalAPI.getContracts().then(setContracts).catch(() => console.log('Contracts load failed, using localStorage')),
        canteenRentalAPI.getDashboardStats().then(setDashboardStats).catch(() => console.log('Stats load failed, using localStorage'))
      ];
      
      // Don't wait for all promises, let them complete in background
      Promise.allSettled(loadPromises);
      
      console.log('Canteen data loaded successfully');
    } catch (error) {
      console.error('Error loading canteen data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    try {
      const newTenant = await canteenRentalAPI.createTenant(tenantForm);
      setTenants([...tenants, newTenant]);
      setTenantForm({ name: '', contact_number: '', email: '', business_name: '', business_type: '' });
      setShowTenantModal(false);
      alert('Tenant created successfully!');
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert('Error creating tenant');
    }
  };

  const handleCreateContract = async () => {
    try {
      const newContract = await canteenRentalAPI.createContract({
        ...contractForm,
        is_active: true,
      });
      
      // Update stall as occupied
      await canteenRentalAPI.updateStall(contractForm.stall_id, {
        is_occupied: true,
        tenant_id: contractForm.tenant_id,
      });

      setContracts([...contracts, newContract]);
      setContractForm({
        stall_id: 0,
        tenant_id: 0,
        start_date: '',
        end_date: '',
        monthly_rent: 5000,
        deposit_amount: 10000,
        contract_terms: '',
      });
      setShowContractModal(false);
      loadData(); // Refresh data
      alert('Contract created successfully!');
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Error creating contract');
    }
  };

  const handleMarkPaymentAsPaid = async (paymentId: number) => {
    try {
      const paymentData = {
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        notes: 'Payment received',
      };
      
      const updatedPayment = await canteenRentalAPI.markPaymentAsPaid(paymentId, paymentData);
      setPayments(payments.map(p => p.id === paymentId ? updatedPayment : p));
      loadData(); // Refresh stats
      alert('Payment marked as paid!');
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('Error updating payment');
    }
  };

  const generateMonthlyPayments = async () => {
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();

    try {
      const newPayments = await canteenRentalAPI.generateMonthlyPayments(month, year);
      if (newPayments.length > 0) {
        loadData();
        alert(`Generated ${newPayments.length} new payment records for ${month}/${year}`);
      } else {
        alert('No new payments to generate. All payments for this month already exist.');
      }
    } catch (error) {
      console.error('Error generating payments:', error);
      alert('Error generating monthly payments');
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏢' },
    { id: 'stalls', name: 'Stalls', icon: '🏪' },
    { id: 'tenants', name: 'Tenants', icon: '👥' },
    { id: 'contracts', name: 'Contracts', icon: '📋' },
    { id: 'payments', name: 'Payments', icon: '💰' },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading Canteen Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b backdrop-blur-sm bg-opacity-95 sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-orange-900' : 'bg-orange-100'}`}>
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Canteen Management</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage stalls, tenants, and rental payments</p>
              </div>
            </div>
            <button
              onClick={generateMonthlyPayments}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center"
            >
              <span className="mr-2">📅</span>
              Generate Monthly Payments
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-80">
            <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Navigation</h2>
              </div>
              <nav className="p-6 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? (theme === 'dark' ? 'bg-orange-900 text-orange-200 shadow-lg' : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 shadow-md')
                        : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')
                    }`}
                  >
                    <span className="mr-3 text-lg">{tab.icon}</span>
                    {tab.name}
                    {activeTab === tab.id && (
                      <span className="ml-auto">➤</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
              
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h2>
                  </div>
                  <div className="p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Total Stalls</p>
                            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.totalStalls}</p>
                          </div>
                          <span className="text-3xl">🏪</span>
                        </div>
                      </div>

                      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>Occupied</p>
                            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.occupiedStalls}</p>
                          </div>
                          <span className="text-3xl">✅</span>
                        </div>
                      </div>

                      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'}`}>Vacant</p>
                            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.vacantStalls}</p>
                          </div>
                          <span className="text-3xl">🏪</span>
                        </div>
                      </div>

                      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>Monthly Rent</p>
                            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₱{dashboardStats.totalMonthlyRent.toLocaleString()}</p>
                          </div>
                          <span className="text-3xl">💰</span>
                        </div>
                      </div>
                    </div>

                    {/* Stalls Grid */}
                    <div className="mb-8">
                      <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Canteen Stalls Layout</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {stalls.map((stall) => {
                          const tenant = tenants.find(t => t.id === stall.tenant_id);
                          return (
                            <div
                              key={stall.id}
                              className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                                stall.is_occupied
                                  ? (theme === 'dark' ? 'bg-green-900/20 border-green-700 hover:bg-green-900/30' : 'bg-green-50 border-green-300 hover:bg-green-100')
                                  : (theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-300 hover:bg-gray-100')
                              }`}
                              onClick={() => setSelectedStall(stall)}
                            >
                              <div className="text-center">
                                <div className="text-4xl mb-2">
                                  {stall.is_occupied ? '🏪' : '🏬'}
                                </div>
                                <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {stall.stall_name}
                                </h4>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  ₱{stall.monthly_rent.toLocaleString()}/month
                                </p>
                                {stall.is_occupied && tenant ? (
                                  <div className="mt-2">
                                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                                      {tenant.business_name}
                                    </p>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {tenant.name}
                                    </p>
                                  </div>
                                ) : (
                                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Available for rent
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                        <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>Paid This Month</h4>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₱{dashboardStats.paidThisMonth.toLocaleString()}</p>
                      </div>

                      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border`}>
                        <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>Unpaid This Month</h4>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₱{dashboardStats.unpaidThisMonth.toLocaleString()}</p>
                      </div>

                      <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'} border`}>
                        <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>Overdue Payments</h4>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.overduePayments}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs will be rendered here */}
              {activeTab !== 'dashboard' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚧</div>
                    <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {tabs.find(t => t.id === activeTab)?.name} Section
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      This section is under development. The dashboard shows the main functionality.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanteenManagement;
