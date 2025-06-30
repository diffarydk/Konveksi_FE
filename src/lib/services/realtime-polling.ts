// Smart Polling Service - Tahap 1 menuju Real-time
// Transisi dari refresh manual ke WebSocket nantinya

export interface PollingConfig {
  baseInterval: number;
  maxInterval: number;
  businessHoursMultiplier: number;
  backoffMultiplier: number;
  maxRetries: number;
}

export interface UpdateEvent {
  type: 'order_update' | 'payment_update' | 'status_change';
  data: any;
  timestamp: string;
}

export class SmartPollingService {
  private config: PollingConfig;
  private currentInterval: number;
  private retryCount: number = 0;
  private pollingTimer: number | null = null;
  private lastUpdate: string | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private isActive: boolean = false;
  private lastDataHash: string = '';

  constructor(config: Partial<PollingConfig> = {}) {
    this.config = {
      baseInterval: 30000, // 30 seconds base interval
      maxInterval: 300000, // 5 minutes max interval
      businessHoursMultiplier: 0.5, // 2x faster during business hours
      backoffMultiplier: 1.5, // Slow down on errors
      maxRetries: 3,
      ...config
    };
    this.currentInterval = this.config.baseInterval;
  }

  /**
   * Start intelligent polling
   */
  start(): void {
    if (this.isActive) {
      console.log('🔄 Smart polling already active');
      return;
    }

    this.isActive = true;
    this.retryCount = 0;
    this.scheduleNextPoll();
    console.log('🚀 Smart polling started');
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isActive = false;
    console.log('⏹️ Smart polling stopped');
  }

  /**
   * Add event listener
   */
  on(eventType: string, callback: Function): () => void {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Trigger immediate poll
   */
  async pollNow(): Promise<void> {
    if (!this.isActive) {
      console.log('⚠️ Polling not active, starting...');
      this.start();
      return;
    }

    // Cancel current timer and poll immediately
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }

    await this.performPoll();
    this.scheduleNextPoll();
  }

  /**
   * Calculate smart interval based on business hours and recent activity
   */
  private calculateSmartInterval(): number {
    const now = new Date();
    const hour = now.getHours();
    const isBusinessHours = hour >= 8 && hour <= 22;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    let interval = this.config.baseInterval;

    // Faster during business hours
    if (isBusinessHours && !isWeekend) {
      interval *= this.config.businessHoursMultiplier;
    }

    // Slower on weekends
    if (isWeekend) {
      interval *= 2;
    }

    // Backoff on errors
    if (this.retryCount > 0) {
      interval *= Math.pow(this.config.backoffMultiplier, this.retryCount);
    }

    // Ensure within bounds
    interval = Math.min(interval, this.config.maxInterval);
    interval = Math.max(interval, 5000); // Minimum 5 seconds

    return interval;
  }

  /**
   * Schedule next poll with smart interval
   */
  private scheduleNextPoll(): void {
    if (!this.isActive) return;

    this.currentInterval = this.calculateSmartInterval();
    
    this.pollingTimer = setTimeout(async () => {
      await this.performPoll();
      this.scheduleNextPoll();
    }, this.currentInterval);

    console.log(`⏰ Next poll in ${this.currentInterval/1000}s (business: ${this.isBusinessHours()})`);
  }

  /**
   * Perform the actual polling
   */
  private async performPoll(): Promise<void> {
    try {
      console.log('📡 Smart polling - fetching updates...');
      
      // Call API dengan timestamp terakhir untuk efisiensi
      const params = new URLSearchParams();
      if (this.lastUpdate) {
        params.append('since', this.lastUpdate);
      }

      		const response = await fetch(`https://f808-180-254-65-209.ngrok-free.app/api/v1/order/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if data actually changed using hash
      const dataHash = this.calculateDataHash(data);
      if (dataHash === this.lastDataHash) {
        console.log('📊 No changes detected, skipping update');
        this.retryCount = 0; // Reset retry count on successful poll
        return;
      }

      this.lastDataHash = dataHash;
      this.lastUpdate = new Date().toISOString();
      this.retryCount = 0;

      // Emit update events
      this.emit('data_update', {
        type: 'order_update',
        data: data,
        timestamp: this.lastUpdate,
        changeDetected: true
      });

      // Analyze changes and emit specific events
      this.analyzeAndEmitChanges(data);

      console.log('✅ Smart poll completed successfully');

    } catch (error) {
      console.error('❌ Smart polling error:', error);
      this.retryCount = Math.min(this.retryCount + 1, this.config.maxRetries);
      
      this.emit('polling_error', {
        error: error,
        retryCount: this.retryCount,
        nextInterval: this.calculateSmartInterval()
      });
    }
  }

  /**
   * Calculate simple hash of data to detect changes
   */
  private calculateDataHash(data: any): string {
    return btoa(JSON.stringify(data)).slice(0, 16);
  }

  /**
   * Analyze changes and emit specific events
   */
  private analyzeAndEmitChanges(data: any): void {
    if (!data.results) return;

    // Check for payment status changes
    const paidOrders = data.results.filter((order: any) => 
      order.status_order === 'lunas' || order.status_order === 'dp_dibayar'
    );

    if (paidOrders.length > 0) {
      this.emit('payment_update', {
        type: 'payment_update',
        data: paidOrders,
        timestamp: new Date().toISOString(),
        count: paidOrders.length
      });
    }

    // Check for status changes
    const recentlyUpdated = data.results.filter((order: any) => {
      const updatedTime = new Date(order.updated_at).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return updatedTime > fiveMinutesAgo;
    });

    if (recentlyUpdated.length > 0) {
      this.emit('status_change', {
        type: 'status_change',
        data: recentlyUpdated,
        timestamp: new Date().toISOString(),
        count: recentlyUpdated.length
      });
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(eventType: string, data: any): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} callback:`, error);
        }
      });
    }
  }

  /**
   * Check if currently in business hours
   */
  private isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    return hour >= 8 && hour <= 22 && !isWeekend;
  }

  /**
   * Get current polling status
   */
  getStatus(): {
    isActive: boolean;
    currentInterval: number;
    retryCount: number;
    lastUpdate: string | null;
    nextPollIn: number | null;
  } {
    const nextPollIn = this.pollingTimer ? this.currentInterval : null;
    
    return {
      isActive: this.isActive,
      currentInterval: this.currentInterval,
      retryCount: this.retryCount,
      lastUpdate: this.lastUpdate,
      nextPollIn
    };
  }

  /**
   * Force faster polling for next few cycles (for critical updates)
   */
  boostPolling(cycles: number = 3): void {
    console.log(`🚀 Boosting polling speed for ${cycles} cycles`);
    
    const originalInterval = this.config.baseInterval;
    this.config.baseInterval = 10000; // 10 seconds for critical updates
    
    const resetAfterCycles = () => {
      cycles--;
      if (cycles <= 0) {
        this.config.baseInterval = originalInterval;
        console.log('📉 Polling speed reset to normal');
      } else {
        setTimeout(resetAfterCycles, this.currentInterval);
      }
    };
    
    setTimeout(resetAfterCycles, this.currentInterval);
  }
}

// Singleton instance
export const smartPolling = new SmartPollingService({
  baseInterval: 30000, // 30s for payment updates
  businessHoursMultiplier: 0.7, // Faster during business hours
  maxRetries: 5
}); 