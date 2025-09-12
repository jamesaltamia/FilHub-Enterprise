import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TwoFactorAuthService } from '../utils/twoFactorAuth';
import TwoFactorSetupComponent from '../components/TwoFactorSetup';
import { BackupService } from '../utils/backupService';

const Settings: React.FC = () => {
  const { user, role, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [show2FADisableConfirm, setShow2FADisableConfirm] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupStats, setBackupStats] = useState<{
    timestamp: string;
    dataSize: {
      products: number;
      orders: number;
      categories: number;
      twoFactorAccounts: number;
    };
  } | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(() => {
    const saved = localStorage.getItem('lowStockThreshold');
    return saved ? parseInt(saved) : 5;
  });
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', email: 'admin@filhub.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Cashier User', email: 'cashier@filhub.com', role: 'cashier', status: 'active' }
  ]);

  // Sync form state with user context changes
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'cashier',
    password: ''
  });
  
  const [themeColors, setThemeColors] = useState(() => {
    const saved = localStorage.getItem('themeColors');
    return saved ? JSON.parse(saved) : {
      primary: '#1e40af',
      secondary: '#fbbf24',
      accent: '#10b981'
    };
  });
  const [systemTheme, setSystemTheme] = useState(() => {
    return localStorage.getItem('systemTheme') === 'true';
  });
  const [customLogo, setCustomLogo] = useState(() => {
    return localStorage.getItem('customLogo') || null;
  });

  // Initialize theme colors and system theme on mount
  useEffect(() => {
    // Apply saved theme colors to CSS custom properties
    document.documentElement.style.setProperty('--color-primary', themeColors.primary);
    document.documentElement.style.setProperty('--color-secondary', themeColors.secondary);
    document.documentElement.style.setProperty('--color-accent', themeColors.accent);

    // Set up system theme listener if system theme is enabled
    if (systemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      // Set initial theme based on system preference
      setTheme(mediaQuery.matches ? 'dark' : 'light');
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [systemTheme, themeColors, setTheme]);

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'inventory', name: 'Inventory Settings', icon: '📦' },
    { id: 'backup', name: 'Backup & Restore', icon: '💾' },
    { id: 'appearance', name: 'Theme & Appearance', icon: '🎨' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Personal Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={personalInfo.name}
                          onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={personalInfo.phone}
                          onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={personalInfo.address}
                          onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          console.log('Updating user with:', personalInfo);
                          console.log('Current user before update:', user);
                          console.log('User name before update:', user?.name);
                          updateUser({
                            name: personalInfo.name,
                            email: personalInfo.email,
                            phone: personalInfo.phone,
                            address: personalInfo.address
                          });
                          console.log('updateUser called');
                          // Add a small delay to check if state updated
                          setTimeout(() => {
                            console.log('User after update (delayed check):', user);
                          }, 100);
                          alert('Personal information updated!');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Security Settings
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Change Password */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Change Password
                      </h3>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            if (passwordForm.newPassword === passwordForm.confirmPassword) {
                              alert('Password changed successfully!');
                              setPasswordForm({currentPassword: '', newPassword: '', confirmPassword: ''});
                            } else {
                              alert('Passwords do not match!');
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>

                    {/* Two Factor Authentication */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Two-Factor Authentication
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Add an extra layer of security to your account
                          </p>
                          {twoFactorEnabled && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✓ Two-factor authentication is enabled
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {twoFactorEnabled && (
                            <button
                              onClick={() => setShow2FADisableConfirm(true)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                            >
                              Disable
                            </button>
                          )}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={twoFactorEnabled}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setShowTwoFactorSetup(true);
                                } else {
                                  setShow2FADisableConfirm(true);
                                }
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* User Management Tab */}
              {activeTab === 'users' && role === 'admin' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    User Management
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Add New User */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Add New User
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="cashier">Cashier</option>
                          <option value="admin">Admin</option>
                        </select>
                        <input
                          type="password"
                          placeholder="Password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (newUser.name && newUser.email && newUser.password) {
                            const newId = Math.max(...users.map(u => u.id)) + 1;
                            setUsers([...users, {...newUser, id: newId, status: 'active'}]);
                            setNewUser({name: '', email: '', role: 'cashier', password: ''});
                            alert('User added successfully!');
                          } else {
                            alert('Please fill all fields');
                          }
                        }}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Add User
                      </button>
                    </div>

                    {/* Users List */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Existing Users
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    {user.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => {
                                      setUsers(users.filter(u => u.id !== user.id));
                                      alert('User removed successfully!');
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Settings Tab */}
              {activeTab === 'inventory' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Inventory Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Low Stock Alert Threshold
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          min="1"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Alert when stock falls below this number
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          localStorage.setItem('lowStockThreshold', lowStockThreshold.toString());
                          // Trigger a custom event to notify other components
                          window.dispatchEvent(new CustomEvent('lowStockThresholdChanged', { 
                            detail: { threshold: lowStockThreshold } 
                          }));
                          alert('Low stock threshold updated! This will now be applied across the inventory system.');
                        }}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save Threshold
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Backup & Restore Tab */}
              {activeTab === 'backup' && role === 'admin' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Backup & Restore
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Full System Backup */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Full System Backup
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Create a comprehensive backup including products, orders, categories, user settings, 2FA data, themes, and all system configurations.
                      </p>
                      
                      {backupStats && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Last Backup Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-700 dark:text-blue-300">
                            <div>Products: {backupStats.dataSize.products}</div>
                            <div>Orders: {backupStats.dataSize.orders}</div>
                            <div>Categories: {backupStats.dataSize.categories}</div>
                            <div>2FA Accounts: {backupStats.dataSize.twoFactorAccounts}</div>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Created: {new Date(backupStats.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button 
                          onClick={async () => {
                            setBackupInProgress(true);
                            try {
                              const backup = BackupService.createFullBackup('Manual full system backup');
                              setBackupStats(BackupService.getBackupStats(backup));
                              BackupService.downloadBackup(backup);
                              alert('Full system backup created and downloaded successfully!');
                            } catch (error) {
                              alert('Failed to create backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
                            } finally {
                              setBackupInProgress(false);
                            }
                          }}
                          disabled={backupInProgress}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {backupInProgress ? 'Creating Backup...' : 'Create Full Backup'}
                        </button>
                        
                        <button 
                          onClick={async () => {
                            const dataTypes = ['products', 'orders', 'categories'];
                            setBackupInProgress(true);
                            try {
                              const backup = BackupService.createPartialBackup(dataTypes, 'Core business data backup');
                              BackupService.downloadBackup(backup);
                              alert('Core data backup created successfully!');
                            } catch (error) {
                              alert('Failed to create backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
                            } finally {
                              setBackupInProgress(false);
                            }
                          }}
                          disabled={backupInProgress}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Core Data Only
                        </button>
                      </div>
                    </div>

                    {/* System Restore */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Restore from Backup
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Restore your system from a previously created backup file. This will restore all data, settings, and configurations.
                      </p>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warning</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Restoring will overwrite all current data. A backup of your current state will be created automatically before restore.
                            </p>
                          </div>
                        </div>
                      </div>

                      <input
                        type="file"
                        accept=".json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setRestoreInProgress(true);
                            try {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                try {
                                  const backupData = JSON.parse(event.target?.result as string);
                                  
                                  // Validate backup before restore
                                  const isValid = BackupService.validateBackup(backupData);
                                  if (!isValid) {
                                    alert('Invalid backup file format! Please select a valid FilHub backup file.');
                                    setRestoreInProgress(false);
                                    return;
                                  }

                                  // Confirm restore operation
                                  const confirmed = confirm(
                                    `This will restore data from backup created on ${new Date(backupData.metadata.timestamp).toLocaleString()}.\n\n` +
                                    'Your current data will be backed up automatically before restore. Continue?'
                                  );

                                  if (confirmed) {
                                    const success = BackupService.restoreFromBackup(backupData);
                                    if (success) {
                                      alert('System restored successfully! The page will reload to apply changes.');
                                      window.location.reload();
                                    } else {
                                      alert('Restore failed! Your original data has been preserved.');
                                    }
                                  }
                                } catch (error) {
                                  alert('Failed to read backup file: ' + (error instanceof Error ? error.message : 'Unknown error'));
                                } finally {
                                  setRestoreInProgress(false);
                                }
                              };
                              reader.readAsText(file);
                            } catch (error) {
                              alert('Failed to process file: ' + (error instanceof Error ? error.message : 'Unknown error'));
                              setRestoreInProgress(false);
                            }
                          }
                        }}
                        disabled={restoreInProgress}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      
                      {restoreInProgress && (
                        <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing restore operation...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Theme & Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Theme & Appearance
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Theme Selection */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Theme Mode
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                          onClick={() => {
                            setTheme('light');
                            setSystemTheme(false);
                            localStorage.setItem('systemTheme', 'false');
                          }}
                          className={`relative p-4 border-2 rounded-lg transition-all ${
                            theme === 'light' && !systemTheme
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-8 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center">
                              <div className="w-8 h-4 bg-gray-100 rounded-sm"></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                          </div>
                          {theme === 'light' && !systemTheme && (
                            <div className="absolute top-2 right-2">
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setTheme('dark');
                            setSystemTheme(false);
                            localStorage.setItem('systemTheme', 'false');
                          }}
                          className={`relative p-4 border-2 rounded-lg transition-all ${
                            theme === 'dark' && !systemTheme
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-8 bg-gray-800 border border-gray-600 rounded shadow-sm flex items-center justify-center">
                              <div className="w-8 h-4 bg-gray-700 rounded-sm"></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                          </div>
                          {theme === 'dark' && !systemTheme && (
                            <div className="absolute top-2 right-2">
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            setTheme(prefersDark ? 'dark' : 'light');
                            setSystemTheme(true);
                            localStorage.setItem('systemTheme', 'true');
                            
                            // Set up system theme listener
                            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                            const handleChange = (e: MediaQueryListEvent) => {
                              setTheme(e.matches ? 'dark' : 'light');
                            };
                            mediaQuery.addEventListener('change', handleChange);
                          }}
                          className={`relative p-4 border-2 rounded-lg transition-all ${
                            systemTheme
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-8 relative overflow-hidden rounded shadow-sm border border-gray-200 dark:border-gray-600">
                              <div className="w-6 h-8 bg-white absolute left-0"></div>
                              <div className="w-6 h-8 bg-gray-800 absolute right-0"></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
                          </div>
                          {systemTheme && (
                            <div className="absolute top-2 right-2">
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Theme Colors */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Theme Colors
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Primary Color
                          </label>
                          <input
                            type="color"
                            value={themeColors.primary}
                            onChange={(e) => setThemeColors({...themeColors, primary: e.target.value})}
                            className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Secondary Color
                          </label>
                          <input
                            type="color"
                            value={themeColors.secondary}
                            onChange={(e) => setThemeColors({...themeColors, secondary: e.target.value})}
                            className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Accent Color
                          </label>
                          <input
                            type="color"
                            value={themeColors.accent}
                            onChange={(e) => setThemeColors({...themeColors, accent: e.target.value})}
                            className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-4">
                        <button 
                          onClick={() => {
                            localStorage.setItem('themeColors', JSON.stringify(themeColors));
                            // Apply colors to CSS custom properties
                            document.documentElement.style.setProperty('--color-primary', themeColors.primary);
                            document.documentElement.style.setProperty('--color-secondary', themeColors.secondary);
                            document.documentElement.style.setProperty('--color-accent', themeColors.accent);
                            
                            // Dispatch event to notify other components
                            window.dispatchEvent(new CustomEvent('themeColorsChanged', { 
                              detail: { colors: themeColors } 
                            }));
                            
                            alert('Theme colors saved and applied!');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Save & Apply Colors
                        </button>
                        
                        <button 
                          onClick={() => {
                            const defaultColors = {
                              primary: '#1e40af',
                              secondary: '#fbbf24',
                              accent: '#10b981'
                            };
                            setThemeColors(defaultColors);
                            localStorage.setItem('themeColors', JSON.stringify(defaultColors));
                            
                            // Reset CSS custom properties
                            document.documentElement.style.setProperty('--color-primary', defaultColors.primary);
                            document.documentElement.style.setProperty('--color-secondary', defaultColors.secondary);
                            document.documentElement.style.setProperty('--color-accent', defaultColors.accent);
                            
                            alert('Theme colors reset to default!');
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Reset to Default
                        </button>
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Custom Logo
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Upload a custom logo for your FilHub Enterprise system. This will replace the default logo in the navigation.
                      </p>
                      
                      {customLogo && (
                        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Current Logo Preview</h4>
                          <div className="flex items-center space-x-4">
                            <img 
                              src={customLogo} 
                              alt="Custom Logo" 
                              className="h-12 w-auto max-w-32 object-contain border border-gray-200 dark:border-gray-600 rounded"
                            />
                            <button
                              onClick={() => {
                                setCustomLogo(null);
                                localStorage.removeItem('customLogo');
                                // Dispatch event to notify other components
                                window.dispatchEvent(new CustomEvent('logoChanged', { detail: { logo: null } }));
                                alert('Custom logo removed!');
                              }}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Remove Logo
                            </button>
                          </div>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (max 2MB)
                            if (file.size > 2 * 1024 * 1024) {
                              alert('File size must be less than 2MB');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const logoData = event.target?.result as string;
                              setCustomLogo(logoData);
                              localStorage.setItem('customLogo', logoData);
                              
                              // Dispatch event to notify other components
                              window.dispatchEvent(new CustomEvent('logoChanged', { detail: { logo: logoData } }));
                              
                              alert('Logo uploaded successfully!');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                      />
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Supported formats: PNG, JPG, GIF, SVG. Maximum file size: 2MB. Recommended dimensions: 200x60px.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {showTwoFactorSetup && (
        <TwoFactorSetupComponent
          onComplete={(enabled) => {
            setTwoFactorEnabled(enabled);
            setShowTwoFactorSetup(false);
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}

      {/* 2FA Disable Confirmation Modal */}
      {show2FADisableConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Disable Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to disable two-factor authentication? This will make your account less secure.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShow2FADisableConfirm(false)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (user?.email) {
                    TwoFactorAuthService.disable2FA(user.email);
                    setTwoFactorEnabled(false);
                    setShow2FADisableConfirm(false);
                    alert('Two-factor authentication has been disabled.');
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
