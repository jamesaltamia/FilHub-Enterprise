// Type definitions for backup data
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
}

interface Order {
  id: number;
  customerName: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  date: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface UserData {
  id?: number;
  name: string;
  email: string;
  role: string;
}

interface TwoFactorData {
  secret?: string;
  enabled: boolean;
  backupCodes?: string[];
}

interface ThemeSettings {
  theme: 'light' | 'dark';
  systemTheme?: boolean;
  customColors?: Record<string, string>;
}

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface BackupData {
  metadata: {
    version: string;
    timestamp: string;
    appVersion: string;
    backupType: 'full' | 'partial';
    description?: string;
  };
  core: {
    products: Product[];
    orders: Order[];
    categories: Category[];
  };
  users: {
    userData: UserData;
    userSettings: Record<string, unknown>;
    twoFactorData: { [email: string]: TwoFactorData };
  };
  settings: {
    lowStockThreshold: number;
    themeSettings: ThemeSettings;
    customColors: Record<string, string>;
    customLogo: string | null;
  };
  system: {
    permissions: string[];
    roles: Role[];
    appConfig: Record<string, unknown>;
  };
}

export class BackupService {
  private static readonly BACKUP_VERSION = '1.0.0';
  private static readonly APP_VERSION = '1.0.0';

  /**
   * Create a comprehensive backup of all system data
   */
  static createFullBackup(description?: string): BackupData {
    const timestamp = new Date().toISOString();
    
    // Core business data
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');

    // User data
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    const userSettings = {
      personalInfo: userData ? {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address
      } : null
    };

    // Collect all 2FA data
    const twoFactorData: { [email: string]: TwoFactorData } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('2fa_')) {
        const email = key.replace('2fa_', '');
        twoFactorData[email] = JSON.parse(localStorage.getItem(key) || '{"enabled": false}');
      }
    }

    // System settings
    const lowStockThreshold = parseInt(localStorage.getItem('lowStockThreshold') || '5');
    const currentTheme = localStorage.getItem('theme') || 'light';
    const themeSettings: ThemeSettings = {
      theme: currentTheme as 'light' | 'dark',
      systemTheme: localStorage.getItem('systemTheme') === 'true'
    };
    const customColors = JSON.parse(localStorage.getItem('themeColors') || '{}');
    const customLogo = localStorage.getItem('customLogo');

    // System configuration
    const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const role = localStorage.getItem('role');

    const backup: BackupData = {
      metadata: {
        version: this.BACKUP_VERSION,
        timestamp,
        appVersion: this.APP_VERSION,
        backupType: 'full',
        description: description || `Full system backup created on ${new Date().toLocaleString()}`
      },
      core: {
        products,
        orders,
        categories
      },
      users: {
        userData,
        userSettings,
        twoFactorData
      },
      settings: {
        lowStockThreshold,
        themeSettings,
        customColors,
        customLogo
      },
      system: {
        permissions,
        roles,
        appConfig: {
          token,
          role
        }
      }
    };

    return backup;
  }

  /**
   * Download backup as JSON file
   */
  static downloadBackup(backup: BackupData, filename?: string): void {
    const defaultFilename = `filhub-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    const finalFilename = filename || defaultFilename;

    const backupJson = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate backup data structure
   */
  static validateBackup(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Type guard to check if data is an object
    if (!data || typeof data !== 'object') {
      errors.push('Invalid backup data format');
      return { isValid: false, errors };
    }

    const backup = data as Record<string, unknown>;

    // Check required structure
    if (!backup.metadata || typeof backup.metadata !== 'object') {
      errors.push('Missing metadata section');
    } else {
      const metadata = backup.metadata as Record<string, unknown>;
      if (!metadata.version) errors.push('Missing backup version');
      if (!metadata.timestamp) errors.push('Missing backup timestamp');
    }

    if (!backup.core || typeof backup.core !== 'object') {
      errors.push('Missing core data section');
    } else {
      const core = backup.core as Record<string, unknown>;
      if (!Array.isArray(core.products)) errors.push('Invalid products data');
      if (!Array.isArray(core.orders)) errors.push('Invalid orders data');
      if (!Array.isArray(core.categories)) errors.push('Invalid categories data');
    }

    if (!backup.users || typeof backup.users !== 'object') {
      errors.push('Missing users section');
    }

    if (!backup.settings || typeof backup.settings !== 'object') {
      errors.push('Missing settings section');
    }

    if (!backup.system || typeof backup.system !== 'object') {
      errors.push('Missing system section');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Restore system from backup data
   */
  static restoreFromBackup(backup: BackupData): { success: boolean; message: string; errors?: string[] } {
    try {
      // Validate backup first
      const validation = this.validateBackup(backup);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Invalid backup file format',
          errors: validation.errors
        };
      }

      // Create restore point (current data backup)
      const restorePoint = this.createFullBackup('Pre-restore backup');
      localStorage.setItem('restorePoint', JSON.stringify(restorePoint));

      // Restore core business data
      if (backup.core.products) {
        localStorage.setItem('products', JSON.stringify(backup.core.products));
      }
      if (backup.core.orders) {
        localStorage.setItem('orders', JSON.stringify(backup.core.orders));
      }
      if (backup.core.categories) {
        localStorage.setItem('categories', JSON.stringify(backup.core.categories));
      }

      // Restore user data
      if (backup.users.userData) {
        localStorage.setItem('user', JSON.stringify(backup.users.userData));
      }

      // Restore 2FA data
      if (backup.users.twoFactorData) {
        Object.entries(backup.users.twoFactorData).forEach(([email, data]) => {
          localStorage.setItem(`2fa_${email}`, JSON.stringify(data));
        });
      }

      // Restore settings
      if (backup.settings.lowStockThreshold !== undefined) {
        localStorage.setItem('lowStockThreshold', backup.settings.lowStockThreshold.toString());
      }
      if (backup.settings.themeSettings) {
        if (backup.settings.themeSettings.theme) {
          localStorage.setItem('theme', backup.settings.themeSettings.theme);
        }
        if (backup.settings.themeSettings.systemTheme !== undefined) {
          localStorage.setItem('systemTheme', backup.settings.themeSettings.systemTheme.toString());
        }
      }
      if (backup.settings.customColors) {
        localStorage.setItem('themeColors', JSON.stringify(backup.settings.customColors));
      }
      if (backup.settings.customLogo) {
        localStorage.setItem('customLogo', backup.settings.customLogo);
      }

      // Restore system configuration
      if (backup.system.permissions) {
        localStorage.setItem('permissions', JSON.stringify(backup.system.permissions));
      }
      if (backup.system.roles) {
        localStorage.setItem('roles', JSON.stringify(backup.system.roles));
      }
      if (backup.system.appConfig) {
        const appConfig = backup.system.appConfig as { token?: string; role?: string };
        if (appConfig.token) {
          localStorage.setItem('token', appConfig.token);
          localStorage.setItem('auth_token', appConfig.token);
        }
        if (appConfig.role) {
          localStorage.setItem('role', appConfig.role);
        }
      }

      // Trigger events to notify components of data changes
      window.dispatchEvent(new CustomEvent('dataRestored', { detail: { backup } }));
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
      window.dispatchEvent(new CustomEvent('lowStockThresholdChanged', { 
        detail: { threshold: backup.settings.lowStockThreshold } 
      }));

      return {
        success: true,
        message: `Successfully restored backup from ${new Date(backup.metadata.timestamp).toLocaleString()}`
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to restore backup: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Get backup statistics
   */
  static getBackupStats(backup: BackupData): {
    timestamp: string;
    version: string;
    dataSize: {
      products: number;
      orders: number;
      categories: number;
      twoFactorAccounts: number;
    };
  } {
    return {
      timestamp: backup.metadata.timestamp,
      version: backup.metadata.version,
      dataSize: {
        products: backup.core.products?.length || 0,
        orders: backup.core.orders?.length || 0,
        categories: backup.core.categories?.length || 0,
        twoFactorAccounts: Object.keys(backup.users.twoFactorData || {}).length
      }
    };
  }

  /**
   * Create partial backup of specific data types
   */
  static createPartialBackup(dataTypes: string[], description?: string): BackupData {
    const fullBackup = this.createFullBackup();
    const partialBackup: BackupData = {
      ...fullBackup,
      metadata: {
        ...fullBackup.metadata,
        backupType: 'partial',
        description: description || `Partial backup: ${dataTypes.join(', ')}`
      }
    };

    // Clear data not requested
    if (!dataTypes.includes('products')) partialBackup.core.products = [];
    if (!dataTypes.includes('orders')) partialBackup.core.orders = [];
    if (!dataTypes.includes('categories')) partialBackup.core.categories = [];
    if (!dataTypes.includes('users')) {
      partialBackup.users.userData = { name: '', email: '', role: '' };
      partialBackup.users.userSettings = {};
    }
    if (!dataTypes.includes('2fa')) partialBackup.users.twoFactorData = {};
    if (!dataTypes.includes('settings')) {
      partialBackup.settings = {
        lowStockThreshold: 5,
        themeSettings: { theme: 'light' },
        customColors: {},
        customLogo: null
      };
    }

    return partialBackup;
  }

  /**
   * Get restore point (backup created before last restore)
   */
  static getRestorePoint(): BackupData | null {
    const restorePoint = localStorage.getItem('restorePoint');
    return restorePoint ? JSON.parse(restorePoint) : null;
  }

  /**
   * Clear restore point
   */
  static clearRestorePoint(): void {
    localStorage.removeItem('restorePoint');
  }
}
