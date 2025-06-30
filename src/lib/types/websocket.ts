// src/lib/types/websocket.ts
// WebSocket Types - Sesuai dengan WEBSOCKET_INTEGRATION_GUIDE.md

import type { Order } from './order';

/**
 * Base WebSocket Message Structure
 */
export interface WebSocketMessage {
  type: string;
  payload: Record<string, any>;
  timestamp?: string;
}

/**
 * Connection State Management
 */
export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  authenticated: boolean;
  accessLevel: 'public' | 'authenticated';
  lastConnected: string | null;
  lastMessage: string | null;
}

/**
 * WebSocket Configuration
 */
export interface WebSocketConfig {
  baseUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

/**
 * Outgoing Message Types - Client to Server
 */
export interface OutgoingMessages {
  // Public access messages
  subscribe_order_by_code: {
    order_code: string;
  };
  get_order_by_code: {
    order_code: string;
  };
  unsubscribe_order: {
    order_code: string;
  };
  
  // Admin access messages
  subscribe_order: {
    order_id: number;
  };
  get_order_details: {
    order_id: number;
  };
  get_all_orders: {};
  
  // Universal messages
  ping: {};
}

/**
 * Incoming Message Types - Server to Client
 */
export interface IncomingMessagePayloads {
  // Connection messages
  connection_established: {
    message: string;
    access_level: 'public' | 'authenticated';
    authenticated: boolean;
    timestamp: string;
  };
  
  subscription_confirmed: {
    order_code?: string;
    order_id?: number;
    message: string;
    timestamp: string;
  };
  
  // Order data messages
  order_initial_data: {
    order_data?: Order;
    public_data?: PublicOrderData;
    message: string;
    timestamp: string;
  };
  
  // Update messages
  order_status_update: {
    order_code: string;
    order_id?: number;
    old_status: string;
    new_status: string;
    order_data?: Order;
    public_data?: PublicOrderData;
    message: string;
    timestamp: string;
  };
  
  order_payment_update: {
    order_code: string;
    order_id?: number;
    payment_type: string;
    amount: string;
    order_data?: Order;
    public_data?: PublicOrderData;
    message: string;
    timestamp: string;
  };
  
  order_production_update: {
    order_code: string;
    order_id?: number;
    old_status: string;
    new_status: string;
    order_data?: Order;
    public_data?: PublicOrderData;
    message: string;
    timestamp: string;
  };
  
  // Admin-only messages
  order_created: {
    order: Order;
    message: string;
    timestamp: string;
  };
  
  order_updated: {
    order: Order;
    message: string;
    timestamp: string;
  };
  
  order_deleted: {
    order_id: string;
    order_code: string;
    message: string;
    timestamp: string;
  };
  
  // System messages
  system_notification: {
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: string;
  };
  
  // Response messages
  order_details_response: {
    order_code: string;
    order_id?: number;
    order_data?: Order;
    public_data?: PublicOrderData;
    message: string;
    timestamp: string;
  };
  
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  
  pong: {
    timestamp: string;
    server_time: string;
    auth_status: boolean;
    access_level: string;
  };
}

/**
 * Public Order Data (Limited fields for customer access)
 */
export interface PublicOrderData {
  order_code: string;
  product_name: string;
  status_order: string;
  production_status: string;
  created_at: string;
  updated_at: string;
  quantity?: number;
  // Note: NO sensitive data like customer_name, email, phone, payment amounts
}

/**
 * WebSocket Event Handlers
 */
export type WebSocketEventHandler<T = any> = (data: T) => void;

/**
 * WebSocket Manager Events
 */
export interface WebSocketManagerEvents {
  // Connection events
  'connection:established': ConnectionState;
  'connection:lost': { code: number; reason: string; timestamp: string };
  'connection:error': { error: any; timestamp: string };
  'connection:reconnecting': { attempt: number; delay: number; timestamp: string };
  
  // Order events (mapped from server events)
  'order:created': IncomingMessagePayloads['order_created'];
  'order:updated': IncomingMessagePayloads['order_updated'];
  'order:deleted': IncomingMessagePayloads['order_deleted'];
  'order:status_update': IncomingMessagePayloads['order_status_update'];
  'order:payment_update': IncomingMessagePayloads['order_payment_update'];
  'order:production_update': IncomingMessagePayloads['order_production_update'];
  
  // System events
  'system:notification': IncomingMessagePayloads['system_notification'];
  'system:error': IncomingMessagePayloads['error'];
  
  // Raw message event
  'message:raw': WebSocketMessage;
}

/**
 * Notification for UI
 */
export interface UINotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  duration?: number; // Auto-hide duration in ms
}

/**
 * Environment Configuration
 */
export const WEBSOCKET_ENDPOINTS = {
  // New endpoints (recommended)
  PUBLIC_TRACKING: '/ws/order/tracking/',
  ADMIN_ORDERS: '/ws/admin/orders/',
  ADMIN_DASHBOARD: '/ws/admin/dashboard/',
  NOTIFICATIONS: '/ws/notifications/',
  
  // Legacy endpoints (deprecated)
  LEGACY_ADMIN_ORDERS: '/ws/orders/',
  LEGACY_ORDER_TRACKING: '/ws/orders/{order_code}/',
} as const;

/**
 * WebSocket URLs based on environment
 */
export const WEBSOCKET_CONFIG = {
  development: {
    		baseUrl: 'wss://f808-180-254-65-209.ngrok-free.app',
    reconnectAttempts: 10,
    reconnectDelay: 5000,
    heartbeatInterval: 30000,
  },
  production: {
    baseUrl: 'wss://f808-180-254-65-209.ngrok-free.app',
    reconnectAttempts: 20,
    reconnectDelay: 3000,
    heartbeatInterval: 30000,
  },
} as const;

/**
 * Utility type for WebSocket message validation
 */
export type WebSocketMessageType = keyof OutgoingMessages;
export type IncomingMessageType = keyof IncomingMessagePayloads; 