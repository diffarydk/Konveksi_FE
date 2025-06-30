// src/lib/services/WebSocketManager.ts
// Clean, Secure & Maintainable WebSocket Manager with Environment Awareness

import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { auth } from '$lib/stores/auth';
import type { 
  WebSocketMessage, 
  ConnectionState, 
  WebSocketConfig,
  OutgoingMessages,
  IncomingMessagePayloads,
  WebSocketEventHandler,
  WebSocketManagerEvents,
  PublicOrderData
} from '$lib/types/websocket';
import { 
  WEBSOCKET_ENDPOINTS, 
  WEBSOCKET_CONFIG 
} from '$lib/types/websocket';

/**
 * Helper to get WebSocket base URL from environment variables
 */
const getWsBaseUrl = (): string => {
  if (browser && import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  		return 'wss://f808-180-254-65-209.ngrok-free.app'; // Ngrok URL for client demo
};

/**
 * WebSocket Manager with Environment Awareness & Dual Access Pattern
 * 
 * Features:
 * - Environment-aware: Auto-detects development vs production
 * - Dual Access: Public (customer) & Admin (authenticated)
 * - Auto-reconnection with exponential backoff  
 * - Heartbeat monitoring
 * - Type-safe message handling
 * - Security-first design
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private currentEndpoint: string = '';
  private accessMode: 'public' | 'admin' = 'public';
  private currentAccessToken: string | null = null;
  
  // Connection state
  private connectionState: ConnectionState = {
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    authenticated: false,
    accessLevel: 'public',
    lastConnected: null,
    lastMessage: null
  };
  
  // Event system
  private eventListeners: Map<string, WebSocketEventHandler[]> = new Map();
  
  // Reconnection & heartbeat
  private reconnectTimeout: any = null;
  private heartbeatInterval: any = null;
  private connectionTimeout: any = null;
  
  // Singleton pattern
  private static instance: WebSocketManager | null = null;
  
  constructor() {
    if (!browser) {
      throw new Error('WebSocketManager can only be used in browser environment');
    }

    const baseUrl = getWsBaseUrl();
    const isProduction = baseUrl.startsWith('wss://');

    // Get base configuration and override with environment URL
    const baseConfig = isProduction ? WEBSOCKET_CONFIG.production : WEBSOCKET_CONFIG.development;
    
    this.config = {
      ...baseConfig,
      baseUrl: baseUrl,
    };
    
    console.log('🔌 WebSocketManager initialized:', { 
      environment: isProduction ? 'production' : 'development', 
      baseUrl: baseUrl,
      config: this.config 
    });
  }
  
  /**
   * Singleton getInstance method - Environment auto-detected from VITE_WS_BASE_URL
   */
  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }
  
  /**
   * Connect for Public Order Tracking (NO AUTHENTICATION REQUIRED)
   * Used for customer order tracking by order_code
   */
  async connectForPublicTracking(): Promise<void> {
    console.log('🔄 Connecting for PUBLIC order tracking...');
    this.accessMode = 'public';
    this.currentEndpoint = WEBSOCKET_ENDPOINTS.PUBLIC_TRACKING;
    return this.connect();
  }
  
  /**
   * Connect for Admin Dashboard (AUTHENTICATION REQUIRED)
   * Used for admin order management and monitoring
   * 
   * @param accessToken - JWT access token required for backend authentication
   */
  async connectForAdminDashboard(accessToken: string): Promise<void> {
    console.log('🔄 Connecting for ADMIN dashboard...');
    
    if (!accessToken || accessToken.trim() === '') {
      throw new Error('Access token is required for admin WebSocket connection');
    }
    
    // Validate JWT token format (basic check)
    if (!this.isValidJWTFormat(accessToken)) {
      throw new Error('Invalid JWT token format');
    }

    // Check if already connected with same token
    if (this.isConnected() && this.accessMode === 'admin' && this.currentAccessToken === accessToken) {
      console.log('✅ Admin WebSocket already connected with same token, skipping duplicate connection');
      return;
    }

    // Check if currently connecting
    if (this.connectionState.connecting) {
      console.log('⏳ WebSocket already connecting, waiting for completion...');
      // Wait a bit for current connection to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (this.isConnected()) {
        console.log('✅ Connection completed while waiting');
        return;
      }
    }
    
    this.accessMode = 'admin';
    this.currentEndpoint = WEBSOCKET_ENDPOINTS.ADMIN_ORDERS;
    this.currentAccessToken = accessToken;
    
    // Build WebSocket URL with JWT token as query parameter
    const wsUrl = `${this.config.baseUrl}${this.currentEndpoint}?token=${encodeURIComponent(accessToken)}`;
    
    console.log(`🔑 Admin WebSocket URL: ${this.config.baseUrl}${this.currentEndpoint}?token=***[REDACTED]***`);
    console.log('🎯 Starting admin WebSocket connection with JWT authentication...');
    
    try {
      await this.connectWithUrl(wsUrl);
      console.log('✅ Admin WebSocket connected successfully with JWT token');
    } catch (error) {
      console.error('❌ Failed to connect admin WebSocket with JWT token:', error);
      throw new Error(`WebSocket connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Basic JWT format validation
   */
  private isValidJWTFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
  
  /**
   * Connect for Admin Order Management (AUTHENTICATION REQUIRED)
   * Alias for connectForAdminDashboard for backward compatibility
   */
  async connectForAdminOrders(accessToken: string): Promise<void> {
    return this.connectForAdminDashboard(accessToken);
  }
  
  /**
   * Subscribe to order updates by order_code (PUBLIC ACCESS)
   */
  subscribeToOrderByCode(orderCode: string): void {
    if (this.accessMode !== 'public') {
      console.warn('⚠️ subscribeToOrderByCode should be used with public access mode');
    }
    
    this.sendMessage('subscribe_order_by_code', { order_code: orderCode });
    console.log(`📝 Subscribed to order tracking: ${orderCode}`);
  }
  
  /**
   * Subscribe to order updates by order_id (ADMIN ACCESS)
   */
  subscribeToOrderById(orderId: number): void {
    if (this.accessMode !== 'admin') {
      console.warn('⚠️ subscribeToOrderById requires admin access mode');
      return;
    }
    
    this.sendMessage('subscribe_order', { order_id: orderId });
    console.log(`📝 Subscribed to order: ${orderId}`);
  }
  
  /**
   * Get order details by order_code (PUBLIC ACCESS)
   */
  getOrderDetailsByCode(orderCode: string): void {
    this.sendMessage('get_order_by_code', { order_code: orderCode });
    console.log(`🔍 Requesting order details for: ${orderCode}`);
  }
  
  /**
   * Get order details by order_id (ADMIN ACCESS)
   */
  getOrderDetailsById(orderId: number): void {
    if (this.accessMode !== 'admin') {
      console.warn('⚠️ getOrderDetailsById requires admin access mode');
      return;
    }
    
    this.sendMessage('get_order_details', { order_id: orderId });
    console.log(`🔍 Requesting order details for ID: ${orderId}`);
  }
  
  /**
   * Unsubscribe from order updates
   */
  unsubscribeFromOrder(orderCode: string): void {
    this.sendMessage('unsubscribe_order', { order_code: orderCode });
    console.log(`📝 Unsubscribed from order: ${orderCode}`);
  }
  
  /**
   * Core connection method
   */
  private async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('📡 WebSocket already connected');
      return;
    }
    
    // Build URL with token for admin mode
    let wsUrl = `${this.config.baseUrl}${this.currentEndpoint}`;
    
    // Add JWT token for admin connections
    if (this.accessMode === 'admin' && this.currentAccessToken) {
      wsUrl += `?token=${encodeURIComponent(this.currentAccessToken)}`;
      console.log(`🔌 Connecting to: ${this.config.baseUrl}${this.currentEndpoint}?token=***[REDACTED]*** (${this.accessMode} mode)`);
    } else {
      console.log(`🔌 Connecting to: ${wsUrl} (${this.accessMode} mode)`);
    }
    
    return this.connectWithUrl(wsUrl);
  }

  /**
   * Connect with specific URL (supports JWT token in query parameters)
   */
  private async connectWithUrl(wsUrl: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('📡 WebSocket already connected');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.cleanup();
        this.updateConnectionState({ connecting: true, error: null });
        
        this.ws = new WebSocket(wsUrl);
        this.setupEventHandlers();
        
        // Connection timeout
        this.connectionTimeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error('Connection timeout'));
        }, 10000);
        
        // Resolve promise on successful connection
        const onOpen = () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          resolve();
        };
        
        const onError = (error: Event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          reject(error);
        };
        
        this.ws.addEventListener('open', onOpen, { once: true });
        this.ws.addEventListener('error', onError, { once: true });
        
      } catch (error) {
        this.updateConnectionState({ connecting: false, error: 'Connection failed' });
        reject(error);
      }
    });
  }
  
  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log(`✅ WebSocket connected (${this.accessMode} mode)`);
      
      this.updateConnectionState({
        connected: true,
        connecting: false,
        error: null,
        reconnectAttempts: 0,
        authenticated: this.accessMode === 'admin',
        accessLevel: this.accessMode === 'admin' ? 'authenticated' : 'public',
        lastConnected: new Date().toISOString()
      });
      
      this.startHeartbeat();
      this.emit('connection:established', this.connectionState);
      
      // Send initial ping
      this.sendMessage('ping', {});
    };
    
    this.ws.onmessage = (event) => {
      this.updateConnectionState({ lastMessage: new Date().toISOString() });
      
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
        this.emit('system:error', {
          code: 'PARSE_ERROR',
          message: 'Failed to parse incoming message',
          details: { error, rawData: event.data },
          timestamp: new Date().toISOString()
        });
      }
    };
    
    this.ws.onclose = (event) => {
      console.log(`🔴 WebSocket closed: ${event.code} - ${event.reason}`);
      
      this.updateConnectionState({
        connected: false,
        connecting: false
      });
      
      this.stopHeartbeat();
      
      this.emit('connection:lost', {
        code: event.code,
        reason: event.reason,
        timestamp: new Date().toISOString()
      });
      
      // Auto-reconnect unless manually closed
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      
      this.updateConnectionState({
        error: 'WebSocket connection error'
      });
      
      this.emit('connection:error', {
        error,
        timestamp: new Date().toISOString()
      });
    };
  }
  
  /**
   * Handle incoming messages with type safety and security filtering
   */
  private handleIncomingMessage(message: WebSocketMessage): void {
    const { type, payload } = message;
    
    console.log(`📨 Received [${this.accessMode}]:`, type, payload);
    
    // Security: Filter sensitive data for public access
    if (this.accessMode === 'public' && payload.order_data) {
      const filteredPayload = {
        ...payload,
        order_data: undefined,
        public_data: payload.public_data || this.createPublicOrderData(payload.order_data)
      };
      message.payload = filteredPayload;
    }
    
    // Emit raw message
    this.emit('message:raw', message);
    
    // Handle specific message types
    switch (type) {
      case 'connection_established':
        this.handleConnectionEstablished(payload);
        break;
        
      case 'order_created':
        if (this.accessMode === 'admin') {
          this.emit('order:created', payload as any);
        }
        break;
        
      case 'order_updated':
        if (this.accessMode === 'admin') {
          this.emit('order:updated', payload as any);
        }
        break;
        
      case 'order_deleted':
        if (this.accessMode === 'admin') {
          this.emit('order:deleted', payload as any);
        }
        break;
        
      case 'order_status_update':
        this.emit('order:status_update', payload as any);
        break;
        
      case 'order_payment_update':
        this.emit('order:payment_update', payload as any);
        break;
        
      case 'order_production_update':
        this.emit('order:production_update', payload as any);
        break;
        
      case 'system_notification':
        this.emit('system:notification', payload as any);
        break;
        
      case 'error':
        this.emit('system:error', payload as any);
        break;
        
      case 'pong':
        console.log('🏓 Pong received:', payload);
        break;
        
      case 'admin_order_update':
        // Handle different types of admin order updates from backend
        console.log(`📨 Admin order update: ${payload.update_type} for ${payload.order_code}`);
        
        switch (payload.update_type) {
          case 'payment_updated':
            this.emit('order:payment_update', payload as any);
            break;
          case 'status_changed':
            this.emit('order:status_update', payload as any);
            break;
          case 'production_updated':
            this.emit('order:production_update', payload as any);
            break;
          case 'order_created':
            this.emit('order:created', payload as any);
            break;
          case 'order_updated':
            this.emit('order:updated', payload as any);
            break;
          case 'order_deleted':
            this.emit('order:deleted', payload as any);
            break;
          default:
            console.log(`📦 Generic admin order update: ${payload.update_type}`);
            this.emit('order:updated', payload as any);
        }
        break;
        
      default:
        console.log(`❓ Unknown message type: ${type}`);
    }
  }
  
  /**
   * Handle connection established message
   */
  private handleConnectionEstablished(payload: any): void {
    console.log(`🔗 Connection established with access level: ${payload.access_level}`);
    
    this.updateConnectionState({
      authenticated: payload.authenticated || false,
      accessLevel: payload.access_level || 'public'
    });
  }
  
  /**
   * Create public order data (filter sensitive information)
   */
  private createPublicOrderData(orderData: any): PublicOrderData | undefined {
    if (!orderData) return undefined;
    
    return {
      order_code: orderData.order_code || '',
      product_name: orderData.product_name || '',
      status_order: orderData.status_order || '',
      production_status: orderData.production_status || '',
      created_at: orderData.created_at || '',
      updated_at: orderData.updated_at || '',
      quantity: orderData.quantity
    };
  }
  
    /**
   * Send message to server with type safety
   */
  sendMessage<T extends keyof OutgoingMessages>(
    type: T, 
    payload: OutgoingMessages[T]
  ): void {
    if (!this.isConnected()) {
      console.warn(`⚠️ Cannot send message: WebSocket not connected`);
      console.debug(`📊 WebSocket Debug: ws=${!!this.ws}, readyState=${this.ws?.readyState}, connected=${this.connectionState.connected}, accessMode=${this.accessMode}`);
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    this.ws!.send(JSON.stringify(message));
    console.log(`📤 Sent [${this.accessMode}]:`, type, payload);
  }
  
  /**
   * Subscribe to events with type safety
   */
  on<T extends keyof WebSocketManagerEvents>(
    event: T,
    handler: WebSocketEventHandler<WebSocketManagerEvents[T]>
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }
  
  /**
   * Unsubscribe from events
   */
  off<T extends keyof WebSocketManagerEvents>(
    event: T,
    handler: WebSocketEventHandler<WebSocketManagerEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Emit event to all listeners
   */
  private emit<T extends keyof WebSocketManagerEvents>(
    event: T,
    data: WebSocketManagerEvents[T]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error('🚫 Max reconnection attempts reached');
      this.updateConnectionState({
        error: 'Max reconnection attempts reached'
      });
      return;
    }
    
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts),
      30000
    );
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.connectionState.reconnectAttempts + 1})`);
    
    this.updateConnectionState({
      reconnectAttempts: this.connectionState.reconnectAttempts + 1
    });
    
    this.emit('connection:reconnecting', {
      attempt: this.connectionState.reconnectAttempts,
      delay: delay,
      timestamp: new Date().toISOString()
    });
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('🚫 Reconnection failed:', error);
      });
    }, delay);
  }
  
  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage('ping', {});
      }
    }, this.config.heartbeatInterval);
  }
  
  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Update connection state
   */
  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
  }
  
  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.connectionState.connected;
  }
  
  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }
  
  /**
   * Get current access mode
   */
  getAccessMode(): 'public' | 'admin' {
    return this.accessMode;
  }
  
  /**
   * Force reconnection (resets attempts counter)
   */
  async forceReconnect(): Promise<void> {
    console.log('🔄 Force reconnecting...');
    
    this.updateConnectionState({
      reconnectAttempts: 0,
      error: null
    });
    
    // Refresh token from auth store for admin mode
    let preservedToken: string | null = null;
    if (this.accessMode === 'admin') {
      try {
        const { auth } = await import('$lib/stores/auth');
        const { get } = await import('svelte/store');
        const authState = get(auth);
        
        if (authState.accessToken) {
          preservedToken = authState.accessToken;
          console.log('🔑 Refreshed JWT token for reconnection');
        } else {
          console.warn('⚠️ No access token available for admin reconnection');
        }
      } catch (error) {
        console.error('❌ Failed to refresh token for reconnection:', error);
      }
    }
    
    // Disconnect without clearing token
    this.disconnectOnly();
    
    // Restore token after disconnect  
    if (preservedToken) {
      this.currentAccessToken = preservedToken;
      console.log('🔑 Token preserved during reconnection');
    }
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('🚫 Force reconnection failed:', error);
      });
    }, 1000);
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket...');
    
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    // Clear token on disconnect
    this.currentAccessToken = null;
    
    this.updateConnectionState({
      connected: false,
      connecting: false,
      reconnectAttempts: 0
    });
  }
  
  /**
   * Disconnect WebSocket without clearing token (for force reconnect)
   */
  private disconnectOnly(): void {
    console.log('🔌 Disconnecting WebSocket (preserving token)...');
    
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.updateConnectionState({
      connected: false,
      connecting: false,
      reconnectAttempts: 0
    });
  }
  
  /**
   * Cleanup timers and intervals
   */
  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.stopHeartbeat();
  }
  
  /**
   * Destroy manager and cleanup resources
   */
  destroy(): void {
    console.log('🧹 Destroying WebSocketManager...');
    
    this.disconnect();
    this.eventListeners.clear();
    
    WebSocketManager.instance = null;
  }
}

/**
 * Factory function to create WebSocket managers
 */
export function createWebSocketManager(
  type: 'public' | 'admin'
): WebSocketManager {
  const manager = WebSocketManager.getInstance();
  
  if (type === 'admin') {
    // For admin, ensure connection method is called appropriately
    return manager;
  } else {
    // For public, return manager ready for public tracking
    return manager;
  }
}

/**
 * Get the singleton instance
 */
export function getWebSocketManager(): WebSocketManager {
  return WebSocketManager.getInstance();
} 