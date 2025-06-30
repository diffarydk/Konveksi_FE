// Orders Store dengan Real-time WebSocket Integration - API v2.0
// Sepenuhnya real-time dengan fallback strategy ke smart polling

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { api } from '$lib/services/api';
import { WebSocketManager } from '$lib/services/WebSocketManager';
import { 
  connectionState, 
  adminOrdersData, 
  websocketStoreActions 
} from '$lib/stores/websocketStore';
import type { Order } from '$lib/types/order';
import { smartPolling } from '$lib/services/realtime-polling';

// Interface sesuai dengan API response
interface OrdersResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Order[];
}

interface CreateOrderResponse {
    order: Order;
    invoice: {
        id: string;
        invoice_code: string;
        payment_url: string;
        invoice_amount: string;
    };
    message: string;
}

interface RealtimeStatus {
    websocketConnected: boolean;
    pollingActive: boolean;
    fallbackMode: boolean;
    lastUpdate: string | null;
}

class OrdersStore {
    private ordersStore = writable<Order[]>([]);
    private loadingStore = writable<boolean>(false);
    private errorStore = writable<string>('');
    private realtimeStatusStore = writable<RealtimeStatus>({
        websocketConnected: false,
        pollingActive: false,
        fallbackMode: false,
        lastUpdate: null
    });

    // WebSocket manager for real-time updates
    private wsManager: WebSocketManager | null = null;
    private wsUnsubscribers: (() => void)[] = [];
    private isRealtimeInitialized = false;
    private fallbackActive = false;

    constructor() {
        // Note: WebSocket initialization is now deferred
        // Will be called from initRealtimeConnection() after auth is ready
        console.log('📦 OrdersStore initialized (WebSocket deferred until auth ready)');
    }

    // Subscribe methods
    get subscribe() {
        return this.ordersStore.subscribe;
    }

    get loading() {
        return this.loadingStore;
    }

    get error() {
        return this.errorStore;
    }

    get realtimeStatus() {
        return this.realtimeStatusStore;
    }

    // Clear error state
    clearError() {
        this.errorStore.set('');
    }

    /**
     * Initialize real-time connection (PUBLIC METHOD - called after auth is ready)
     */
    async initRealtimeConnection(): Promise<void> {
        if (!browser) {
            console.log('⚠️ Not in browser environment, skipping WebSocket initialization');
            return;
        }

        if (this.isRealtimeInitialized) {
            console.log('⚠️ OrdersStore WebSocket already initialized, skipping duplicate initialization');
            return;
        }

        console.log('🔌 OrdersStore: Initializing real-time connection after auth confirmation...');
        
        try {
            // Get singleton WebSocket instance
            this.wsManager = WebSocketManager.getInstance();
            
            // Check if WebSocket is already connected (may be connected by websocketStore)
            if (this.wsManager.isConnected()) {
                console.log('✅ OrdersStore: Using existing WebSocket connection');
                this.setupWebSocketListeners();
                this.isRealtimeInitialized = true;
                
                // Update realtime status
                this.updateRealtimeStatus({
                    websocketConnected: true,
                    fallbackMode: false,
                    lastUpdate: new Date().toISOString()
                });
            } else {
                // Initialize new connection only if not already connected
                await this.initializeWebSocket();
                this.isRealtimeInitialized = true;
                console.log('✅ OrdersStore: Real-time connection initialized successfully');
                
                // Update realtime status
                this.updateRealtimeStatus({
                    websocketConnected: true,
                    fallbackMode: false,
                    lastUpdate: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('❌ OrdersStore: Failed to initialize real-time connection:', error);
            this.updateRealtimeStatus({
                websocketConnected: false,
                fallbackMode: true,
                lastUpdate: new Date().toISOString()
            });
            // Continue operation without WebSocket
        }
    }

    /**
     * Initialize WebSocket for real-time updates (Admin only) - PRIVATE
     */
    private async initializeWebSocket(): Promise<void> {
        try {
            // Dynamic import to get auth state and avoid circular dependency
            const { auth } = await import('$lib/stores/auth');
            const { get } = await import('svelte/store');
            const { syncWebSocketState } = await import('$lib/stores/websocketStore');
            
            const authState = get(auth);
            
            if (!authState.isAuthenticated) {
                throw new Error('User is not authenticated');
            }
            
            if (!authState.accessToken) {
                throw new Error('No access token available for WebSocket connection');
            }
            
            this.wsManager = WebSocketManager.getInstance();
            
            // Connect for admin dashboard with JWT token
            console.log('🔑 Connecting WebSocket with JWT authentication...');
            await this.wsManager.connectForAdminDashboard(authState.accessToken);
            
            // Setup event listeners for real-time updates
            this.setupWebSocketListeners();
            
            // Sync websocketStore with current state
            syncWebSocketState();
            
            console.log('✅ WebSocket initialized for Orders Store with JWT authentication');
            
        } catch (error) {
            console.warn('⚠️ WebSocket initialization failed:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    /**
     * Update real-time status store
     */
    private updateRealtimeStatus(updates: Partial<RealtimeStatus>): void {
        this.realtimeStatusStore.update(status => ({
            ...status,
            ...updates
        }));
    }

    /**
     * Setup WebSocket event listeners for real-time order updates
     */
    private setupWebSocketListeners(): void {
        if (!this.wsManager) return;

        // Listen for order creation
        const unsubCreate = this.wsManager.on('order:created', (data) => {
            console.log('📨 Real-time: Order created', data.order?.order_code);
            if (data.order) {
                this.addOrderToStore(data.order);
                websocketStoreActions.addNotification({
                    message: `Order baru dibuat: ${data.order.order_code}`,
                    type: 'success'
                });
            }
        });

        // Listen for order updates
        const unsubUpdate = this.wsManager.on('order:updated', (data) => {
            console.log('📨 Real-time: Order updated', data.order?.order_code);
            if (data.order) {
                this.updateOrderInStore(data.order);
                websocketStoreActions.addNotification({
                    message: `Order ${data.order.order_code} diperbarui`,
                    type: 'info'
                });
            }
        });

        // Listen for order deletions
        const unsubDelete = this.wsManager.on('order:deleted', (data) => {
            console.log('📨 Real-time: Order deleted', data.order_code);
            if (data.order_id) {
                this.removeOrderFromStore(data.order_id);
                websocketStoreActions.addNotification({
                    message: `Order ${data.order_code} dihapus`,
                    type: 'warning'
                });
            }
        });

        // Listen for payment updates
        const unsubPayment = this.wsManager.on('order:payment_update', (data) => {
            console.log('💰 Real-time: Payment update', data.order_code);
            console.log('💰 Payment update data:', JSON.stringify(data, null, 2));
            if (data.order_data) {
                console.log('💰 Order data before update:', JSON.stringify(data.order_data, null, 2));
                
                // ✅ FIX: Map order_id to order_data.id if missing
                const rawData = data.order_data as any; // Cast to access raw backend data
                const orderData = {
                    ...data.order_data,
                    id: String(data.order_data.id || data.order_id),  // Ensure string type
                    // Map payment_summary fields to expected Order interface
                    total_price: rawData.payment_summary?.total_amount || data.order_data.total_price,
                    paid_amount: rawData.payment_summary?.amount_paid || data.order_data.paid_amount,
                } as Order;
                
                console.log('💰 Mapped order data:', { id: orderData.id, order_code: orderData.order_code });
                
                this.updateOrderInStore(orderData);
                websocketStoreActions.addNotification({
                    message: `Pembayaran ${data.order_code} diperbarui`,
                    type: 'success'
                });
            } else {
                console.warn('💰 Missing order_data in payment update!');
            }
        });

        // Listen for status updates  
        const unsubStatus = this.wsManager.on('order:status_update', (data) => {
            console.log('📊 Real-time: Status update', data.order_code, data.new_status);
            console.log('📊 Status update data:', JSON.stringify(data, null, 2));
            if (data.order_data) {
                console.log('📊 Order data before update:', JSON.stringify(data.order_data, null, 2));
                
                // ✅ FIX: Map order_id to order_data.id if missing
                const rawData = data.order_data as any; // Cast to access raw backend data
                const orderData = {
                    ...data.order_data,
                    id: String(data.order_data.id || data.order_id),  // Ensure string type
                    // Map payment_summary fields to expected Order interface
                    total_price: rawData.payment_summary?.total_amount || data.order_data.total_price,
                    paid_amount: rawData.payment_summary?.amount_paid || data.order_data.paid_amount,
                } as Order;
                
                console.log('📊 Mapped order data:', { id: orderData.id, order_code: orderData.order_code });
                
                this.updateOrderInStore(orderData);
                websocketStoreActions.addNotification({
                    message: `Status ${data.order_code}: ${data.new_status}`,
                    type: 'info'
                });
            } else {
                console.warn('📊 Missing order_data in status update!');
            }
        });

        // Store unsubscribers for cleanup
        this.wsUnsubscribers = [
            unsubCreate,
            unsubUpdate,
            unsubDelete,
            unsubPayment,
            unsubStatus
        ];
    }

    // Load orders dengan pagination dan filter
    async loadOrders(params?: {
        page?: number;
        page_size?: number;
        status?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    }): Promise<OrdersResponse> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            const response: OrdersResponse = await api.get('/order/', {}, params);
            this.ordersStore.set(response.results || []);
            
            return response;
            
        } catch (error: any) {
            console.error('❌ Error loading orders:', error.message);
            this.errorStore.set(error.message);
            this.ordersStore.set([]);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Get single order by ID
    async getOrderById(orderId: string): Promise<Order> {
        try {
            const order: Order = await api.get(`/${orderId}/`);  // ✅ Fixed: Django pattern /api/v1/<uuid>/
            return order;
        } catch (error: any) {
            console.error('❌ Error getting order:', error.message);
            this.errorStore.set(error.message);
            throw error;
        }
    }

    // Create new order
    async createOrder(orderData: {
        customer_name: string;
        product_name: string;
        quantity: number;
        total_price: string;
        payment_type: 'dp' | 'full';
        dp_percent?: number;
        contact_information: string;
        notification_channel?: 'whatsapp' | 'email' | 'both';
        design_notes?: string;
    }): Promise<CreateOrderResponse> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            console.log('➕ Creating order via admin endpoint:', orderData);
            
            const response: CreateOrderResponse = await api.post('/admin/create-order/', orderData);
            
            // Note: Order will be added via WebSocket real-time event
            // No need to manually add here
            
            console.log('✅ Order created successfully:', response.order.order_code);
            return response;
            
        } catch (error: any) {
            console.error('❌ Error creating order:', error.message);
            this.errorStore.set(error.message);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Update order
    async updateOrder(orderId: string, orderData: Partial<Order>): Promise<Order> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            console.log('📝 Updating order:', orderId, orderData);
            
            const updatedOrder: Order = await api.patch(`/${orderId}/`, orderData);  // ✅ Fixed: Django pattern
            
            // Note: Order will be updated via WebSocket real-time event
            // No need to manually update here
            
            console.log('✅ Order updated successfully');
            return updatedOrder;
            
        } catch (error: any) {
            console.error('❌ Error updating order:', error.message);
            this.errorStore.set(error.message);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Delete order
    async deleteOrder(orderId: string): Promise<void> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            console.log('🗑️ Deleting order:', orderId);
            
            await api.delete(`/${orderId}/`);  // ✅ Fixed: Django pattern /api/v1/<uuid>/
            
            // Note: Order will be removed via WebSocket real-time event
            // No need to manually remove here
            
            console.log('✅ Order deleted successfully');
            
        } catch (error: any) {
            console.error('❌ Error deleting order:', error.message);
            this.errorStore.set(error.message);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Create payment link
    async createPaymentLink(orderId: string, paymentData: {
        payment_type: 'dp' | 'pelunasan' | 'full';
        dp_percent?: number;
        notification_channel?: 'whatsapp' | 'email' | 'both';
    }): Promise<any> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            console.log('💳 Creating payment link for order:', orderId);
            
            const response = await api.post(`/${orderId}/create-payment-link/`, paymentData);  // ✅ Fixed: Django pattern
            
            console.log('✅ Payment link created successfully');
            return response;
            
        } catch (error: any) {
            console.error('❌ Error creating payment link:', error.message);
            this.errorStore.set(error.message);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Update production status
    async updateProductionStatus(orderId: string, productionStatus: Order['production_status']): Promise<Order> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            console.log('🏭 Updating production status:', orderId, productionStatus);
            
            const updatedOrder: Order = await api.patch(`/${orderId}/`, {  // ✅ Fixed: Django pattern
                production_status: productionStatus
            });
            
            // Note: Order will be updated via WebSocket real-time event
            
            console.log('✅ Production status updated successfully');
            return updatedOrder;
            
        } catch (error: any) {
            console.error('❌ Error updating production status:', error.message);
            this.errorStore.set(error.message);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Track order (public endpoint)
    async trackOrder(orderCode: string): Promise<any> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            console.log('📍 Tracking order:', orderCode);
            
            const trackingData = await api.get('/track-order/', {}, { order_code: orderCode });
            
            console.log('✅ Order tracking data loaded');
            return trackingData;
            
        } catch (error: any) {
            console.error('❌ Error tracking order:', error.message);
            this.errorStore.set(error.message);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Send manual email
    async sendManualEmail(orderId: string, emailType: 'payment_reminder' | 'payment_link'): Promise<any> {
        try {
            this.loadingStore.set(true);
            this.errorStore.set('');
            
            console.log('📧 Sending manual email:', orderId, emailType);
            
            if (emailType === 'payment_link') {
                // Create payment link first
                const paymentResponse = await this.createPaymentLink(orderId, {
                    payment_type: 'dp',
                    dp_percent: 60,
                    notification_channel: 'email'
                });
                
                return paymentResponse;
                            } else if (emailType === 'payment_reminder') {
                // Use email blast endpoint
                const order = await this.getOrderById(orderId);
                const response = await api.post('/email-blast/', {
                    recipients: [order.contact_information],
                    subject: `Pengingat Pembayaran - ${order.order_code}`,
                    message: `Halo ${order.customer_name}, jangan lupa untuk menyelesaikan pembayaran order ${order.order_code}.`,
                    template_type: 'payment_reminder',
                    order_id: orderId
                });
                
                return response;
            }
            
        } catch (error: any) {
            console.error('❌ Error sending manual email:', error.message);
            this.errorStore.set(error.message);
            throw error;
        } finally {
            this.loadingStore.set(false);
        }
    }

    // Get dashboard stats
    async getDashboardStats(): Promise<any> {
        try {
            console.log('📊 Loading dashboard stats...');
            
            const stats = await api.get('/admin/dashboard/stats/');
            
            console.log('✅ Dashboard stats loaded');
            return stats;
            
        } catch (error: any) {
            console.error('❌ Error loading dashboard stats:', error.message);
            this.errorStore.set(error.message);
            throw error;
        }
    }

    /**
     * Real-time event handlers (called by WebSocket events)
     */
    private addOrderToStore(order: Order): void {
        this.ordersStore.update(orders => {
            // Check if order already exists (prevent duplicates)
            const exists = orders.some(o => o.id === order.id);
            if (exists) {
                return orders.map(o => o.id === order.id ? order : o);
            }
            return [order, ...orders];
        });
    }

    private updateOrderInStore(updatedOrder: Order): void {
        console.log('🔄 Updating order in store:', updatedOrder.id, updatedOrder.order_code);
        
        this.ordersStore.update(orders => {
            let orderFound = false;
            const updatedOrders = orders.map(order => {
                if (order.id === updatedOrder.id) {
                    orderFound = true;
                    // ✅ FORCE COMPLETE NEW OBJECT to ensure Svelte detects the change
                    const newOrder = JSON.parse(JSON.stringify({
                        ...updatedOrder,
                        // Force Svelte reactivity with fresh timestamps
                        updated_at: new Date().toISOString(),
                        // Ensure numeric fields are properly handled
                        total_price: String(updatedOrder.total_price || '0'),
                        paid_amount: String(updatedOrder.paid_amount || '0'),
                        quantity: Number(updatedOrder.quantity || 1),
                    })) as Order;
                    
                    console.log('✅ Order updated in store with deep clone & forced reactivity:', {
                        id: newOrder.id,
                        order_code: newOrder.order_code,
                        status_order: newOrder.status_order,
                        paid_amount: newOrder.paid_amount,
                        total_price: newOrder.total_price,
                        production_status: newOrder.production_status,
                        updated_at: newOrder.updated_at
                    });
                    return newOrder;
                }
                return order;
            });
            
            if (!orderFound) {
                console.warn('⚠️ Order not found in store for update:', updatedOrder.id, updatedOrder.order_code);
                console.warn('📋 Available order IDs:', orders.map(o => ({ id: o.id, code: o.order_code })));
            }
            
            console.log('📊 Store updated with', updatedOrders.length, 'orders');
            return updatedOrders;
        });
    }

    private removeOrderFromStore(orderId: string): void {
        this.ordersStore.update(orders => 
            orders.filter(order => order.id !== orderId)
        );
    }

    /**
     * Force reconnect WebSocket
     */
    async forceReconnectWebSocket(): Promise<void> {
        if (this.wsManager) {
            await this.wsManager.forceReconnect(); // 🔑 NOW ASYNC
        }
    }

    /**
     * Reconnect realtime connection (alias for backward compatibility)
     */
    async reconnectRealtime(): Promise<void> {
        console.log('🔄 Reconnecting real-time connection...');
        try {
            await this.forceReconnectWebSocket(); // 🔑 NOW ASYNC
            websocketStoreActions.addNotification({
                message: 'Mencoba menghubungkan kembali...',
                type: 'info'
            });
        } catch (error) {
            console.error('❌ Failed to reconnect:', error);
            websocketStoreActions.addNotification({
                message: 'Gagal menghubungkan kembali',
                type: 'error'
            });
        }
    }

    /**
     * Get WebSocket connection status
     */
    getWebSocketStatus() {
        return this.wsManager?.getConnectionState() || null;
    }

    /**
     * Cleanup connections
     */
    destroy(): void {
        console.log('🧹 Cleaning up OrdersStore...');
        
        // Unsubscribe from WebSocket events
        this.wsUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.wsUnsubscribers = [];

        // Disconnect WebSocket
        if (this.wsManager) {
            this.wsManager.disconnect();
        }
        
        console.log('✅ OrdersStore cleanup completed');
    }
}

// Export singleton instance
export const ordersStore = new OrdersStore();

// Export cleanup function for app cleanup
export const cleanupOrdersStore = () => ordersStore.destroy(); 