import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types for Canteen Rental System
export interface Tenant {
  id: number;
  name: string;
  contact_number: string;
  email?: string;
  business_name: string;
  business_type: string;
  created_at: string;
  updated_at: string;
}

export interface Stall {
  id: number;
  stall_number: number;
  stall_name: string;
  monthly_rent: number;
  is_occupied: boolean;
  tenant_id?: number;
  tenant?: Tenant;
  created_at: string;
  updated_at: string;
}

export interface RentalPayment {
  id: number;
  stall_id: number;
  tenant_id: number;
  month: string; // Format: YYYY-MM
  year: number;
  amount: number;
  payment_date?: string;
  due_date: string;
  is_paid: boolean;
  payment_method?: string;
  notes?: string;
  late_fee?: number;
  created_at: string;
  updated_at: string;
  stall?: Stall;
  tenant?: Tenant;
}

export interface RentalContract {
  id: number;
  stall_id: number;
  tenant_id: number;
  start_date: string;
  end_date?: string;
  monthly_rent: number;
  deposit_amount: number;
  is_active: boolean;
  contract_terms?: string;
  created_at: string;
  updated_at: string;
  stall?: Stall;
  tenant?: Tenant;
}

class CanteenRentalAPI {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for authentication
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Set shorter timeout for faster fallback to localStorage
      config.timeout = 3000; // 3 seconds instead of default
      return config;
    });
  }

  // Stall Management
  async getStalls(): Promise<Stall[]> {
    try {
      console.log('Fetching stalls from database...');
      const response = await this.api.get('/canteen/stalls');
      console.log('Stalls fetched from database successfully');
      
      // Sync to localStorage for offline access
      localStorage.setItem('canteen_stalls', JSON.stringify(response.data));
      return response.data;
    } catch {
      console.log('Database fetch failed, using localStorage fallback');
      return this.getStallsFromLocalStorage();
    }
  }

  async getStall(id: number): Promise<Stall> {
    try {
      const response = await this.api.get(`/canteen/stalls/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error - falling back to localStorage:', error);
      const stalls = this.getStallsFromLocalStorage();
      const stall = stalls.find(s => s.id === id);
      if (!stall) throw new Error('Stall not found');
      return stall;
    }
  }

  async updateStall(id: number, data: Partial<Stall>): Promise<Stall> {
    try {
      console.log('Updating stall in database...');
      const response = await this.api.put(`/canteen/stalls/${id}`, data);
      console.log('Stall updated in database successfully');
      
      // Update localStorage cache
      const stalls = this.getStallsFromLocalStorage();
      const index = stalls.findIndex(s => s.id === id);
      if (index !== -1) {
        stalls[index] = { ...stalls[index], ...response.data };
        localStorage.setItem('canteen_stalls', JSON.stringify(stalls));
      }
      
      return response.data;
    } catch (error) {
      console.log('Database update failed, using localStorage fallback');
      return this.updateStallInLocalStorage(id, data);
    }
  }

  // Tenant Management
  async getTenants(): Promise<Tenant[]> {
    try {
      console.log('Fetching tenants from database...');
      const response = await this.api.get('/canteen/tenants');
      console.log('Tenants fetched from database successfully');
      
      // Sync to localStorage for offline access
      localStorage.setItem('canteen_tenants', JSON.stringify(response.data));
      return response.data;
    } catch {
      console.log('Database fetch failed, using localStorage fallback');
      return this.getTenantsFromLocalStorage();
    }
  }

  async createTenant(data: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Promise<Tenant> {
    try {
      console.log('Creating tenant in database...');
      const response = await this.api.post('/canteen/tenants', data);
      console.log('Tenant created in database successfully');
      
      // Update localStorage cache
      const tenants = this.getTenantsFromLocalStorage();
      tenants.push(response.data);
      localStorage.setItem('canteen_tenants', JSON.stringify(tenants));
      
      return response.data;
    } catch {
      console.log('Database create failed, using localStorage fallback');
      return this.createTenantInLocalStorage(data);
    }
  }

  async updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
    try {
      const response = await this.api.put(`/canteen/tenants/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API Error - falling back to localStorage:', error);
      return this.updateTenantInLocalStorage(id, data);
    }
  }

  async deleteTenant(id: number): Promise<void> {
    try {
      await this.api.delete(`/canteen/tenants/${id}`);
    } catch (error) {
      console.error('API Error - falling back to localStorage:', error);
      this.deleteTenantFromLocalStorage(id);
    }
  }

  // Rental Contract Management
  async getContracts(): Promise<RentalContract[]> {
    try {
      console.log('Fetching contracts from database...');
      const response = await this.api.get('/canteen/contracts');
      console.log('Contracts fetched from database successfully');
      
      // Sync to localStorage for offline access
      localStorage.setItem('canteen_contracts', JSON.stringify(response.data));
      return response.data;
    } catch {
      console.log('Database fetch failed, using localStorage fallback');
      return this.getContractsFromLocalStorage();
    }
  }

  async createContract(data: Omit<RentalContract, 'id' | 'created_at' | 'updated_at'>): Promise<RentalContract> {
    try {
      console.log('Creating contract in database...');
      const response = await this.api.post('/canteen/contracts', data);
      console.log('Contract created in database successfully');
      
      // Update localStorage cache
      const contracts = this.getContractsFromLocalStorage();
      contracts.push(response.data);
      localStorage.setItem('canteen_contracts', JSON.stringify(contracts));
      
      return response.data;
    } catch {
      console.log('Database create failed, using localStorage fallback');
      return this.createContractInLocalStorage(data);
    }
  }

  async updateContract(id: number, data: Partial<RentalContract>): Promise<RentalContract> {
    try {
      const response = await this.api.put(`/canteen/contracts/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API Error - falling back to localStorage:', error);
      return this.updateContractInLocalStorage(id, data);
    }
  }

  // Rental Payment Management
  async getPayments(filters?: { stall_id?: number; tenant_id?: number; month?: string; year?: number }): Promise<RentalPayment[]> {
    try {
      console.log('Fetching payments from database...');
      const response = await this.api.get('/canteen/payments', { params: filters });
      console.log('Payments fetched from database successfully');
      
      // Sync to localStorage for offline access
      localStorage.setItem('canteen_payments', JSON.stringify(response.data));
      return response.data;
    } catch {
      console.log('Database fetch failed, using localStorage fallback');
      return this.getPaymentsFromLocalStorage(filters);
    }
  }

  async createPayment(data: Omit<RentalPayment, 'id' | 'created_at' | 'updated_at'>): Promise<RentalPayment> {
    try {
      console.log('Creating payment in database...');
      const response = await this.api.post('/canteen/payments', data);
      console.log('Payment created in database successfully');
      
      // Update localStorage cache
      const payments = this.getPaymentsFromLocalStorage();
      payments.push(response.data);
      localStorage.setItem('canteen_payments', JSON.stringify(payments));
      
      return response.data;
    } catch {
      console.log('Database create failed, using localStorage fallback');
      return this.createPaymentInLocalStorage(data);
    }
  }

  async updatePayment(id: number, data: Partial<RentalPayment>): Promise<RentalPayment> {
    try {
      const response = await this.api.put(`/canteen/payments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API Error - falling back to localStorage:', error);
      return this.updatePaymentInLocalStorage(id, data);
    }
  }

  async markPaymentAsPaid(id: number, paymentData: { payment_date: string; payment_method: string; notes?: string }): Promise<RentalPayment> {
    try {
      console.log('Marking payment as paid in database...');
      const response = await this.api.patch(`/canteen/payments/${id}/mark-paid`, paymentData);
      console.log('Payment marked as paid in database successfully');
      
      // Update localStorage cache
      const payments = this.getPaymentsFromLocalStorage();
      const index = payments.findIndex(p => p.id === id);
      if (index !== -1) {
        payments[index] = { ...payments[index], ...response.data };
        localStorage.setItem('canteen_payments', JSON.stringify(payments));
      }
      
      return response.data;
    } catch {
      console.log('Database update failed, using localStorage fallback');
      return this.markPaymentAsPaidInLocalStorage(id, paymentData);
    }
  }

  // Generate monthly payments for all active contracts
  async generateMonthlyPayments(month: string, year: number): Promise<RentalPayment[]> {
    try {
      console.log('Generating monthly payments in database...');
      const response = await this.api.post('/canteen/payments/generate-monthly', { month, year });
      console.log('Monthly payments generated in database successfully');
      
      // Update localStorage cache with new payments
      if (response.data.length > 0) {
        const existingPayments = this.getPaymentsFromLocalStorage();
        const updatedPayments = [...existingPayments, ...response.data];
        localStorage.setItem('canteen_payments', JSON.stringify(updatedPayments));
      }
      
      return response.data;
    } catch {
      console.log('Database generation failed, using localStorage fallback');
      return this.generateMonthlyPaymentsInLocalStorage(month, year);
    }
  }

  // Dashboard/Statistics
  async getDashboardStats(): Promise<{
    totalStalls: number;
    occupiedStalls: number;
    vacantStalls: number;
    totalMonthlyRent: number;
    paidThisMonth: number;
    unpaidThisMonth: number;
    overduePayments: number;
  }> {
    try {
      console.log('Fetching dashboard stats from database...');
      const response = await this.api.get('/canteen/dashboard/stats');
      console.log('Dashboard stats fetched from database successfully');
      return response.data;
    } catch (error) {
      console.log('Database stats fetch failed, calculating from localStorage');
      return this.getDashboardStatsFromLocalStorage();
    }
  }

  // LocalStorage Fallback Methods
  private getStallsFromLocalStorage(): Stall[] {
    const stalls = localStorage.getItem('canteen_stalls');
    if (!stalls) {
      // Initialize with 6 default stalls
      const defaultStalls: Stall[] = Array.from({ length: 6 }, (_, index) => ({
        id: index + 1,
        stall_number: index + 1,
        stall_name: `Stall ${index + 1}`,
        monthly_rent: 5000,
        is_occupied: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      localStorage.setItem('canteen_stalls', JSON.stringify(defaultStalls));
      return defaultStalls;
    }
    return JSON.parse(stalls);
  }

  private updateStallInLocalStorage(id: number, data: Partial<Stall>): Stall {
    const stalls = this.getStallsFromLocalStorage();
    const index = stalls.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Stall not found');
    
    stalls[index] = { ...stalls[index], ...data, updated_at: new Date().toISOString() };
    localStorage.setItem('canteen_stalls', JSON.stringify(stalls));
    return stalls[index];
  }

  private getTenantsFromLocalStorage(): Tenant[] {
    const tenants = localStorage.getItem('canteen_tenants');
    return tenants ? JSON.parse(tenants) : [];
  }

  private createTenantInLocalStorage(data: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Tenant {
    const tenants = this.getTenantsFromLocalStorage();
    const newTenant: Tenant = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tenants.push(newTenant);
    localStorage.setItem('canteen_tenants', JSON.stringify(tenants));
    return newTenant;
  }

  private updateTenantInLocalStorage(id: number, data: Partial<Tenant>): Tenant {
    const tenants = this.getTenantsFromLocalStorage();
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tenant not found');
    
    tenants[index] = { ...tenants[index], ...data, updated_at: new Date().toISOString() };
    localStorage.setItem('canteen_tenants', JSON.stringify(tenants));
    return tenants[index];
  }

  private deleteTenantFromLocalStorage(id: number): void {
    const tenants = this.getTenantsFromLocalStorage();
    const filteredTenants = tenants.filter(t => t.id !== id);
    localStorage.setItem('canteen_tenants', JSON.stringify(filteredTenants));
  }

  private getContractsFromLocalStorage(): RentalContract[] {
    const contracts = localStorage.getItem('canteen_contracts');
    return contracts ? JSON.parse(contracts) : [];
  }

  private createContractInLocalStorage(data: Omit<RentalContract, 'id' | 'created_at' | 'updated_at'>): RentalContract {
    const contracts = this.getContractsFromLocalStorage();
    const newContract: RentalContract = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    contracts.push(newContract);
    localStorage.setItem('canteen_contracts', JSON.stringify(contracts));
    return newContract;
  }

  private updateContractInLocalStorage(id: number, data: Partial<RentalContract>): RentalContract {
    const contracts = this.getContractsFromLocalStorage();
    const index = contracts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contract not found');
    
    contracts[index] = { ...contracts[index], ...data, updated_at: new Date().toISOString() };
    localStorage.setItem('canteen_contracts', JSON.stringify(contracts));
    return contracts[index];
  }

  private getPaymentsFromLocalStorage(filters?: { stall_id?: number; tenant_id?: number; month?: string; year?: number }): RentalPayment[] {
    const payments = localStorage.getItem('canteen_payments');
    let allPayments: RentalPayment[] = payments ? JSON.parse(payments) : [];
    
    if (filters) {
      allPayments = allPayments.filter(payment => {
        if (filters.stall_id && payment.stall_id !== filters.stall_id) return false;
        if (filters.tenant_id && payment.tenant_id !== filters.tenant_id) return false;
        if (filters.month && payment.month !== filters.month) return false;
        if (filters.year && payment.year !== filters.year) return false;
        return true;
      });
    }
    
    return allPayments;
  }

  private createPaymentInLocalStorage(data: Omit<RentalPayment, 'id' | 'created_at' | 'updated_at'>): RentalPayment {
    const payments = this.getPaymentsFromLocalStorage();
    const newPayment: RentalPayment = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    payments.push(newPayment);
    localStorage.setItem('canteen_payments', JSON.stringify(payments));
    return newPayment;
  }

  private updatePaymentInLocalStorage(id: number, data: Partial<RentalPayment>): RentalPayment {
    const payments = this.getPaymentsFromLocalStorage();
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payment not found');
    
    payments[index] = { ...payments[index], ...data, updated_at: new Date().toISOString() };
    localStorage.setItem('canteen_payments', JSON.stringify(payments));
    return payments[index];
  }

  private markPaymentAsPaidInLocalStorage(id: number, paymentData: { payment_date: string; payment_method: string; notes?: string }): RentalPayment {
    return this.updatePaymentInLocalStorage(id, {
      is_paid: true,
      ...paymentData,
    });
  }

  private generateMonthlyPaymentsInLocalStorage(month: string, year: number): RentalPayment[] {
    const contracts = this.getContractsFromLocalStorage().filter(c => c.is_active);
    const existingPayments = this.getPaymentsFromLocalStorage({ month, year });
    const newPayments: RentalPayment[] = [];

    contracts.forEach(contract => {
      // Check if payment already exists for this contract and month
      const existingPayment = existingPayments.find(p => 
        p.stall_id === contract.stall_id && 
        p.tenant_id === contract.tenant_id
      );

      if (!existingPayment) {
        const dueDate = new Date(year, parseInt(month) - 1, 5); // Due on 5th of each month
        const newPayment: RentalPayment = {
          id: Date.now() + Math.random(),
          stall_id: contract.stall_id,
          tenant_id: contract.tenant_id,
          month,
          year,
          amount: contract.monthly_rent,
          due_date: dueDate.toISOString().split('T')[0],
          is_paid: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newPayments.push(newPayment);
      }
    });

    if (newPayments.length > 0) {
      const allPayments = [...this.getPaymentsFromLocalStorage(), ...newPayments];
      localStorage.setItem('canteen_payments', JSON.stringify(allPayments));
    }

    return newPayments;
  }

  private getDashboardStatsFromLocalStorage(): {
    totalStalls: number;
    occupiedStalls: number;
    vacantStalls: number;
    totalMonthlyRent: number;
    paidThisMonth: number;
    unpaidThisMonth: number;
    overduePayments: number;
  } {
    const stalls = this.getStallsFromLocalStorage();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentYear = new Date().getFullYear();
    const payments = this.getPaymentsFromLocalStorage({ month: currentMonth, year: currentYear });
    const contracts = this.getContractsFromLocalStorage().filter(c => c.is_active);

    const totalStalls = stalls.length;
    const occupiedStalls = stalls.filter(s => s.is_occupied).length;
    const vacantStalls = totalStalls - occupiedStalls;
    const totalMonthlyRent = contracts.reduce((sum, contract) => sum + contract.monthly_rent, 0);
    const paidThisMonth = payments.filter(p => p.is_paid).reduce((sum, p) => sum + p.amount, 0);
    const unpaidThisMonth = payments.filter(p => !p.is_paid).reduce((sum, p) => sum + p.amount, 0);
    
    const today = new Date();
    const overduePayments = payments.filter(p => 
      !p.is_paid && new Date(p.due_date) < today
    ).length;

    return {
      totalStalls,
      occupiedStalls,
      vacantStalls,
      totalMonthlyRent,
      paidThisMonth,
      unpaidThisMonth,
      overduePayments,
    };
  }
}

export const canteenRentalAPI = new CanteenRentalAPI();
