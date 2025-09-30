import { 
  categoriesAPI, 
  productsAPI, 
  ordersAPI, 
  customersAPI, 
  usersAPI 
} from '../services/api';

interface MigrationResult {
  success: boolean;
  message: string;
  details: {
    categories: { success: number; failed: number; };
    products: { success: number; failed: number; };
    customers: { success: number; failed: number; };
    orders: { success: number; failed: number; };
    users: { success: number; failed: number; };
  };
}

export class DataMigrationService {
  
  /**
   * Migrate all localStorage data to backend database
   */
  static async migrateAllData(): Promise<MigrationResult> {
    console.log('🚀 Starting data migration from localStorage to database...');
    
    const result: MigrationResult = {
      success: false,
      message: '',
      details: {
        categories: { success: 0, failed: 0 },
        products: { success: 0, failed: 0 },
        customers: { success: 0, failed: 0 },
        orders: { success: 0, failed: 0 },
        users: { success: 0, failed: 0 }
      }
    };

    try {
      // 1. Migrate Categories first (products depend on categories)
      console.log('📁 Migrating categories...');
      await this.migrateCategories(result);

      // 2. Migrate Products (orders depend on products)
      console.log('📦 Migrating products...');
      await this.migrateProducts(result);

      // 3. Migrate Customers (orders depend on customers)
      console.log('👥 Migrating customers...');
      await this.migrateCustomers(result);

      // 4. Migrate Users
      console.log('🔐 Migrating users...');
      await this.migrateUsers(result);

      // 5. Migrate Orders last (depends on products and customers)
      console.log('📋 Migrating orders...');
      await this.migrateOrders(result);

      // Calculate overall success
      const totalSuccess = Object.values(result.details).reduce((sum, item) => sum + item.success, 0);
      const totalFailed = Object.values(result.details).reduce((sum, item) => sum + item.failed, 0);
      
      result.success = totalFailed === 0;
      result.message = `Migration completed: ${totalSuccess} items migrated successfully, ${totalFailed} failed`;
      
      console.log('✅ Migration completed:', result.message);
      return result;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.success = false;
      result.message = `Migration failed: ${error}`;
      return result;
    }
  }

  /**
   * Migrate categories from localStorage to database
   */
  private static async migrateCategories(result: MigrationResult): Promise<void> {
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    for (const category of categories) {
      try {
        const categoryData = {
          name: category.name,
          description: category.description || '',
          status: category.status || 'active'
        };
        
        await categoriesAPI.create(categoryData);
        result.details.categories.success++;
        console.log(`✅ Category migrated: ${category.name}`);
      } catch (error) {
        result.details.categories.failed++;
        console.error(`❌ Failed to migrate category: ${category.name}`, error);
      }
    }
  }

  /**
   * Migrate products from localStorage to database
   */
  private static async migrateProducts(result: MigrationResult): Promise<void> {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    for (const product of products) {
      try {
        // Create FormData for product creation
        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('description', product.description || '');
        formData.append('sku', product.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        formData.append('category_id', String(product.category_id || 1));
        formData.append('cost_price', String(product.cost_price || product.costPrice || 0));
        formData.append('selling_price', String(product.selling_price || product.sellingPrice || product.price || 0));
        formData.append('stock_quantity', String(product.stock_quantity || product.stock || 0));
        formData.append('low_stock_alert', String(product.low_stock_alert || product.lowStockThreshold || 10));
        formData.append('status', product.status || 'active');
        if (product.image_url || product.image) {
          formData.append('image_url', product.image_url || product.image);
        }
        
        // Add uniform-specific fields if they exist
        if (product.uniform_size) {
          formData.append('uniform_size', product.uniform_size);
        }
        if (product.uniform_gender) {
          formData.append('uniform_gender', product.uniform_gender);
        }
        
        await productsAPI.create(formData);
        result.details.products.success++;
        console.log(`✅ Product migrated: ${product.name}`);
      } catch (error) {
        result.details.products.failed++;
        console.error(`❌ Failed to migrate product: ${product.name}`, error);
      }
    }
  }

  /**
   * Migrate customers from localStorage to database
   */
  private static async migrateCustomers(result: MigrationResult): Promise<void> {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    for (const customer of customers) {
      try {
        const customerData = {
          name: customer.name,
          email: customer.email || `customer${customer.id}@example.com`,
          phone: customer.phone || '',
          address: customer.address || '',
          education_level: customer.education_level || '',
          year: customer.year || '',
          grade_level: customer.grade_level || '',
          section: customer.section || '',
          strand: customer.strand || '',
          college: customer.college || '',
          course: customer.course || '',
          educational_summary: customer.educational_summary || ''
        };
        
        await customersAPI.create(customerData);
        result.details.customers.success++;
        console.log(`✅ Customer migrated: ${customer.name}`);
      } catch (error) {
        result.details.customers.failed++;
        console.error(`❌ Failed to migrate customer: ${customer.name}`, error);
      }
    }
  }

  /**
   * Migrate users from localStorage to database
   */
  private static async migrateUsers(result: MigrationResult): Promise<void> {
    const users = JSON.parse(localStorage.getItem('filhub_users') || '[]');
    
    for (const user of users) {
      try {
        // Skip default admin/cashier users (they should already exist)
        if (user.email === 'admin@filhub.com' || user.email === 'cashier@filhub.com') {
          console.log(`⏭️ Skipping default user: ${user.email}`);
          continue;
        }

        const userData = {
          name: user.name,
          email: user.email,
          password: user.password || 'defaultpassword123',
          password_confirmation: user.password || 'defaultpassword123',
          phone: user.phone || '',
          address: user.address || '',
          role: user.role || 'user'
        };
        
        await usersAPI.create(userData);
        result.details.users.success++;
        console.log(`✅ User migrated: ${user.name}`);
      } catch (error) {
        result.details.users.failed++;
        console.error(`❌ Failed to migrate user: ${user.name}`, error);
      }
    }
  }

  /**
   * Migrate orders from localStorage to database
   */
  private static async migrateOrders(result: MigrationResult): Promise<void> {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    for (const order of orders) {
      try {
        const orderData = {
          customer_id: order.customer_id || 1, // Default customer
          items: order.items || [],
          paid_amount: order.total_amount || order.total || 0,
          discount_amount: order.discount_amount || 0,
          tax_amount: order.tax_amount || 0,
          notes: order.notes || '',
          order_status: order.order_status || order.status || 'completed'
        };
        
        await ordersAPI.create(orderData);
        result.details.orders.success++;
        console.log(`✅ Order migrated: Order #${order.id}`);
      } catch (error) {
        result.details.orders.failed++;
        console.error(`❌ Failed to migrate order: Order #${order.id}`, error);
      }
    }
  }

  /**
   * Check if backend API is available
   */
  static async checkBackendAvailability(): Promise<boolean> {
    try {
      await categoriesAPI.getAll();
      return true;
    } catch {
      console.log('Backend API not available for migration');
      return false;
    }
  }

  /**
   * Get localStorage data summary
   */
  static getLocalStorageDataSummary() {
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = JSON.parse(localStorage.getItem('filhub_users') || '[]');

    return {
      categories: categories.length,
      products: products.length,
      customers: customers.length,
      orders: orders.length,
      users: users.length,
      totalItems: categories.length + products.length + customers.length + orders.length + users.length
    };
  }
}
