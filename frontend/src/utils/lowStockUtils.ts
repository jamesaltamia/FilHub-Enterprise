export interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  category?: string;
  [key: string]: any;
}

export class LowStockService {
  /**
   * Get the current low stock threshold from localStorage
   */
  static getLowStockThreshold(): number {
    const saved = localStorage.getItem('lowStockThreshold');
    return saved ? parseInt(saved) : 5;
  }

  /**
   * Check if a product is low in stock
   */
  static isLowStock(product: Product): boolean {
    const threshold = this.getLowStockThreshold();
    return product.stock <= threshold;
  }

  /**
   * Get all low stock products from a list
   */
  static getLowStockProducts(products: Product[]): Product[] {
    return products.filter(product => this.isLowStock(product));
  }

  /**
   * Get low stock count from a list of products
   */
  static getLowStockCount(products: Product[]): number {
    return this.getLowStockProducts(products).length;
  }

  /**
   * Get low stock alert level (critical, warning, normal)
   */
  static getStockAlertLevel(stock: number): 'critical' | 'warning' | 'normal' {
    const threshold = this.getLowStockThreshold();
    
    if (stock === 0) return 'critical';
    if (stock <= threshold) return 'warning';
    return 'normal';
  }

  /**
   * Get stock status color classes for UI
   */
  static getStockStatusClasses(stock: number): string {
    const level = this.getStockAlertLevel(stock);
    
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  }

  /**
   * Get stock status text
   */
  static getStockStatusText(stock: number): string {
    const level = this.getStockAlertLevel(stock);
    
    switch (level) {
      case 'critical':
        return 'Out of Stock';
      case 'warning':
        return 'Low Stock';
      default:
        return 'In Stock';
    }
  }

  /**
   * Generate low stock alert message
   */
  static generateLowStockAlert(products: Product[]): string | null {
    const lowStockProducts = this.getLowStockProducts(products);
    
    if (lowStockProducts.length === 0) return null;
    
    const threshold = this.getLowStockThreshold();
    const outOfStock = lowStockProducts.filter(p => p.stock === 0);
    
    if (outOfStock.length > 0) {
      return `${outOfStock.length} product(s) are out of stock and ${lowStockProducts.length - outOfStock.length} are below the threshold of ${threshold}.`;
    }
    
    return `${lowStockProducts.length} product(s) are below the low stock threshold of ${threshold}.`;
  }

  /**
   * Listen for threshold changes
   */
  static onThresholdChange(callback: (threshold: number) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.threshold);
    };
    
    window.addEventListener('lowStockThresholdChanged', handler as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('lowStockThresholdChanged', handler as EventListener);
    };
  }
}
