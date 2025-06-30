import { api } from './api';
import type { 
  Order, 
  CreateOrderRequest, 
  CreateOrderResponse, 
  OrderWithInvoices,
  Invoice,
  Payment
} from '$lib/types/order';

// Performance: Request cache and deduplication
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  private getCacheKey(url: string, params?: any): string {
    return `${url}_${JSON.stringify(params || {})}`;
  }
  
  get(url: string, params?: any): any | null {
    const key = this.getCacheKey(url, params);
    const entry = this.cache.get(key);
    
    if (entry && Date.now() < entry.expiry) {
      console.log(`📦 Cache hit: ${key}`);
      return entry.data;
    }
    
    if (entry && Date.now() >= entry.expiry) {
      this.cache.delete(key);
      console.log(`🗑️ Cache expired: ${key}`);
    }
    
    return null;
  }
  
  set(url: string, params: any, data: any, ttl: number = 30000): void {
    const key = this.getCacheKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
    console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
  }
  
  async deduplicate<T>(url: string, params: any, requestFn: () => Promise<T>): Promise<T> {
    const key = this.getCacheKey(url, params);
    
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Deduplicating request: ${key}`);
      return this.pendingRequests.get(key)!;
    }
    
    // Execute request and store promise
    const promise = requestFn();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(key);
    }
  }
  
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🧹 Request cache cleared');
  }
  
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export class OrdersService {
  private readonly createOrderUrl = '/admin/create-order/'; // Admin endpoint for creating orders
  private readonly publicOrderUrl = '/order/'; // Public endpoint for reading orders  
  private readonly invoiceUrl = '/invoice/';
  private readonly paymentUrl = '/payment/';
  
  // Performance: Request cache instance
  private cache = new RequestCache();

  // Performance: Cleanup cache periodically
  constructor() {
    // Clean expired cache entries every 5 minutes
    setInterval(() => {
      this.cache.clearExpired();
    }, 5 * 60 * 1000);
  }

  // ==== CACHE MANAGEMENT ====
  
  /**
   * Clear cache after mutations to ensure fresh data
   */
  private clearCache(): void {
    this.cache.clear();
    console.log('🧹 Orders cache cleared after mutation');
  }
  
  /**
   * Force refresh orders cache
   */
  public refreshCache(): void {
    this.clearCache();
  }

  // ==== ORDER OPERATIONS ====

  /**
   * Get all orders with pagination (optimized with caching)
   */
  async getOrders(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    customer_name?: string;
    order_code?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Order[];
  }> {
    // Check cache first (TTL: 30 seconds for admin orders)
    const cached = this.cache.get(this.publicOrderUrl, params);
    if (cached) {
      return cached;
    }
    
    // Use deduplication to prevent multiple simultaneous requests
    return await this.cache.deduplicate(
      this.publicOrderUrl,
      params,
      async () => {
        console.log('📡 Fetching orders from API...');
        const result = await api.get(this.publicOrderUrl, {}, params);
        
        // Cache the result (30 seconds TTL for admin pages)
        this.cache.set(this.publicOrderUrl, params, result, 30000);
        
        return result;
      }
    );
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order> {
    return await api.get(`/${id}/`);  // Django pattern: /api/v1/<uuid>/
  }

  /**
   * Create new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Check if there's a file upload
    const hasFile = orderData.design && orderData.design instanceof File;
    
    if (hasFile) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add all order fields to FormData
      Object.entries(orderData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'design' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      return await api.uploadFile(this.createOrderUrl, formData);
    } else {
      // Use JSON for data without files
      const cleanData: any = {};
      Object.entries(orderData).forEach(([key, value]) => {
        if (key !== 'design' && value !== undefined && value !== null && value !== '') {
          cleanData[key] = value;
        }
      });
      
      return await api.post(this.createOrderUrl, cleanData);
    }
  }

  /**
   * Update order
   */
  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    return await api.patch(`/${id}/`, orderData);  // Django pattern: /api/v1/<uuid>/
  }

  /**
   * Update production status specifically (admin only)
   */
  async updateProductionStatus(orderId: string, productionStatus: 'menunggu' | 'diproses' | 'selesai'): Promise<Order> {
    // Use correct Django pattern from URL mapping
    return await api.patch(`/${orderId}/`, { production_status: productionStatus });
  }

  /**
   * Delete order
   */
  async deleteOrder(id: string): Promise<void> {
    return await api.delete(`/${id}/`);  // Django pattern: /api/v1/<uuid>/
  }

  /**
   * Create payment link for existing order
   */
  async createPaymentLink(orderId: string): Promise<{
    invoice: Invoice;
    payment_url: string;
  }> {
    return await api.post(`/${orderId}/create-payment-link/`, {});  // Django pattern: /api/v1/<uuid>/create-payment-link/
  }

  /**
   * Check order status by order code (public endpoint)
   */
  async checkOrderStatus(orderCode: string): Promise<OrderWithInvoices> {
    return await api.get('/check-order', {}, { order_code: orderCode });
  }

  // ==== INVOICE OPERATIONS ====

  /**
   * Get all invoices with pagination
   */
  async getInvoices(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    order?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Invoice[];
  }> {
    return await api.get(this.invoiceUrl, {}, params);
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    return await api.get(`${this.invoiceUrl}${id}/`);
  }

  /**
   * Get invoice detail by invoice code (public endpoint)
   */
  async getInvoiceByCode(invoiceCode: string): Promise<{
    invoice: Invoice;
    order: Order;
    payment_url: string;
  }> {
    return await api.get(`${this.invoiceUrl}detail/${invoiceCode}/`);
  }

  /**
   * Send payment link via WhatsApp/Email
   */
  async sendPaymentLink(invoiceId: string): Promise<{
    message: string;
    invoice_id: string;
  }> {
    return await api.post(`${this.invoiceUrl}${invoiceId}/send-payment-link/`, {});
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    return await api.patch(`${this.invoiceUrl}${id}/`, invoiceData);
  }

  // ==== PAYMENT OPERATIONS ====

  /**
   * Get all payments with pagination
   */
  async getPayments(params?: {
    page?: number;
    page_size?: number;
    invoice?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Payment[];
  }> {
    return await api.get(this.paymentUrl, {}, params);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment> {
    return await api.get(`${this.paymentUrl}${id}/`);
  }

  /**
   * Record manual payment (admin only)
   */
  async recordManualPayment(paymentData: {
    invoice_id: string;
    payment_method: string;
    amount: string;
    contact_info: string;
    payment_time?: string;
    notes?: string;
  }): Promise<Payment> {
    return await api.post(`${this.paymentUrl}manual/`, paymentData);
  }

  // ==== UTILITY METHODS ====

  /**
   * Format currency for display
   */
  formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      'menunggu_link': 'warning',
      'link_dibuat': 'info',
      'dp_dibayar': 'primary',
      'menunggu_pelunasan': 'warning',
      'lunas': 'success',
      'dibatalkan': 'danger',
      'menunggu': 'secondary',
      'diproses': 'info',
      'selesai': 'success',
      'belum dibayar': 'warning',
      'sudah dibayar': 'success',
      'kadaluarsa': 'danger'
    };
    return statusMap[status] || 'secondary';
  }

  /**
   * Get status display text
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'menunggu_link': 'Menunggu Link',
      'link_dibuat': 'Link Dibuat',
      'dp_dibayar': 'DP Dibayar',
      'menunggu_pelunasan': 'Menunggu Pelunasan',
      'lunas': 'Lunas',
      'dibatalkan': 'Dibatalkan',
      'menunggu': 'Menunggu',
      'diproses': 'Diproses',
      'selesai': 'Selesai',
      'belum dibayar': 'Belum Dibayar',
      'sudah dibayar': 'Sudah Dibayar',
      'kadaluarsa': 'Kadaluarsa'
    };
    return statusMap[status] || status;
  }

  /**
   * Calculate payment amount based on type and percentage
   */
  calculatePaymentAmount(totalPrice: string, paymentType: 'dp' | 'full', dpPercent: number = 60): string {
    const total = parseFloat(totalPrice);
    
    if (paymentType === 'full') {
      return totalPrice;
    }
    
    // For DP, calculate percentage
    const dpAmount = (total * dpPercent) / 100;
    return dpAmount.toString();
  }

  /**
   * Validate WhatsApp number format
   */
  validateWhatsAppNumber(number: string): boolean {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Indonesian phone number validation
    // Supports multiple formats:
    // - 08xxxxxxxxx (local format with 0)
    // - 8xxxxxxxxx (local format without 0) 
    // - 628xxxxxxxxx (international format)
    // Length: 10-13 digits after normalization
    
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }
    
    // Check different Indonesian phone number patterns
    const patterns = [
      /^08\d{8,12}$/,      // 08123456789 (10-14 digits total)
      /^8\d{8,12}$/,       // 8123456789 (9-13 digits total)  
      /^628\d{8,12}$/,     // 628123456789 (11-15 digits total)
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format contact info for display
   */
  formatContactInfo(contact: string): string {
    // Check if it's email
    if (contact.includes('@')) {
      return contact;
    }
    
    // Format phone number
    const cleaned = contact.replace(/\D/g, '');
    if (cleaned.startsWith('62')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('8')) {
      return `+62${cleaned}`;
    }
    
    return contact;
  }
}

// Export singleton instance
export const ordersService = new OrdersService();
