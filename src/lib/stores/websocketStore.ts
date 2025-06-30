// src/lib/stores/websocketStore.ts
// Svelte stores for WebSocket state management with WebSocketManager integration

import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { 
  ConnectionState, 
  UINotification, 
  PublicOrderData,
  WebSocketMessage
} from '$lib/types/websocket';
import type { Order } from '$lib/types/order';

/**
 * WebSocket connection state store
 */
export const connectionState = writable<ConnectionState>({
  connected: false,
  connecting: false,
  error: null,
  reconnectAttempts: 0,
  authenticated: false,
  accessLevel: 'public',
  lastConnected: null,
  lastMessage: null
});

/**
 * Last received WebSocket message
 */
export const lastMessage = writable<WebSocketMessage | null>(null);

/**
 * Order data for public tracking (indexed by order_code)
 */
export const orderData = writable<Record<string, PublicOrderData | Order>>({});

/**
 * Admin orders data (full order objects, indexed by order_id)
 */
export const adminOrdersData = writable<Record<string, Order>>({});

/**
 * UI notifications
 */
export const notifications = writable<UINotification[]>([]);

/**
 * Derived store for connection status indicator
 */
export const connectionStatus: Readable<{
  text: string;
  color: string;
  emoji: string;
}> = derived(connectionState, ($state) => {
  if ($state.connecting) {
    return {
      text: 'Connecting...',
      color: 'orange',
      emoji: '🔄'
    };
  } else if ($state.connected) {
    return {
      text: `Connected (${$state.accessLevel})`,
      color: 'green',
      emoji: '🟢'
    };
  } else if ($state.error) {
    return {
      text: $state.error,
      color: 'red',
      emoji: '🔴'
    };
  } else {
    return {
      text: 'Disconnected',
      color: 'gray',
      emoji: '⚫'
    };
  }
});

/**
 * Derived store for showing reconnection attempts
 */
export const reconnectionInfo: Readable<string | null> = derived(
  connectionState,
  ($state) => {
    if ($state.reconnectAttempts > 0 && !$state.connected) {
      return `Reconnecting... (attempt ${$state.reconnectAttempts})`;
    }
    return null;
  }
);

/**
 * Helper functions for managing stores
 */
export const websocketStoreActions = {
  /**
   * Add a notification to the notifications store
   */
  addNotification(notification: Omit<UINotification, 'id' | 'timestamp'>): void {
    const newNotification: UINotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...notification
    };

    notifications.update(current => {
      // Add new notification at the beginning and limit to 10
      const updated = [newNotification, ...current].slice(0, 10);
      return updated;
    });
  },

  /**
   * Remove a notification by ID
   */
  removeNotification(id: string): void {
    notifications.update(current => 
      current.filter(notification => notification.id !== id)
    );
  },

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    notifications.set([]);
  },

  /**
   * Update order data for public tracking
   */
  updateOrderData(orderCode: string, data: PublicOrderData | Order): void {
    orderData.update(current => ({
      ...current,
      [orderCode]: data
    }));
  },

  /**
   * Remove order data
   */
  removeOrderData(orderCode: string): void {
    orderData.update(current => {
      const updated = { ...current };
      delete updated[orderCode];
      return updated;
    });
  },

  /**
   * Update admin orders data
   */
  updateAdminOrder(orderId: string, data: Order): void {
    adminOrdersData.update(current => ({
      ...current,
      [orderId]: data
    }));
  },

  /**
   * Remove admin order data
   */
  removeAdminOrder(orderId: string): void {
    adminOrdersData.update(current => {
      const updated = { ...current };
      delete updated[orderId];
      return updated;
    });
  },

  /**
   * Clear all order data
   */
  clearOrderData(): void {
    orderData.set({});
    adminOrdersData.set({});
  },

  /**
   * Reset all WebSocket stores to initial state
   */
  resetAll(): void {
    connectionState.set({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0,
      authenticated: false,
      accessLevel: 'public',
      lastConnected: null,
      lastMessage: null
    });
    
    lastMessage.set(null);
    orderData.set({});
    adminOrdersData.set({});
    notifications.set([]);
  },

  /**
   * Update connection state from WebSocketManager
   */
  updateConnectionState(newState: Partial<ConnectionState>): void {
    connectionState.update(current => ({
      ...current,
      ...newState
    }));
  }
};

/**
 * WebSocketManager Integration Service
 * Sync WebSocketManager state with Svelte stores
 */
class WebSocketStoreSync {
  private wsManager: any = null;
  private isInitialized = false;

  async initializeSync(): Promise<void> {
    if (!browser || this.isInitialized) return;

    try {
      // Dynamic import to avoid SSR issues
      const { WebSocketManager } = await import('$lib/services/WebSocketManager');
      this.wsManager = WebSocketManager.getInstance();
      
      this.setupEventListeners();
      this.syncInitialState();
      this.isInitialized = true;

      console.log('🔗 WebSocketStore sync initialized with WebSocketManager (listener mode only)');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocketStore sync:', error);
    }
  }

  private setupEventListeners(): void {
    if (!this.wsManager) return;

    // Connection events
    this.wsManager.on('connection:established', (data: any) => {
      websocketStoreActions.updateConnectionState({
        connected: true,
        connecting: false,
        error: null,
        lastConnected: new Date().toISOString()
      });

      websocketStoreActions.addNotification({
        type: 'success',
        message: 'WebSocket connection established'
      });

      // Sync full state
      this.syncCurrentState();
    });

    this.wsManager.on('connection:lost', (data: any) => {
      websocketStoreActions.updateConnectionState({
        connected: false,
        connecting: false,
        error: data.reason || 'Connection lost'
      });

      websocketStoreActions.addNotification({
        type: 'warning',
        message: `Connection lost: ${data.reason || 'Unknown reason'}`
      });
    });

    this.wsManager.on('connection:error', (data: any) => {
      websocketStoreActions.updateConnectionState({
        connected: false,
        connecting: false,
        error: 'Connection error occurred'
      });

      websocketStoreActions.addNotification({
        type: 'error',
        message: 'WebSocket connection error'
      });
    });

    this.wsManager.on('connection:reconnecting', (data: any) => {
      websocketStoreActions.updateConnectionState({
        connecting: true,
        reconnectAttempts: data.attempt || 0
      });

      websocketStoreActions.addNotification({
        type: 'info',
        message: `Reconnecting... (attempt ${data.attempt || 0})`
      });
    });

    // Order events
    this.wsManager.on('order:created', (data: any) => {
      if (data.order) {
        websocketStoreActions.updateAdminOrder(data.order.id?.toString(), data.order);
      }

      websocketStoreActions.addNotification({
        type: 'success',
        message: `New order created: ${data.order?.order_code || 'Unknown'}`
      });
    });

    this.wsManager.on('order:updated', (data: any) => {
      if (data.order) {
        websocketStoreActions.updateAdminOrder(data.order.id?.toString(), data.order);
      }

      websocketStoreActions.addNotification({
        type: 'info',
        message: `Order updated: ${data.order?.order_code || 'Unknown'}`
      });
    });

    this.wsManager.on('order:status_update', (data: any) => {
      websocketStoreActions.addNotification({
        type: 'info',
        message: `Order status changed: ${data.order_code} → ${data.new_status}`
      });
    });

    this.wsManager.on('order:payment_update', (data: any) => {
      websocketStoreActions.addNotification({
        type: 'success',
        message: `Payment updated: ${data.order_code} → ${data.payment_type}`
      });
    });

    // System events
    this.wsManager.on('system:notification', (data: any) => {
      websocketStoreActions.addNotification({
        type: 'info',
        message: data.message || 'System notification'
      });
    });

    this.wsManager.on('system:error', (data: any) => {
      websocketStoreActions.addNotification({
        type: 'error',
        message: data.message || 'System error occurred'
      });
    });

    // Raw message tracking
    this.wsManager.on('message:raw', (data: any) => {
      lastMessage.set(data);
      websocketStoreActions.updateConnectionState({
        lastMessage: new Date().toISOString()
      });
    });
  }

  private syncInitialState(): void {
    if (!this.wsManager) return;

    // Get current state from WebSocketManager
    const currentState = this.wsManager.getConnectionState();
    
    websocketStoreActions.updateConnectionState(currentState);
  }

  private syncCurrentState(): void {
    if (!this.wsManager) return;

    // Get current state from WebSocketManager
    const currentState = this.wsManager.getConnectionState();
    const accessMode = this.wsManager.getAccessMode();
    
    websocketStoreActions.updateConnectionState({
      ...currentState,
      accessLevel: accessMode === 'admin' ? 'authenticated' : 'public'
    });
  }

  // Manual sync method for periodic updates
  syncState(): void {
    this.syncCurrentState();
  }

  // Cleanup method
  destroy(): void {
    this.isInitialized = false;
    this.wsManager = null;
  }
}

// Create singleton instance
const webSocketStoreSync = new WebSocketStoreSync();

/**
 * Initialize WebSocket store synchronization with WebSocketManager
 * Call this once in your app initialization
 */
export async function initializeWebSocketStoreSync(): Promise<void> {
  await webSocketStoreSync.initializeSync();
}

/**
 * Manual sync with WebSocketManager (useful for debugging)
 */
export function syncWebSocketState(): void {
  webSocketStoreSync.syncState();
}

/**
 * Auto-initialize removed to prevent conflicts with manual initialization
 * Use initializeWebSocketStoreSync() or call it from +layout.svelte
 */ 