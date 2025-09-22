import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
  
  const [lowStockThreshold, setLowStockThreshold] = useState(() => {
    const saved = localStorage.getItem('lowStockThreshold');
    return saved ? parseInt(saved) : 5;
  });

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
                          onClick={() => {
                            localStorage.setItem('userPersonalInfo', JSON.stringify(personalInfo));
                            alert('Personal information updated successfully!');
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
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
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
                      </div>
                      
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🔐</span>
                          <div>
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                              Two-Factor Authentication
                            </h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                              Add an extra layer of security to your account
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>
                              Login Sessions
                            </h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                              Monitor and manage your active login sessions
                            </p>
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
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                        />
                        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Get notified when product stock falls below this number
                        </p>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            localStorage.setItem('lowStockThreshold', lowStockThreshold.toString());
                            alert('Inventory settings updated successfully!');
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
                    </div>
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

export default Settings;
