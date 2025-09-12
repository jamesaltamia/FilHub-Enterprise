import React, { useState, useEffect } from 'react';
import { LowStockService, type Product } from '../utils/lowStockUtils';

interface LowStockAlertProps {
  products?: Product[];
  showCount?: boolean;
  className?: string;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ 
  products = [], 
  showCount = true, 
  className = '' 
}) => {
  const [threshold, setThreshold] = useState(LowStockService.getLowStockThreshold());
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Listen for threshold changes
    const cleanup = LowStockService.onThresholdChange((newThreshold) => {
      setThreshold(newThreshold);
    });

    return cleanup;
  }, []);

  useEffect(() => {
    setLowStockProducts(LowStockService.getLowStockProducts(products));
  }, [products, threshold]);

  if (lowStockProducts.length === 0) return null;

  const outOfStockCount = lowStockProducts.filter(p => p.stock === 0).length;
  const lowStockCount = lowStockProducts.length - outOfStockCount;

  return (
    <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Low Stock Alert
          </h4>
          <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {outOfStockCount > 0 && (
              <p className="mb-1">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {outOfStockCount} product{outOfStockCount !== 1 ? 's' : ''} out of stock
                </span>
              </p>
            )}
            {lowStockCount > 0 && (
              <p>
                {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} below threshold of {threshold}
              </p>
            )}
          </div>
          {showCount && lowStockProducts.length > 0 && (
            <div className="mt-2">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100">
                  View affected products ({lowStockProducts.length})
                </summary>
                <div className="mt-2 space-y-1">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex justify-between items-center text-xs bg-yellow-100 dark:bg-yellow-800/30 rounded px-2 py-1">
                      <span className="font-medium">{product.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        product.stock === 0 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStockAlert;
export { LowStockAlert };
