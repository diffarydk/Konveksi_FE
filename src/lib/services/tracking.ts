import { api } from './api';

export interface TrackingHistoryItem {
  timestamp: string;
  status: string;
  description: string;
}

export interface TrackingPaymentSummary {
  total_amount: string;
  amount_paid: string;
  remaining_balance: string;
  payment_type?: string;
  payment_type_display?: string;
}

export interface TrackingInvoice {
  invoice_code: string;
  payment_type: 'dp' | 'pelunasan' | 'full';
  invoice_type_display: string;
  invoice_status: 'belum dibayar' | 'sudah dibayar' | 'kadaluarsa' | 'dibatalkan';
  status_display: string;
  invoice_amount: string;
  invoice_paid_at: string | null;
  payment_link: string | null;
}

// Enhanced Timeline Types based on API Documentation
export interface TimelineItem {
  id: string;
  timestamp: string;
  milestone: string;
  description: string;
  icon: string;
  category: 'payment' | 'production' | 'order'; // Updated categories
  status: 'completed' | 'current' | 'pending';
  order: number;
  is_estimated?: boolean;
  invoice_code?: string;
  amount?: string;
  estimated_completion?: string; // AI prediction feature
}

export interface ProgressInfo {
  percentage: number;
  completed_milestones: number;
  total_milestones: number;
  status: 'in_progress' | 'completed';
  current_stage: string;
  next_milestone?: string;
}

export interface CurrentStage {
  code: 'payment' | 'production' | 'completed' | 'cancelled' | 'in_progress';
  display: string;
  description?: string;
}

export interface NextMilestone {
  milestone: string;
  description: string;
  icon: string;
  estimated_date?: string;
  category: 'payment' | 'production' | 'order';
}

// API Response Structure following documentation
export interface ApiTimelineResponse {
  timeline: TimelineItem[];
  progress: ProgressInfo;
  current_stage: CurrentStage;
  next_milestone?: NextMilestone;
}

export interface TrackingData {
  order_code: string;
  customer_name: string; // Privacy-masked: "Budi S."
  product_name?: string;
  quantity?: number;
  total_price?: string;
  payment_type?: string;
  paid_amount?: string;
  status_order: string;
  order_status_display: string;
  production_status?: string;
  production_status_display?: string;
  is_fully_paid: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Enhanced API Data following documentation
  timeline?: TimelineItem[];
  progress?: ProgressInfo;
  current_stage?: CurrentStage;
  next_milestone?: NextMilestone;
  
  payment_summary: TrackingPaymentSummary;
  invoices: TrackingInvoice[];
  history: TrackingHistoryItem[];
}

export interface TrackingResponse {
  success: boolean;
  message: string;
  data: TrackingData;
}

export interface TrackingError {
  error: string;
  detail: string;
  status?: number;
  troubleshooting?: string[];
  debug?: any;
}

export class TrackingService {
  private cache = new Map<string, { data: TrackingResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes client cache (server has 15 min cache)
  private rateLimitCounter = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT = 10; // 10 requests per minute as per documentation
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

  /**
   * Track order using enhanced /track-order/ endpoint following API documentation
   */
  async trackOrder(orderCode: string): Promise<TrackingResponse> {
    if (!orderCode.trim()) {
      throw { 
        error: "Parameter order_code diperlukan",
        detail: "Gunakan format: ORD-YYYYMMDD-XXX (contoh: ORD-20250629-M6P)",
        status: 400
      };
    }

    // Validate order code format - Updated to support new backend format
    const orderCodePattern = /^ORD-\d{8}-[A-Z0-9]{3,4}$/;
    if (!orderCodePattern.test(orderCode.trim())) {
      throw {
        error: "Format order code tidak valid",
        detail: "Format order code harus: ORD-YYYYMMDD-XXX (contoh: ORD-20250629-M6P)",
        status: 400
      };
    }

    // Check rate limiting (client-side simulation)
    if (!this.checkRateLimit()) {
      throw {
        error: "Terlalu banyak permintaan",
        detail: "Rate limit exceeded. Maksimal 10 requests per menit.",
        status: 429
      };
    }

    // Check client cache first
    const cacheKey = `track_${orderCode.trim()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📱 Using cached tracking data (client-side cache)');
      return cached.data;
    }

    try {
      // Development mock for testing error scenarios
      if (import.meta.env?.DEV && orderCode.includes('TEST500')) {
        throw {
          status: 500,
          message: 'Mock 500 error for testing',
          data: { error: 'Development test error' }
        };
      }
      
      // Make API request with comprehensive error handling
      const response = await api.get('/track-order/', {}, { order_code: orderCode.trim() });
      
      console.log('🔍 API Timeline Response:', response);

      // Enhanced fallback processing for backend compatibility
      if (response.success && response.data) {
        // Create a safe copy to avoid mutation issues
        const safeData = this.createSafeDataCopy(response.data);
        
        // ALWAYS regenerate timeline and stage info to ensure consistency with production_status
        console.log('🔄 Regenerating documentation-compliant timeline and stage info...');
        safeData.timeline = this.generateRobustFallbackTimeline(safeData);
        
        // ALWAYS recalculate progress, current stage, and next milestone
        safeData.progress = this.calculateSafeProgress(safeData);
        safeData.current_stage = this.getSafeCurrentStage(safeData);
        safeData.next_milestone = this.getSafeNextMilestone(safeData);

        // Debug log for verification
        console.log('📊 Enhanced Data Verification:', {
          order_code: safeData.order_code,
          production_status: safeData.production_status,
          current_stage_display: safeData.current_stage?.display,
          next_milestone: safeData.next_milestone?.milestone,
          progress_percentage: safeData.progress?.percentage + '%',
          timeline_count: safeData.timeline?.length
        });

        const enhancedResponse = {
          ...response,
          data: safeData
        };

        // Cache the enhanced result (client-side cache, server has 15min cache)
        this.cache.set(cacheKey, {
          data: enhancedResponse,
          timestamp: Date.now()
        });

        console.log('✅ Enhanced Timeline Data (API Compliant):', {
          timeline_count: safeData.timeline?.length || 0,
          progress: safeData.progress?.percentage || 0,
          current_stage: safeData.current_stage?.display || 'Unknown',
          categories: safeData.timeline?.map((t: TimelineItem) => t.category) || []
        });
        
        return enhancedResponse;
      } else {
        // Handle non-success response with fallback
        throw {
          error: response?.error || "Invalid response format",
          detail: response?.detail || "Backend response tidak valid",
          status: response?.status || 500
        };
      }
    } catch (error: any) {
      console.error('🚨 API Error Details:', {
        status: error.status,
        message: error.message,
        data: error.data,
        stack: error.stack?.split('\n')[0] // Only log first line of stack
      });

      // Enhanced error handling following API documentation
      if (error.status === 404) {
        throw {
          error: "Order dengan kode tersebut tidak ditemukan",
          detail: "Pastikan kode order yang Anda masukkan benar",
          status: 404
        };
      } else if (error.status === 400) {
        throw {
          error: error.data?.error || "Format order code tidak valid",
          detail: error.data?.detail || "Format order code harus: ORD-XXX-YYY",
          status: 400
        };
      } else if (error.status === 429) {
        throw {
          error: "Terlalu banyak permintaan",
          detail: "Rate limit exceeded. Coba lagi dalam 1 menit",
          status: 429
        };
      } else if (error.status === 0) {
        throw {
          error: "Koneksi bermasalah",
          detail: "Periksa koneksi internet Anda",
          status: 0
        };
      } else if (error.status >= 500) {
        // For 500 errors, provide specific troubleshooting
        throw {
          error: "Server mengalami gangguan (Error 500)",
          detail: "Backend sedang dalam tahap pengembangan atau overload. Coba lagi dalam beberapa menit.",
          status: error.status,
          troubleshooting: [
            "Backend mungkin belum support enhanced timeline API",
            "Server sedang dalam maintenance",
            "Database connection issue",
            "Coba refresh halaman dan ulangi dalam 2-3 menit"
          ]
        };
      } else {
        throw {
          error: "Terjadi kesalahan tidak terduga",
          detail: error.message || "Silakan coba lagi nanti",
          status: error.status || 500,
          debug: import.meta.env?.DEV ? error : undefined
        };
      }
    }
  }

  /**
   * Create safe copy of response data to prevent mutation issues
   */
  private createSafeDataCopy(data: any): TrackingData {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.warn('🔄 Failed to create safe copy, using original data', error);
      return data;
    }
  }

  /**
   * Generate robust fallback timeline with comprehensive error handling
   */
  private generateRobustFallbackTimeline(orderData: TrackingData): TimelineItem[] {
    try {
      return this.generateDocumentationCompliantTimeline(orderData);
    } catch (error) {
      console.error('❌ Error generating fallback timeline:', error);
      
      // Minimal safe timeline as last resort
      return [{
        id: 'minimal_timeline',
        timestamp: new Date().toISOString(),
        milestone: 'Pesanan Diterima',
        description: `Pesanan ${orderData.order_code || 'N/A'} sedang diproses`,
        icon: '📝',
        category: 'order',
        status: 'current',
        order: 1,
        is_estimated: false
      }];
    }
  }

  /**
   * Validate and enhance existing timeline safely
   */
  private validateAndEnhanceTimeline(timeline: any[]): TimelineItem[] {
    try {
      if (!Array.isArray(timeline)) {
        console.warn('⚠️ Timeline is not an array, creating fallback');
        return [];
      }

      return this.validateTimelineCategories(timeline as TimelineItem[]);
    } catch (error) {
      console.error('❌ Error validating timeline:', error);
      return [];
    }
  }

  /**
   * Calculate progress with comprehensive error handling
   */
  private calculateSafeProgress(orderData: TrackingData): ProgressInfo {
    try {
      return this.calculateDocumentationProgress(orderData);
    } catch (error) {
      console.error('❌ Error calculating progress:', error);
      
      // Fallback to basic progress calculation
      const paymentProgress = this.getSafePaymentProgress(orderData);
      return {
        percentage: paymentProgress,
        completed_milestones: paymentProgress > 0 ? 1 : 0,
        total_milestones: 1,
        status: paymentProgress >= 100 ? 'completed' : 'in_progress',
        current_stage: 'Pesanan Diproses',
        next_milestone: paymentProgress < 100 ? 'Pembayaran' : undefined
      };
    }
  }

  /**
   * Get current stage with comprehensive error handling
   */
  private getSafeCurrentStage(orderData: TrackingData): CurrentStage {
    try {
      return this.getDocumentationCurrentStage(orderData);
    } catch (error) {
      console.error('❌ Error getting current stage:', error);
      
      // Safe fallback stage
      return {
        code: 'in_progress',
        display: 'Dalam Proses',
        description: 'Pesanan sedang diproses'
      };
    }
  }

  /**
   * Get next milestone with comprehensive error handling
   */
  private getSafeNextMilestone(orderData: TrackingData): NextMilestone | undefined {
    try {
      return this.getDocumentationNextMilestone(orderData);
    } catch (error) {
      console.error('❌ Error getting next milestone:', error);
      return undefined; // Safe to return undefined for optional field
    }
  }

  /**
   * Get payment progress safely
   */
  private getSafePaymentProgress(orderData: TrackingData): number {
    try {
      if (!orderData.payment_summary) return 0;
      
      const total = parseFloat(orderData.payment_summary.total_amount || '0');
      const paid = parseFloat(orderData.payment_summary.amount_paid || '0');
      
      if (total <= 0) return 0;
      return Math.round((paid / total) * 100);
    } catch (error) {
      console.error('❌ Error calculating payment progress:', error);
      return 0;
    }
  }

  /**
   * Check rate limiting (10 requests per minute as per documentation)
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const clientId = 'client'; // In real app, this would be user IP or session
    
    let rateLimitData = this.rateLimitCounter.get(clientId);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Reset counter
      this.rateLimitCounter.set(clientId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }
    
    if (rateLimitData.count >= this.RATE_LIMIT) {
      return false;
    }
    
    rateLimitData.count++;
    return true;
  }

  /**
   * Validate timeline categories according to API documentation
   */
  private validateTimelineCategories(timeline: TimelineItem[]): TimelineItem[] {
    const validCategories: ('payment' | 'production' | 'order')[] = 
      ['payment', 'production', 'order'];
    
    return timeline.map(item => {
      // Ensure category is valid
      if (!validCategories.includes(item.category as any)) {
        console.warn(`Invalid category "${item.category}" found, defaulting to "order"`);
        item.category = 'order';
      }
      
      // Ensure required fields exist
      if (!item.id) item.id = `timeline_${Date.now()}_${Math.random()}`;
      if (!item.order) item.order = timeline.indexOf(item) + 1;
      
      return item;
    });
  }

  /**
   * Generate documentation-compliant timeline if backend doesn't provide it
   */
  private generateDocumentationCompliantTimeline(orderData: TrackingData): TimelineItem[] {
    const timeline: TimelineItem[] = [];
    const now = new Date();
    let orderCounter = 1;

    // 1. Order Creation (Category: Order)
    timeline.push({
      id: 'order_created',
      timestamp: orderData.created_at || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      milestone: 'Pesanan Dibuat',
      description: `Pesanan ${orderData.order_code} telah diterima dan dikonfirmasi`,
      icon: '📝',
      category: 'order',
      status: 'completed',
      order: orderCounter++,
      is_estimated: false
    });

    // 2. Payment Milestones (Category: Payment)
    // Handle different payment types properly
    if (orderData.payment_type === 'full') {
      // Full payment case
      if (orderData.is_fully_paid) {
        timeline.push({
          id: 'full_payment_received',
          timestamp: orderData.updated_at || new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
          milestone: 'Pembayaran Penuh Diterima',
          description: 'Pembayaran penuh telah diterima. Pesanan akan masuk antrian produksi',
          icon: '💯',
          category: 'payment',
          status: 'completed',
          order: orderCounter++,
          amount: orderData.paid_amount || orderData.total_price
        });
      } else {
        // Full payment pending
        timeline.push({
          id: 'full_payment_pending',
          timestamp: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
          milestone: 'Menunggu Pembayaran Penuh',
          description: 'Menunggu pembayaran penuh untuk memulai produksi',
          icon: '💳',
          category: 'payment',
          status: 'current',
          order: orderCounter++,
          amount: orderData.total_price
        });
      }
    } else {
      // DP payment case
      const dpInvoice = orderData.invoices.find(inv => inv.payment_type === 'dp');
      if (dpInvoice) {
        timeline.push({
          id: 'invoice_dp_created',
          timestamp: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(),
          milestone: 'Invoice DP Dibuat',
          description: `Invoice Down Payment telah dibuat dan siap untuk pembayaran`,
          icon: '🧾',
          category: 'payment',
          status: dpInvoice.invoice_status === 'sudah dibayar' ? 'completed' : 'current',
          order: orderCounter++,
          invoice_code: dpInvoice.invoice_code,
          amount: dpInvoice.invoice_amount
        });

        if (dpInvoice.invoice_status === 'sudah dibayar') {
          timeline.push({
            id: 'dp_payment_received',
            timestamp: dpInvoice.invoice_paid_at || new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
            milestone: 'Pembayaran DP Diterima',
            description: 'Down Payment telah diterima. Produksi akan segera dimulai',
            icon: '💰',
            category: 'payment',
            status: 'completed',
            order: orderCounter++,
            invoice_code: dpInvoice.invoice_code,
            amount: dpInvoice.invoice_amount
          });
        }
      }
    }

    // 3. Production Milestones (Category: Production) - ONLY if payment completed
    if (orderData.is_fully_paid) {
      const productionStatus = orderData.production_status || 'menunggu';
      const productionMilestones = {
        'menunggu': {
          milestone: 'Menunggu Produksi',
          description: 'Pembayaran diterima. Pesanan dalam antrian produksi dan akan segera dikerjakan',
          icon: '⏳',
          status: 'current' as const
        },
        'diproses': {
          milestone: 'Produksi Berlangsung',
          description: 'Tim produksi sedang mengerjakan pesanan dengan teliti',
          icon: '🏭',
          status: 'current' as const
        },
        'selesai': {
          milestone: 'Produksi Selesai',
          description: 'Produksi telah selesai dengan sempurna',
          icon: '✨',
          status: 'completed' as const
        }
      };

      const currentProduction = productionMilestones[productionStatus as keyof typeof productionMilestones];
      if (currentProduction) {
        timeline.push({
          id: `production_${productionStatus}`,
          timestamp: this.getProductionTimestamp(productionStatus, orderData),
          milestone: currentProduction.milestone,
          description: currentProduction.description,
          icon: currentProduction.icon,
          category: 'production',
          status: currentProduction.status,
          order: orderCounter++,
          estimated_completion: productionStatus !== 'selesai' ? 
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
        });
      }

      // 4. Future Production Stages (Estimated) - Only add next logical step
      if (productionStatus === 'menunggu') {
        timeline.push({
          id: 'production_start_estimated',
          timestamp: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          milestone: 'Produksi Dimulai',
          description: 'Estimasi produksi akan dimulai dalam 2-3 hari',
          icon: '🏭',
          category: 'production',
          status: 'pending',
          order: orderCounter++,
          is_estimated: true,
          estimated_completion: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (productionStatus === 'diproses') {
        timeline.push({
          id: 'production_complete_estimated',
          timestamp: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          milestone: 'Produksi Selesai',
          description: 'Estimasi produksi akan selesai dalam 5-7 hari',
          icon: '✨',
          category: 'production',
          status: 'pending',
          order: orderCounter++,
          is_estimated: true,
          estimated_completion: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }


    }

    // 6. Final Payment if needed (DP case only)
    if (!orderData.is_fully_paid && orderData.production_status === 'selesai') {
      const finalInvoice = orderData.invoices.find(inv => inv.payment_type === 'pelunasan');
      if (finalInvoice) {
        timeline.push({
          id: 'final_payment_invoice',
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          milestone: 'Invoice Pelunasan Dibuat',
          description: `Invoice pelunasan telah dibuat. Silakan lakukan pembayaran untuk menyelesaikan pesanan`,
          icon: '📄',
          category: 'payment',
          status: finalInvoice.invoice_status === 'sudah dibayar' ? 'completed' : 'current',
          order: orderCounter++,
          invoice_code: finalInvoice.invoice_code,
          amount: finalInvoice.invoice_amount
        });
      }
    }

    return timeline.sort((a, b) => a.order - b.order);
  }

  /**
   * Get appropriate timestamp for production milestones
   */
  private getProductionTimestamp(productionStatus: string, orderData: TrackingData): string {
    const now = new Date();
    const baseTime = orderData.updated_at ? new Date(orderData.updated_at) : now;
    
    switch (productionStatus) {
      case 'menunggu':
        return baseTime.toISOString(); // Current timestamp for current status
      case 'diproses':
        return new Date(baseTime.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 day after
      case 'selesai':
        return new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days after
      default:
        return now.toISOString();
    }
  }

  /**
   * Calculate progress following documentation format
   */
  private calculateDocumentationProgress(orderData: TrackingData): ProgressInfo {
    const timeline = orderData.timeline || [];
    const totalMilestones = timeline.filter(item => !item.is_estimated).length;
    const completedMilestones = timeline.filter(item => item.status === 'completed' && !item.is_estimated).length;
    
    const percentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    
    // Determine current stage from timeline
    const currentMilestone = timeline.find(item => item.status === 'current');
    const currentStage = currentMilestone?.milestone || 'Pesanan Diproses';
    
    const nextMilestone = timeline.find(item => item.status === 'pending' || 
      (item.status === 'current' && item !== currentMilestone));
    
    return {
      percentage,
      completed_milestones: completedMilestones,
      total_milestones: totalMilestones,
      status: percentage >= 100 ? 'completed' : 'in_progress',
      current_stage: currentStage,
      next_milestone: nextMilestone?.milestone
    };
  }

  /**
   * Get current stage following documentation format (Updated Timeline API)
   */
  private getDocumentationCurrentStage(orderData: TrackingData): CurrentStage {
    // Determine stage based on order status and payment status
    if (orderData.status_order === 'dibatalkan') {
      return { 
        code: 'cancelled', 
        display: 'Dibatalkan',
        description: 'Pesanan telah dibatalkan'
      };
    }

    if (!orderData.is_fully_paid) {
      return { 
        code: 'payment', 
        display: 'Pembayaran',
        description: 'Menunggu pembayaran untuk melanjutkan proses pesanan'
      };
    }

    const productionStatus = orderData.production_status || 'menunggu';
    
    switch (productionStatus) {
      case 'menunggu':
      case 'diproses':
        return { 
          code: 'production', 
          display: 'Produksi',
          description: 'Pesanan sedang dalam tahap produksi'
        };
      case 'selesai':
        return { 
          code: 'completed', 
          display: 'Selesai',
          description: 'Pesanan telah selesai dengan sempurna'
        };
      default:
        return { 
          code: 'in_progress', 
          display: 'Dalam Proses',
          description: 'Pesanan sedang diproses'
        };
    }
  }

  /**
   * Get next milestone following documentation format with AI prediction (Updated Timeline API)
   */
  private getDocumentationNextMilestone(orderData: TrackingData): NextMilestone | undefined {
    const currentStage = this.getDocumentationCurrentStage(orderData);
    const productionStatus = orderData.production_status || 'menunggu';
    const now = new Date();
    
    switch (currentStage.code) {
      case 'payment':
        return {
          milestone: 'Pembayaran Selesai',
          description: 'Menunggu pembayaran untuk memulai produksi pesanan',
          icon: '💰',
          category: 'payment',
          estimated_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
      case 'production':
        if (productionStatus === 'menunggu') {
          return {
            milestone: 'Produksi Dimulai',
            description: 'Produksi akan segera dimulai setelah antrian. Estimasi 2-3 hari',
            icon: '🏭',
            category: 'production',
            estimated_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };
        } else if (productionStatus === 'diproses') {
          return {
            milestone: 'Produksi Selesai',
            description: 'Estimasi produksi akan selesai dalam 5-7 hari',
            icon: '✨',
            category: 'production',
            estimated_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };
        }
        return undefined;

      case 'completed':
        return undefined; // No next milestone for completed orders
      case 'cancelled':
        return undefined; // No next milestone for cancelled orders
      default:
        return undefined;
    }
  }

  /**
   * Invalidate cache for specific order or all orders
   */
  invalidateCache(orderCode?: string): void {
    if (orderCode) {
      this.cache.delete(`track_${orderCode}`);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Format currency for Indonesian Rupiah
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
   * Format date to Indonesian locale (long format)
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format date short (for timeline meta)
   */
  formatDateShort(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format date for estimated completion
   */
  formatEstimatedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Get status badge class based on status
   */
  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      // Order status
      'menunggu_link': 'warning',
      'link_dibuat': 'info',
      'dp_dibayar': 'primary',
      'pengerjaan_selesai': 'success',
      'menunggu_pelunasan': 'warning',
      'lunas': 'success',
      'dibatalkan': 'danger',
      
      // Invoice status
      'belum dibayar': 'warning',
      'sudah dibayar': 'success',
      'kadaluarsa': 'danger',
      
      // Production status
      'menunggu': 'warning',
      'diproses': 'primary',
      'selesai': 'success',
      
      // Timeline status
      'current': 'primary',
      'pending': 'warning',
      
      // Stage codes (Updated Timeline API)
      'payment': 'warning',
      'production': 'primary',
      'completed': 'success',
      'cancelled': 'danger',
      'in_progress': 'primary'
    };
    return statusMap[status] || 'secondary';
  }

  /**
   * Get category icon mapping
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'order': 'fas fa-shopping-cart',
      'payment': 'fas fa-credit-card',
      'production': 'fas fa-cog'
    };
    return iconMap[category] || 'fas fa-info-circle';
  }

  /**
   * Get category color mapping for UI theming
   */
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'order': 'purple',
      'payment': 'green',
      'production': 'blue'
    };
    return colorMap[category] || 'gray';
  }

  /**
   * Check if payment link should be displayed
   */
  shouldShowPaymentLink(invoice: TrackingInvoice): boolean {
    return invoice.invoice_status === 'belum dibayar' && 
           invoice.payment_link !== null && 
           invoice.payment_link !== '';
  }

  /**
   * Get payment type display text
   */
  getPaymentTypeDisplay(paymentType: string): string {
    const typeMap: Record<string, string> = {
      'dp': 'Down Payment (DP)',
      'pelunasan': 'Pembayaran Pelunasan',
      'full': 'Pembayaran Penuh'
    };
    return typeMap[paymentType] || paymentType;
  }

  /**
   * Calculate payment progress percentage
   */
  getPaymentProgress(summary: TrackingPaymentSummary): number {
    const total = parseFloat(summary.total_amount);
    const paid = parseFloat(summary.amount_paid);
    
    if (total === 0) return 0;
    return Math.round((paid / total) * 100);
  }

  /**
   * Get production status display text
   */
  getProductionStatusDisplay(productionStatus: string): string {
    const statusMap: Record<string, string> = {
      'menunggu': 'Menunggu Pengerjaan',
      'diproses': 'Sedang Diproses',
      'selesai': 'Pengerjaan Selesai'
    };
    return statusMap[productionStatus] || productionStatus;
  }

  /**
   * Generate enhanced timeline (Legacy method for backward compatibility)
   */
  generateEnhancedTimeline(orderData: TrackingData): EnhancedTimelineItem[] {
    // Convert new timeline format to legacy format for backward compatibility
    const timeline = orderData.timeline || this.generateDocumentationCompliantTimeline(orderData);
    
    return timeline.map(item => ({
      timestamp: item.timestamp,
      title: item.milestone,
      description: item.description,
      type: item.category === 'payment' ? 'payment' : 'production',
      icon: item.icon.startsWith('fa') ? item.icon : 'fas fa-info-circle',
      status: item.status === 'completed' ? 'success' : 
              item.status === 'current' ? 'info' : 'warning',
      completed: item.status === 'completed'
    }));
  }

  /**
   * Get simple explanation for order (Updated Timeline API)
   */
  getSimpleExplanation(orderData: TrackingData): string {
    const currentStage = orderData.current_stage || this.getDocumentationCurrentStage(orderData);
    
    switch (currentStage.code) {
      case 'payment':
        return 'Menunggu pembayaran untuk memulai produksi pesanan Anda.';
      case 'production':
        return 'Tim produksi sedang mengerjakan pesanan Anda dengan penuh perhatian.';
      case 'completed':
        return 'Pesanan telah selesai dengan sempurna.';
      case 'cancelled':
        return 'Pesanan telah dibatalkan.';
      default:
        return 'Status pesanan sedang diperbarui.';
    }
  }

  /**
   * Start auto-refresh for order tracking with rate limiting awareness
   */
  startAutoRefresh(orderCode: string, onUpdate: (data: TrackingResponse) => void, interval: number = 60000): number {
    // Increased interval to 60 seconds to respect rate limiting (10 req/min)
    const refreshInterval = setInterval(async () => {
      try {
        this.invalidateCache(orderCode); // Force fresh data
        const data = await this.trackOrder(orderCode);
        onUpdate(data);
        console.log('📱 Timeline auto-refreshed (respecting rate limits)');
      } catch (error: any) {
        if (error.status === 429) {
          console.warn('⚠️ Rate limit hit during auto-refresh, will retry next interval');
        } else {
          console.error('Auto-refresh error:', error);
        }
      }
    }, interval);

    return refreshInterval;
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(intervalId: number): void {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }

  /**
   * Get estimated completion time for current stage
   */
  getEstimatedCompletion(orderData: TrackingData): string | null {
    const timeline = orderData.timeline || [];
    const currentItem = timeline.find(item => item.status === 'current');
    
    if (currentItem?.estimated_completion) {
      return this.formatEstimatedDate(currentItem.estimated_completion);
    }
    
    return null;
  }

  /**
   * Get timeline statistics for analytics
   */
  getTimelineStats(orderData: TrackingData): {
    totalMilestones: number;
    completedMilestones: number;
    pendingMilestones: number;
    estimatedMilestones: number;
    categoryCounts: Record<string, number>;
  } {
    const timeline = orderData.timeline || [];
    
    const stats = {
      totalMilestones: timeline.length,
      completedMilestones: timeline.filter(t => t.status === 'completed').length,
      pendingMilestones: timeline.filter(t => t.status === 'pending').length,
      estimatedMilestones: timeline.filter(t => t.is_estimated).length,
      categoryCounts: {} as Record<string, number>
    };
    
    // Count by category
    timeline.forEach(item => {
      stats.categoryCounts[item.category] = (stats.categoryCounts[item.category] || 0) + 1;
    });
    
    return stats;
  }
}

// Legacy interface for backward compatibility
export interface EnhancedTimelineItem {
  timestamp: string;
  title: string;
  description: string;
  type: 'payment' | 'production';
  icon: string;
  status: 'success' | 'warning' | 'info' | 'danger' | 'primary';
  completed: boolean;
}

// Export singleton instance
export const trackingService = new TrackingService(); 