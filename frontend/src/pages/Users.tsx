import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usersAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  password: string;
}

const Users: React.FC = () => {
  const { role } = useAuth();
  const { theme } = useTheme();
  
  // Create default users function
  const createDefaultUsers = () => {
    const defaultUsers = [
      { id: 1, name: 'Admin User', email: 'admin@filhub.com', role: 'admin', status: 'active', password: 'admin123' },
      { id: 2, name: 'Cashier User', email: 'cashier@filhub.com', role: 'cashier', status: 'active', password: 'cashier123' }
    ];
    localStorage.setItem('filhub_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  };

  const [users, setUsers] = useState<User[]>(() => {
    // Initialize with localStorage data or default users immediately
    const saved = localStorage.getItem('filhub_users');
    console.log('Loading users from localStorage:', saved);
    
    if (saved) {
      try {
        const parsedUsers = JSON.parse(saved);
        console.log('Parsed users:', parsedUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          return parsedUsers;
        }
      } catch (error) {
        console.error('Error parsing saved users:', error);
      }
    }
    
    // Create default users if none exist or parsing failed
    console.log('Creating default users...');
    const defaultUsers = createDefaultUsers();
    console.log('Default users created:', defaultUsers);
    return defaultUsers;
  });
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'cashier',
    password: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch users from backend API with localStorage fallback
  const fetchUsers = async () => {
    try {
      setLoading(true);

      try {
        // Try to fetch from backend API first
        const response = await usersAPI.getAll({ per_page: 1000 });
        if (response && response.data) {
          const backendUsers = Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
          console.log('Users loaded from backend API:', backendUsers);
          
          // Update with backend data
          setUsers(backendUsers);
          localStorage.setItem('filhub_users', JSON.stringify(backendUsers));
        }
      } catch (apiError) {
        console.log('Backend API failed, keeping existing localStorage users:', apiError);
        // Don't change existing users if API fails - they're already loaded from localStorage in useState
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async () => {
    if (newUser.name && newUser.email && newUser.password) {
      try {
        let backendUserId = null;

        // Try to create user in backend first
        try {
          const response = await usersAPI.create({
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            password_confirmation: newUser.password,
            role: newUser.role,
            status: 'active'
          });
          backendUserId = response.data.id;
          console.log('User created in backend successfully:', backendUserId);
        } catch (apiError) {
          console.log('Backend API failed for user creation, using localStorage fallback:', apiError);
        }

        // Update locally (fallback/sync)
        const newId = backendUserId || (Math.max(...users.map(u => u.id)) + 1);
        const newUserData = {...newUser, id: newId, status: 'active'};
        const updatedUsers = [...users, newUserData];
        
        setUsers(updatedUsers);
        localStorage.setItem('filhub_users', JSON.stringify(updatedUsers));
        
        setNewUser({name: '', email: '', role: 'cashier', password: ''});
        alert('User added successfully!');
      } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user. Please try again.');
      }
    } else {
      alert('Please fill all fields');
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        // Try to delete from backend first
        try {
          await usersAPI.delete(userId);
          console.log('User deleted from backend successfully');
        } catch (apiError) {
          console.log('Backend API failed for user deletion, using localStorage fallback:', apiError);
        }

        // Update locally (fallback/sync)
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        localStorage.setItem('filhub_users', JSON.stringify(updatedUsers));
        
        alert('User removed successfully!');
      } catch (error) {
        console.error('Error removing user:', error);
        alert('Error removing user. Please try again.');
      }
    }
  };

  const handleToggleStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? {...user, status: user.status === 'active' ? 'inactive' : 'active'}
        : user
    ));
  };

  // Only admins can access user management
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access user management.</p>
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
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>User Management</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage user accounts, roles, and permissions</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} font-medium`}>
              <span className="mr-2">🔒</span>
              Admin Only
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Modern Add New User Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm mb-6`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                <span className="text-lg">➕</span>
              </div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add New User</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const defaultUsers = createDefaultUsers();
                  setUsers(defaultUsers);
                  alert('Default users restored!\n\nAdmin: admin@filhub.com / admin123\nCashier: cashier@filhub.com / cashier123');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' 
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                🔄 Reset to Default Users
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="👤 Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
              <input
                type="email"
                placeholder="📧 Email Address"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              >
                <option value="cashier">👨‍💼 Cashier</option>
                <option value="admin">👑 Admin</option>
              </select>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="🔒 Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className={`px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? (
                    <span className="text-lg">🙈</span>
                  ) : (
                    <span className="text-lg">👁️</span>
                  )}
                </button>
              </div>
            </div>
            <button 
              onClick={handleAddUser}
              className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center"
            >
              <span className="mr-2">➕</span>
              Add User
            </button>
          </div>
        </div>

        {/* Modern Search and Filter Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm mb-6`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                  <span className="text-lg">🔍</span>
                </div>
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Search & Filter Users</h2>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {filteredUsers.length} users
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              >
                <option value="all">🌐 All Roles</option>
                <option value="admin">👑 Admin</option>
                <option value="cashier">👨‍💼 Cashier</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern Users List */}
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border backdrop-blur-sm overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <span className="text-lg">👥</span>
              </div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Users ({filteredUsers.length})
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center space-x-2">
                      <span>👤</span>
                      <span>User</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center space-x-2">
                      <span>🎭</span>
                      <span>Role</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center space-x-2">
                      <span>🟢</span>
                      <span>Status</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center space-x-2">
                      <span>⚙️</span>
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' 
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleToggleStatus(user.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                              user.status === 'active'
                                ? (theme === 'dark' ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200')
                                : (theme === 'dark' ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200')
                            }`}
                          >
                            {user.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
                          </button>
                          <button 
                            onClick={() => handleRemoveUser(user.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
          `
        }} />
      </div>
    </div>
  );
};

export default Users;
