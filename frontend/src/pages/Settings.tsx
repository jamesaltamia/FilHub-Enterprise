import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { settingsAPI } from '../services/api';
import DataMigrationModal from '../components/DataMigrationModal';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(() => {
    const saved = localStorage.getItem('lowStockThreshold');
    return saved ? parseInt(saved) : 5;
  });

  // Security states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRecaptchaModal, setShowRecaptchaModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [isRecaptchaEnabled, setIsRecaptchaEnabled] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('');
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState('');
  const [loginSessions, setLoginSessions] = useState<any[]>([]);

  useEffect(() => {
    // Check if reCAPTCHA is enabled
    const recaptchaSettings = JSON.parse(localStorage.getItem('recaptchaSettings') || '{}');
    setIsRecaptchaEnabled(recaptchaSettings.enabled || false);
    setRecaptchaSiteKey(recaptchaSettings.siteKey || '');
    setRecaptchaSecretKey(recaptchaSettings.secretKey || '');
    
    // Load login sessions from localStorage
    const sessions = JSON.parse(localStorage.getItem('loginSessions') || '[]');
    setLoginSessions(sessions);
  }, [user]);

  // Security functions
  const handlePasswordChange = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }
    
    // Update password in localStorage
    const users = JSON.parse(localStorage.getItem('filhub_users') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.email === user?.email ? { ...u, password: passwordForm.newPassword } : u
    );
    localStorage.setItem('filhub_users', JSON.stringify(updatedUsers));
    
    alert('Password updated successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(false);
  };

  const handleRecaptchaToggle = () => {
    if (isRecaptchaEnabled) {
      // Disable reCAPTCHA
      const recaptchaSettings = { enabled: false, siteKey: '', secretKey: '' };
      localStorage.setItem('recaptchaSettings', JSON.stringify(recaptchaSettings));
      setIsRecaptchaEnabled(false);
      setRecaptchaSiteKey('');
      setRecaptchaSecretKey('');
      alert('reCAPTCHA protection disabled');
    } else {
      // Enable reCAPTCHA - show setup modal
      setShowRecaptchaModal(true);
    }
  };

  const saveRecaptchaSettings = () => {
    if (!recaptchaSiteKey.trim() || !recaptchaSecretKey.trim()) {
      alert('Please enter both Site Key and Secret Key');
      return;
    }
    
    const recaptchaSettings = {
      enabled: true,
      siteKey: recaptchaSiteKey.trim(),
      secretKey: recaptchaSecretKey.trim()
    };
    
    localStorage.setItem('recaptchaSettings', JSON.stringify(recaptchaSettings));
    setIsRecaptchaEnabled(true);
    setShowRecaptchaModal(false);
    alert('reCAPTCHA protection enabled successfully!');
  };

  const addCurrentSession = () => {
    const currentSession = {
      id: Date.now(),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Computer',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
               navigator.userAgent.includes('Firefox') ? 'Firefox' : 
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown Browser',
      location: 'Current Location',
      loginTime: new Date().toISOString(),
      isActive: true,
      isCurrent: true
    };
    
    const existingSessions = JSON.parse(localStorage.getItem('loginSessions') || '[]');
    const updatedSessions = [currentSession, ...existingSessions.filter((s: any) => !s.isCurrent)];
    localStorage.setItem('loginSessions', JSON.stringify(updatedSessions));
    setLoginSessions(updatedSessions);
  };

  const terminateSession = (sessionId: number) => {
    const updatedSessions = loginSessions.filter(session => session.id !== sessionId);
    localStorage.setItem('loginSessions', JSON.stringify(updatedSessions));
    setLoginSessions(updatedSessions);
    alert('Session terminated successfully');
  };

  const terminateAllSessions = () => {
    if (window.confirm('Are you sure you want to terminate all other sessions? You will remain logged in on this device.')) {
      const currentSession = loginSessions.find(session => session.isCurrent);
      const newSessions = currentSession ? [currentSession] : [];
      localStorage.setItem('loginSessions', JSON.stringify(newSessions));
      setLoginSessions(newSessions);
      alert('All other sessions terminated successfully');
    }
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'inventory', name: 'Inventory Settings', icon: '📦' },
    { id: 'backup', name: 'Backup & Restore', icon: '💾' },
    { id: 'appearance', name: 'Theme & Appearance', icon: '🎨' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Modern Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b backdrop-blur-sm bg-opacity-95 sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage your account settings and preferences</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'} font-medium`}>
              <span className="mr-2">👤</span>
              {user?.name || 'User'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Modern Sidebar Navigation */}
          <div className="lg:w-80">
            <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
                    <span className="text-lg">📝</span>
                  </div>
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings Menu</h2>
                </div>
              </div>
              <nav className="p-6 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? (theme === 'dark' ? 'bg-blue-900 text-blue-200 shadow-lg' : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-md')
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

          {/* Modern Main Content */}
          <div className="flex-1">
            <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm`}>
              
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                        <span className="text-lg">👤</span>
                      </div>
                      <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Personal Information
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            👤 Full Name
                          </label>
                          <input
                            type="text"
                            value={personalInfo.name}
                            onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            📧 Email Address
                          </label>
                          <input
                            type="email"
                            value={personalInfo.email}
                            onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                            placeholder="Enter your email address"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            📱 Phone Number
                          </label>
                          <input
                            type="tel"
                            value={personalInfo.phone}
                            onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            🏠 Address
                          </label>
                          <input
                            type="text"
                            value={personalInfo.address}
                            onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                            placeholder="Enter your address"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={async () => {
                            try {
                              // Try to save to backend first
                              try {
                                await settingsAPI.updateBusinessInfo({
                                  business_name: personalInfo.name,
                                  business_phone: personalInfo.phone,
                                  business_address: personalInfo.address,
                                  business_email: personalInfo.email
                                });
                                console.log('Personal info saved to backend successfully');
                              } catch (apiError) {
                                console.log('Backend API failed for personal info update, using localStorage fallback:', apiError);
                              }

                              // Update locally (fallback/sync)
                              localStorage.setItem('userPersonalInfo', JSON.stringify(personalInfo));
                              alert('Personal information updated successfully!');
                            } catch (error) {
                              console.error('Error updating personal info:', error);
                              alert('Error updating personal information. Please try again.');
                            }
                          }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center"
                        >
                          <span className="mr-2">💾</span>
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-red-900' : 'bg-red-100'}`}>
                        <span className="text-lg">🔒</span>
                      </div>
                      <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Security Settings
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Password Security */}
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🛡️</span>
                            <div>
                              <h3 className={`font-semibold ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                                Password Security
                              </h3>
                              <p className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                Change your password regularly to keep your account secure
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPasswordModal(true)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-yellow-800 text-yellow-200 hover:bg-yellow-700' : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'}`}
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                      
                      {/* reCAPTCHA Protection */}
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🤖</span>
                            <div>
                              <h3 className={`font-semibold ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                                reCAPTCHA Protection
                              </h3>
                              <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                                Protect your application from bots and spam
                              </p>
                              <div className={`text-xs mt-1 ${isRecaptchaEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                Status: {isRecaptchaEnabled ? '✅ Enabled' : '❌ Disabled'}
                              </div>
                              {isRecaptchaEnabled && recaptchaSiteKey && (
                                <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Site Key: {recaptchaSiteKey.substring(0, 20)}...
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleRecaptchaToggle}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              isRecaptchaEnabled 
                                ? (theme === 'dark' ? 'bg-red-800 text-red-200 hover:bg-red-700' : 'bg-red-200 text-red-800 hover:bg-red-300')
                                : (theme === 'dark' ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-200 text-blue-800 hover:bg-blue-300')
                            }`}
                          >
                            {isRecaptchaEnabled ? 'Disable reCAPTCHA' : 'Setup reCAPTCHA'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Login Sessions */}
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📱</span>
                            <div>
                              <h3 className={`font-semibold ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>
                                Login Sessions
                              </h3>
                              <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                                Monitor and manage your active login sessions
                              </p>
                              <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Active sessions: {loginSessions.length}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={addCurrentSession}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-green-800 text-green-200 hover:bg-green-700' : 'bg-green-200 text-green-800 hover:bg-green-300'}`}
                            >
                              Add Current
                            </button>
                            <button
                              onClick={() => setShowSessionsModal(true)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-green-800 text-green-200 hover:bg-green-700' : 'bg-green-200 text-green-800 hover:bg-green-300'}`}
                            >
                              Manage Sessions
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Settings Tab */}
              {activeTab === 'inventory' && (
                <div>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                        <span className="text-lg">📦</span>
                      </div>
                      <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Inventory Settings
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="max-w-md">
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          📊 Low Stock Alert Threshold
                        </label>
                        <style>
                          {`
                            .no-spinner::-webkit-outer-spin-button,
                            .no-spinner::-webkit-inner-spin-button {
                              -webkit-appearance: none;
                              margin: 0;
                            }
                            .no-spinner[type=number] {
                              -moz-appearance: textfield;
                            }
                          `}
                        </style>
                        <input
                          type="number"
                          value={lowStockThreshold}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setLowStockThreshold('');
                            } else {
                              setLowStockThreshold(parseInt(value) || '');
                            }
                          }}
                          className={`no-spinner w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                        />
                        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Get notified when product stock falls below this number
                        </p>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={async () => {
                            const threshold = typeof lowStockThreshold === 'string' ? parseInt(lowStockThreshold) || 5 : lowStockThreshold;
                            
                            try {
                              // Try to save to backend first
                              try {
                                await settingsAPI.update({
                                  low_stock_threshold: threshold
                                });
                                console.log('Settings saved to backend successfully');
                              } catch (apiError) {
                                console.log('Backend API failed for settings update, using localStorage fallback:', apiError);
                              }

                              // Update locally (fallback/sync)
                              localStorage.setItem('lowStockThreshold', threshold.toString());
                              setLowStockThreshold(threshold);
                              alert('Inventory settings updated successfully!');
                            } catch (error) {
                              console.error('Error updating settings:', error);
                              alert('Error updating settings. Please try again.');
                            }
                          }}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center"
                        >
                          <span className="mr-2">💾</span>
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Theme & Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                        <span className="text-lg">🎨</span>
                      </div>
                      <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Theme & Appearance
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          🌓 Theme Preference
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={() => setTheme('light')}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              theme === 'light'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="text-center">
                              <span className="text-2xl block mb-2">☀️</span>
                              <span className="font-medium text-gray-900">Light Mode</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setTheme('dark')}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              theme === 'dark'
                                ? 'border-blue-500 bg-blue-900/20'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="text-center">
                              <span className="text-2xl block mb-2">🌙</span>
                              <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dark Mode</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                              setTheme(mediaQuery.matches ? 'dark' : 'light');
                            }}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 border-gray-300 hover:border-gray-400`}
                          >
                            <div className="text-center">
                              <span className="text-2xl block mb-2">🖥️</span>
                              <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>System</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Backup & Restore Tab */}
              {activeTab === 'backup' && (
                <div>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-orange-900' : 'bg-orange-100'}`}>
                        <span className="text-lg">💾</span>
                      </div>
                      <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Backup & Restore
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">💾</span>
                          <div>
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                              Data Backup
                            </h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                              Export your data for backup purposes
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📥</span>
                          <div>
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>
                              Data Restore
                            </h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                              Import previously backed up data
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'} border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🚀</span>
                            <div>
                              <h3 className={`font-semibold ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'}`}>
                                Migrate to Database
                              </h3>
                              <p className={`text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                                Transfer localStorage data to backend database
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowMigrationModal(true)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              theme === 'dark' 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            Start Migration
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className={`text-gray-500 hover:text-gray-700 ${theme === 'dark' ? 'hover:text-gray-300' : ''}`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* reCAPTCHA Setup Modal */}
      {showRecaptchaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-lg mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Setup reCAPTCHA Protection
              </h3>
              <button
                onClick={() => setShowRecaptchaModal(false)}
                className={`text-gray-500 hover:text-gray-700 ${theme === 'dark' ? 'hover:text-gray-300' : ''}`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
                  <div className="text-6xl mb-2">🤖</div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Configure Google reCAPTCHA to protect your application
                  </p>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                  💡 <strong>How to get reCAPTCHA keys:</strong><br/>
                  1. Visit <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="underline">Google reCAPTCHA Admin</a><br/>
                  2. Register a new site with your domain<br/>
                  3. Copy the Site Key and Secret Key
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  🔑 Site Key (Public)
                </label>
                <input
                  type="text"
                  value={recaptchaSiteKey}
                  onChange={(e) => setRecaptchaSiteKey(e.target.value)}
                  placeholder="6Lc6BAAAAAAAAChqRbQZcn_yyyyyyyyyyyyyyyyy"
                  className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  🔐 Secret Key (Private)
                </label>
                <input
                  type="password"
                  value={recaptchaSecretKey}
                  onChange={(e) => setRecaptchaSecretKey(e.target.value)}
                  placeholder="6Lc6BAAAAAAAAKN3DRm6VA_xxxxxxxxxxxxxxxxx"
                  className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
              </div>
              
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  ⚠️ <strong>Security Note:</strong> Keep your Secret Key private and never share it publicly.
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRecaptchaModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveRecaptchaSettings}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save & Enable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Management Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-2xl mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Manage Login Sessions
              </h3>
              <button
                onClick={() => setShowSessionsModal(false)}
                className={`text-gray-500 hover:text-gray-700 ${theme === 'dark' ? 'hover:text-gray-300' : ''}`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {loginSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📱</div>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    No active sessions found
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loginSessions.map((session) => (
                    <div key={session.id} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {session.device.includes('Mobile') ? '📱' : '💻'}
                          </div>
                          <div>
                            <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {session.device} - {session.browser}
                              {session.isCurrent && <span className="ml-2 text-green-600 text-sm">Current</span>}
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {session.location} • {new Date(session.loginTime).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => terminateSession(session.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setShowSessionsModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Close
                </button>
                {loginSessions.length > 1 && (
                  <button
                    onClick={terminateAllSessions}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Terminate All Others
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Migration Modal */}
      <DataMigrationModal 
        isOpen={showMigrationModal} 
        onClose={() => setShowMigrationModal(false)} 
      />
    </div>
  );
};

export default Settings;
