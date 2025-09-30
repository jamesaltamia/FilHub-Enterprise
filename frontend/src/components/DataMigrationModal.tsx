import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { DataMigrationService } from '../utils/dataMigration';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataMigrationModal: React.FC<DataMigrationModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Get localStorage data summary
      const summary = DataMigrationService.getLocalStorageDataSummary();
      setDataSummary(summary);
      
      // Check backend availability
      checkBackend();
    }
  }, [isOpen]);

  const checkBackend = async () => {
    const available = await DataMigrationService.checkBackendAvailability();
    setBackendAvailable(available);
  };

  const handleMigration = async () => {
    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const result = await DataMigrationService.migrateAllData();
      setMigrationResult(result);
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Migration failed: ${error}`,
        details: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">📊 Data Migration</h2>
            <button
              onClick={onClose}
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} text-2xl`}
            >
              ×
            </button>
          </div>

          {/* Backend Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🔌 Backend Status</h3>
            <div className={`p-4 rounded-lg ${backendAvailable === null ? 'bg-yellow-100 text-yellow-800' : backendAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {backendAvailable === null && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  Checking backend availability...
                </div>
              )}
              {backendAvailable === true && (
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  Backend API is available and ready for migration
                </div>
              )}
              {backendAvailable === false && (
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">❌</span>
                  Backend API is not available. Please ensure the Laravel server is running and CORS is configured.
                </div>
              )}
            </div>
          </div>

          {/* Data Summary */}
          {dataSummary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">📋 localStorage Data Summary</h3>
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dataSummary.categories}</div>
                    <div className="text-sm">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dataSummary.products}</div>
                    <div className="text-sm">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{dataSummary.customers}</div>
                    <div className="text-sm">Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{dataSummary.orders}</div>
                    <div className="text-sm">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{dataSummary.users}</div>
                    <div className="text-sm">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{dataSummary.totalItems}</div>
                    <div className="text-sm">Total Items</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Migration Button */}
          <div className="mb-6">
            <button
              onClick={handleMigration}
              disabled={isLoading || !backendAvailable || (dataSummary && dataSummary.totalItems === 0)}
              className={`w-full py-3 px-4 rounded-lg font-semibold ${
                isLoading || !backendAvailable || (dataSummary && dataSummary.totalItems === 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Migrating Data...
                </div>
              ) : (
                '🚀 Start Migration'
              )}
            </button>
            
            {!backendAvailable && (
              <p className="text-sm text-red-600 mt-2 text-center">
                Backend API must be available to perform migration
              </p>
            )}
            
            {dataSummary && dataSummary.totalItems === 0 && (
              <p className="text-sm text-yellow-600 mt-2 text-center">
                No data found in localStorage to migrate
              </p>
            )}
          </div>

          {/* Migration Results */}
          {migrationResult && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">📊 Migration Results</h3>
              <div className={`p-4 rounded-lg ${migrationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center mb-2">
                  <span className="mr-2">{migrationResult.success ? '✅' : '❌'}</span>
                  <span className="font-semibold">{migrationResult.message}</span>
                </div>
                
                {migrationResult.details && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(migrationResult.details).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="capitalize">{key}:</span>
                        <span>
                          <span className="text-green-700 font-semibold">{value.success} success</span>
                          {value.failed > 0 && (
                            <span className="text-red-700 font-semibold ml-2">{value.failed} failed</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className={`${theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-50 text-yellow-800'} p-4 rounded-lg`}>
            <div className="flex items-start">
              <span className="text-yellow-600 mr-2 mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="text-sm space-y-1">
                  <li>• This will copy all localStorage data to the backend database</li>
                  <li>• Existing database data may be duplicated</li>
                  <li>• Make sure the backend server is running</li>
                  <li>• Migration may take a few minutes for large datasets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMigrationModal;
