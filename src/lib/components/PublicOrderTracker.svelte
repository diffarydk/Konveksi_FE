<!-- src/lib/components/PublicOrderTracker.svelte -->
<!-- Public Order Tracker Component - Example implementation untuk customer tracking -->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { WebSocketManager } from "$lib/services/WebSocketManager";
  import {
    connectionState,
    orderData,
    notifications,
    connectionStatus,
    reconnectionInfo,
    websocketStoreActions,
  } from "$lib/stores/websocketStore";
  import type { PublicOrderData } from "$lib/types/websocket";

  export let orderCode: string; // Order code untuk public tracking

  let wsManager: WebSocketManager | null = null;
  let isInitialized = false;

  // Reactive statements
  $: currentOrder = $orderData[orderCode] as PublicOrderData | undefined;
  $: isConnected = $connectionState.connected;
  $: connectionError = $connectionState.error;
  $: accessLevel = $connectionState.accessLevel;

  /**
   * Initialize WebSocket connection for public tracking
   */
  onMount(async () => {
    try {
      console.log(`🔍 Initializing public order tracking for: ${orderCode}`);

      // Get WebSocket manager instance for public access
      wsManager = WebSocketManager.getInstance();

      // Connect for public tracking (no authentication required)
      await wsManager.connectForPublicTracking();

      // Subscribe to specific order tracking
      if (isConnected) {
        wsManager.subscribeToOrderByCode(orderCode);
        wsManager.getOrderDetailsByCode(orderCode);
      }

      // Setup event listeners for this component
      setupEventListeners();

      isInitialized = true;
      console.log(`✅ Public order tracking initialized for: ${orderCode}`);
    } catch (error) {
      console.error("❌ Failed to initialize public order tracking:", error);
      websocketStoreActions.addNotification({
        message: `Gagal menghubungkan ke server: ${error}`,
        type: "error",
      });
    }
  });

  /**
   * Setup event listeners for order updates
   */
  function setupEventListeners() {
    if (!wsManager) return;

    // Listen for order status updates
    wsManager.on("order:status_update", (data) => {
      if (data.order_code === orderCode) {
        console.log(`📊 Status update for ${orderCode}:`, data.new_status);

        if (data.public_data) {
          websocketStoreActions.updateOrderData(orderCode, data.public_data);
        }

        websocketStoreActions.addNotification({
          message: `Status order diperbarui: ${data.new_status}`,
          type: "info",
        });
      }
    });

    // Listen for payment updates
    wsManager.on("order:payment_update", (data) => {
      if (data.order_code === orderCode) {
        console.log(`💰 Payment update for ${orderCode}:`, data.payment_type);

        if (data.public_data) {
          websocketStoreActions.updateOrderData(orderCode, data.public_data);
        }

        websocketStoreActions.addNotification({
          message: `Pembayaran ${data.payment_type} telah diterima`,
          type: "success",
        });
      }
    });

    // Listen for production updates
    wsManager.on("order:production_update", (data) => {
      if (data.order_code === orderCode) {
        console.log(`🏭 Production update for ${orderCode}:`, data.new_status);

        if (data.public_data) {
          websocketStoreActions.updateOrderData(orderCode, data.public_data);
        }

        websocketStoreActions.addNotification({
          message: `Status produksi: ${data.new_status}`,
          type: "info",
        });
      }
    });

    // Listen for initial order data
    wsManager.on("message:raw", (message) => {
      if (
        message.type === "order_initial_data" ||
        message.type === "order_details_response"
      ) {
        const payload = message.payload;
        if (payload.order_code === orderCode && payload.public_data) {
          console.log(`📋 Initial data received for ${orderCode}`);
          websocketStoreActions.updateOrderData(orderCode, payload.public_data);
        }
      }
    });
  }

  /**
   * Cleanup when component is destroyed
   */
  onDestroy(() => {
    if (wsManager && isInitialized) {
      console.log(`🧹 Cleaning up public tracking for: ${orderCode}`);
      wsManager.unsubscribeFromOrder(orderCode);

      // Note: Don't disconnect WebSocket completely as other components might be using it
      // The WebSocketManager handles this automatically
    }
  });

  /**
   * Manual refresh order data
   */
  function handleRefresh() {
    if (wsManager && isConnected) {
      console.log(`🔄 Refreshing order data for: ${orderCode}`);
      wsManager.getOrderDetailsByCode(orderCode);

      websocketStoreActions.addNotification({
        message: "Memperbarui data order...",
        type: "info",
      });
    }
  }

  /**
   * Manual reconnection
   */
  function handleReconnect() {
    if (wsManager) {
      console.log("🔄 Manual reconnection requested");
      wsManager.forceReconnect();
    }
  }

  /**
   * Format date for display
   */
  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get status badge class
   */
  function getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      menunggu_link: "status-pending",
      link_dibuat: "status-processing",
      dp_dibayar: "status-processing",
      pengerjaan_selesai: "status-processing",
      menunggu_pelunasan: "status-processing",
      lunas: "status-completed",
      dibatalkan: "status-cancelled",
    };
    return statusMap[status] || "status-default";
  }

  /**
   * Get production status class
   */
  function getProductionClass(status: string): string {
    const statusMap: Record<string, string> = {
      menunggu: "production-waiting",
      diproses: "production-processing",
      selesai: "production-completed",
      dikirim: "production-shipped",
      dibatalkan: "production-cancelled",
    };
    return statusMap[status] || "production-default";
  }
</script>

<div class="public-order-tracker">
  <!-- Header -->
  <div class="header">
    <h2>🔍 Lacak Pesanan Anda</h2>
    <p class="order-code">Kode Order: <strong>{orderCode}</strong></p>
  </div>

  <!-- Connection Status -->
  <div class="connection-status" class:connected={isConnected}>
    <div class="status-indicator">
      <span class="emoji">{$connectionStatus.emoji}</span>
      <span class="text" style="color: {$connectionStatus.color}">
        {$connectionStatus.text}
      </span>
    </div>

    {#if $reconnectionInfo}
      <div class="reconnection-info">
        {$reconnectionInfo}
      </div>
    {/if}

    {#if connectionError && !isConnected}
      <div class="error-info">
        <p class="error">{connectionError}</p>
        <button on:click={handleReconnect} class="btn-secondary">
          🔄 Coba Lagi
        </button>
      </div>
    {/if}
  </div>

  <!-- Order Information -->
  <div class="order-info">
    {#if currentOrder}
      <div class="info-cards">
        <!-- Product Information -->
        <div class="info-card">
          <h3>📦 Informasi Produk</h3>
          <div class="info-row">
            <span class="label">Produk:</span>
            <span class="value"
              >{currentOrder.product_name || "Loading..."}</span
            >
          </div>
          {#if currentOrder.quantity}
            <div class="info-row">
              <span class="label">Jumlah:</span>
              <span class="value">{currentOrder.quantity} pcs</span>
            </div>
          {/if}
        </div>

        <!-- Order Status -->
        <div class="info-card">
          <h3>📊 Status Pesanan</h3>
          <div class="info-row">
            <span class="label">Status Order:</span>
            <span class="value">
              <span
                class="status-badge {getStatusClass(currentOrder.status_order)}"
              >
                {currentOrder.status_order || "Unknown"}
              </span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Status Produksi:</span>
            <span class="value">
              <span
                class="production-badge {getProductionClass(
                  currentOrder.production_status
                )}"
              >
                {currentOrder.production_status || "Belum dimulai"}
              </span>
            </span>
          </div>
        </div>

        <!-- Timeline -->
        <div class="info-card">
          <h3>📅 Timeline</h3>
          <div class="info-row">
            <span class="label">Dibuat:</span>
            <span class="value">{formatDate(currentOrder.created_at)}</span>
          </div>
          <div class="info-row">
            <span class="label">Terakhir Update:</span>
            <span class="value">{formatDate(currentOrder.updated_at)}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button
          on:click={handleRefresh}
          class="btn-primary"
          disabled={!isConnected}
        >
          🔄 Refresh Status
        </button>
      </div>
    {:else if isConnected}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat informasi pesanan...</p>
      </div>
    {:else}
      <div class="disconnected-state">
        <p>Silakan hubungkan ke server untuk melihat status pesanan.</p>
      </div>
    {/if}
  </div>

  <!-- Notifications -->
  {#if $notifications.length > 0}
    <div class="notifications">
      <h3>📢 Update Terbaru</h3>
      {#each $notifications.slice(0, 5) as notification (notification.id)}
        <div class="notification notification-{notification.type}">
          <p>{notification.message}</p>
          <small>{formatDate(notification.timestamp)}</small>
          <button
            class="notification-close"
            on:click={() =>
              websocketStoreActions.removeNotification(notification.id)}
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .public-order-tracker {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f8f9fa;
    min-height: 100vh;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .header h2 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 2em;
  }

  .order-code {
    font-size: 1.1em;
    color: #666;
    margin: 0;
  }

  .connection-status {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 2px solid #dc3545;
  }

  .connection-status.connected {
    border-color: #28a745;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  .emoji {
    font-size: 1.2em;
  }

  .reconnection-info {
    margin-top: 10px;
    font-size: 0.9em;
    color: #ffc107;
    font-style: italic;
  }

  .error-info {
    margin-top: 15px;
  }

  .error {
    color: #dc3545;
    margin: 0 0 10px 0;
    font-size: 0.9em;
  }

  .order-info {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .info-cards {
    display: grid;
    gap: 20px;
    margin-bottom: 20px;
  }

  @media (min-width: 768px) {
    .info-cards {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
  }

  .info-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #007bff;
  }

  .info-card h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.1em;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }

  .info-row:last-child {
    margin-bottom: 0;
  }

  .label {
    font-weight: 500;
    color: #666;
    flex-shrink: 0;
  }

  .value {
    text-align: right;
    color: #333;
  }

  .status-badge,
  .production-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: bold;
    text-transform: uppercase;
    display: inline-block;
  }

  .status-pending {
    background: #fff3cd;
    color: #856404;
  }
  .status-processing {
    background: #cce5ff;
    color: #004085;
  }
  .status-completed {
    background: #d4edda;
    color: #155724;
  }
  .status-cancelled {
    background: #f8d7da;
    color: #721c24;
  }
  .status-default {
    background: #e2e3e5;
    color: #495057;
  }

  .production-waiting {
    background: #e2e3e5;
    color: #495057;
  }
  .production-processing {
    background: #cce5ff;
    color: #004085;
  }
  .production-completed {
    background: #d4edda;
    color: #155724;
  }
  .production-shipped {
    background: #d1ecf1;
    color: #0c5460;
  }
  .production-cancelled {
    background: #f8d7da;
    color: #721c24;
  }
  .production-default {
    background: #e2e3e5;
    color: #495057;
  }

  .actions {
    text-align: center;
  }

  .btn-primary,
  .btn-secondary {
    background: #007bff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1em;
    transition: background 0.2s;
    margin: 0 5px;
  }

  .btn-primary:hover {
    background: #0056b3;
  }

  .btn-primary:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #6c757d;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  .loading-state,
  .disconnected-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .notifications {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .notifications h3 {
    margin: 0 0 16px 0;
    color: #333;
  }

  .notification {
    position: relative;
    padding: 12px 40px 12px 12px;
    margin-bottom: 12px;
    border-radius: 6px;
    background: #f0f0f0;
    border-left: 4px solid #ccc;
  }

  .notification:last-child {
    margin-bottom: 0;
  }

  .notification-success {
    background: #d4edda;
    border-left-color: #28a745;
  }

  .notification-error {
    background: #f8d7da;
    border-left-color: #dc3545;
  }

  .notification-warning {
    background: #fff3cd;
    border-left-color: #ffc107;
  }

  .notification-info {
    background: #d1ecf1;
    border-left-color: #17a2b8;
  }

  .notification p {
    margin: 0 0 5px 0;
    color: #333;
  }

  .notification small {
    color: #666;
    font-size: 0.8em;
  }

  .notification-close {
    position: absolute;
    top: 5px;
    right: 8px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    line-height: 1;
  }

  .notification-close:hover {
    color: #333;
  }

  @media (max-width: 768px) {
    .public-order-tracker {
      padding: 15px;
    }

    .info-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }

    .value {
      text-align: left;
    }

    .header h2 {
      font-size: 1.5em;
    }
  }
</style>
