<!-- Tab Real-time & Debug (Fungsional) -->
<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { ordersStore } from "$lib/stores/ordersStore";
  import { settingsStore, type RealTimeSettings } from "$lib/stores/settings";

  export let settings: RealTimeSettings;
  export let errors: Record<string, string> = {};

  // State dari komponen existing
  let isLoading = false;
  let error = "";
  let success = "";
  let realtimeStatus: any = {
    websocketConnected: false,
    pollingActive: false,
    fallbackMode: false,
    lastUpdate: null,
  };

  // Connection info
  let connectionInfo: any = {};
  let wsLogs: string[] = [];

  onMount(() => {
    // Subscribe ke real-time status
    ordersStore.realtimeStatus.subscribe((status) => {
      realtimeStatus = status;
      // Update settings store
      settingsStore.updateSettings("realTime", {
        websocketConnected: status.websocketConnected,
        pollingActive: status.pollingActive,
        fallbackMode: status.fallbackMode,
        lastUpdate: status.lastUpdate,
      });
    });

    // Load connection info jika ada
    loadConnectionInfo();
  });

  function loadConnectionInfo() {
    // Get WebSocket status
    if ((window as any).adminWebSocket) {
      const ws = (window as any).adminWebSocket;
      connectionInfo = ws.getStatus();
    }
  }

  // Real-time management functions
  function forceReconnectRealtime() {
    console.log("🔄 [SETTINGS] Force reconnecting real-time from UI...");
    addToLogs("🔄 Force reconnecting real-time connections...");

    try {
      // Use the correct method name with better error handling
      ordersStore.reconnectRealtime();
      addToLogs("✅ Reconnection initiated successfully");
      success = "🔄 Attempting to reconnect real-time connections...";
    } catch (reconnectError) {
      console.error("❌ Failed to reconnect:", reconnectError);
      addToLogs(`❌ Reconnection failed: ${reconnectError}`);
      error = "❌ Failed to initiate reconnection";
    }

    // Update connection info
    setTimeout(() => {
      loadConnectionInfo();
      success = "";
    }, 3000);
  }

  // Debug function to test WebSocket manually
  function testRealtimeUpdate() {
    console.log("🧪 [SETTINGS] Testing real-time update...");
    addToLogs("🧪 Testing real-time connection...");

    // Check if WebSocket is available and connected
    if ((window as any).adminWebSocket) {
      const ws = (window as any).adminWebSocket;
      console.log("📡 WebSocket status:", ws.getStatus());

      // Send test ping
      ws.send({
        type: "ping",
        test_data: "manual_test_from_settings",
        timestamp: new Date().toISOString(),
      });

      addToLogs("🏓 Test ping sent to WebSocket");
      success = "🧪 Test ping sent! Check logs below for WebSocket response.";

      // Update connection info
      loadConnectionInfo();

      setTimeout(() => {
        success = "";
      }, 5000);
    } else {
      error =
        "❌ WebSocket not available. Real-time connection may not be initialized.";
      addToLogs("❌ WebSocket not available");
      setTimeout(() => {
        error = "";
      }, 3000);
    }
  }

  function addToLogs(message: string) {
    const timestamp = new Date().toLocaleTimeString("id-ID");
    wsLogs = [`[${timestamp}] ${message}`, ...wsLogs.slice(0, 19)]; // Keep last 20 logs
  }

  function clearLogs() {
    wsLogs = [];
  }

  function clearMessages() {
    error = "";
    success = "";
  }

  function refreshConnectionInfo() {
    loadConnectionInfo();
    success = "✅ Connection info refreshed";
    setTimeout(() => {
      success = "";
    }, 2000);
  }
</script>

<div class="settings-tab-content">
  <div class="tab-header">
    <h3>🔌 Real-time & Debug</h3>
    <p>Kelola koneksi real-time dan debugging sistem</p>
  </div>

  <!-- Notifications -->
  {#if error}
    <div class="notification error" transition:slide>
      <div class="notification-content">
        <i class="fas fa-exclamation-circle"></i>
        <span>{error}</span>
        <button class="notification-close" on:click={clearMessages}>
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  {/if}

  {#if success}
    <div class="notification success" transition:slide>
      <div class="notification-content">
        <i class="fas fa-check-circle"></i>
        <span>{success}</span>
        <button class="notification-close" on:click={clearMessages}>
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  {/if}

  <!-- Real-time Connection Management -->
  <div class="settings-section">
    <h4>🔌 Real-time Connection Management</h4>
    <p>Kelola koneksi WebSocket dan fallback polling untuk update real-time</p>

    <div class="connection-controls">
      <button
        class="btn btn-primary"
        on:click={forceReconnectRealtime}
        disabled={isLoading}
      >
        <i class="fas fa-satellite"></i>
        Force Reconnect Real-time
      </button>

      <button
        class="btn btn-warning"
        on:click={testRealtimeUpdate}
        disabled={isLoading}
      >
        <i class="fas fa-bug"></i>
        Test Real-time Connection
      </button>

      <button class="btn btn-secondary" on:click={refreshConnectionInfo}>
        <i class="fas fa-sync-alt"></i>
        Refresh Info
      </button>
    </div>
  </div>

  <!-- Connection Status Info -->
  <div class="settings-section">
    <h4>📊 Connection Status</h4>

    <div class="status-grid">
      <div class="status-card">
        <h5>WebSocket Status</h5>
        <div
          class="status-value {realtimeStatus.websocketConnected
            ? 'connected'
            : 'disconnected'}"
        >
          {realtimeStatus.websocketConnected
            ? "🟢 Connected"
            : "🔴 Disconnected"}
        </div>
        <small>Real-time updates via WebSocket</small>
      </div>

      <div class="status-card">
        <h5>Fallback Mode</h5>
        <div
          class="status-value {realtimeStatus.fallbackMode
            ? 'active'
            : 'inactive'}"
        >
          {realtimeStatus.fallbackMode ? "🟡 Active" : "⚪ Inactive"}
        </div>
        <small>Smart polling backup</small>
      </div>

      <div class="status-card">
        <h5>Polling Status</h5>
        <div
          class="status-value {realtimeStatus.pollingActive
            ? 'active'
            : 'inactive'}"
        >
          {realtimeStatus.pollingActive ? "🟡 Running" : "⚪ Stopped"}
        </div>
        <small>Background data sync</small>
      </div>

      <div class="status-card">
        <h5>Last Update</h5>
        <div class="status-value">
          {realtimeStatus.lastUpdate
            ? new Date(realtimeStatus.lastUpdate).toLocaleTimeString("id-ID")
            : "Never"}
        </div>
        <small>Last real-time event received</small>
      </div>
    </div>
  </div>

  <!-- Connection Details -->
  {#if connectionInfo && Object.keys(connectionInfo).length > 0}
    <div class="settings-section">
      <h4>🔍 Connection Details</h4>

      <div class="connection-details">
        <div class="detail-row">
          <span class="label">Connection Status:</span>
          <span
            class="value {connectionInfo.isConnected
              ? 'connected'
              : 'disconnected'}"
          >
            {connectionInfo.isConnected ? "✅ Connected" : "❌ Disconnected"}
          </span>
        </div>

        <div class="detail-row">
          <span class="label">Reconnect Attempts:</span>
          <span class="value">{connectionInfo.reconnectAttempts || 0}</span>
        </div>

        <div class="detail-row">
          <span class="label">Last Connected:</span>
          <span class="value">
            {connectionInfo.lastConnected
              ? new Date(connectionInfo.lastConnected).toLocaleString("id-ID")
              : "Never"}
          </span>
        </div>

        <div class="detail-row">
          <span class="label">Last Message:</span>
          <span class="value">
            {connectionInfo.lastMessage
              ? new Date(connectionInfo.lastMessage).toLocaleString("id-ID")
              : "Never"}
          </span>
        </div>

        <div class="detail-row">
          <span class="label">Max Attempts Reached:</span>
          <span
            class="value {connectionInfo.maxReconnectAttemptsReached
              ? 'error'
              : 'success'}"
          >
            {connectionInfo.maxReconnectAttemptsReached ? "⚠️ Yes" : "✅ No"}
          </span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Real-time Debug Logs -->
  <div class="settings-section">
    <h4>📝 Real-time Debug Logs</h4>
    <p>Log aktivitas real-time untuk debugging</p>

    <div class="logs-controls">
      <button class="btn btn-sm btn-secondary" on:click={clearLogs}>
        <i class="fas fa-trash"></i>
        Clear Logs
      </button>
      <span class="logs-count">{wsLogs.length} logs</span>
    </div>

    <div class="logs-container">
      {#if wsLogs.length > 0}
        {#each wsLogs as log}
          <div class="log-entry">{log}</div>
        {/each}
      {:else}
        <div class="log-entry empty">
          No logs yet. Click "Test Real-time Connection" to generate logs.
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-tab-content {
    padding: 2rem;
    background: white;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .tab-header {
    margin-bottom: 2rem;
  }

  .tab-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin: 0 0 0.5rem 0;
  }

  .tab-header p {
    color: var(--neutral-600);
    margin: 0;
  }

  .settings-section {
    background: var(--neutral-50);
    border-radius: var(--border-radius-md);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid var(--neutral-200);
  }

  .settings-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin: 0 0 0.5rem 0;
  }

  .settings-section p {
    color: var(--neutral-600);
    margin: 0 0 1.5rem 0;
    font-size: 0.875rem;
  }

  .connection-controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .status-card {
    padding: 1rem;
    border: 1px solid var(--neutral-200);
    border-radius: var(--border-radius-md);
    background: white;
    text-align: center;
  }

  .status-card h5 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--neutral-600);
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-value {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .status-value.connected {
    color: var(--success-base);
  }

  .status-value.disconnected {
    color: var(--error-base);
  }

  .status-value.active {
    color: var(--warning-base);
  }

  .status-value.inactive {
    color: var(--neutral-400);
  }

  .status-card small {
    font-size: 0.75rem;
    color: var(--neutral-500);
  }

  .connection-details {
    display: grid;
    gap: 0.75rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--neutral-200);
  }

  .detail-row .label {
    font-weight: 500;
    color: var(--neutral-600);
  }

  .detail-row .value {
    font-weight: 600;
    color: var(--neutral-900);
  }

  .detail-row .value.connected {
    color: var(--success-base);
  }

  .detail-row .value.error {
    color: var(--error-base);
  }

  .detail-row .value.success {
    color: var(--success-base);
  }

  .logs-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .logs-count {
    font-size: 0.875rem;
    color: var(--neutral-500);
  }

  .logs-container {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--neutral-200);
    border-radius: var(--border-radius-sm);
    background: var(--neutral-900);
    color: var(--neutral-100);
    font-family: "Courier New", monospace;
  }

  .log-entry {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--neutral-700);
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .log-entry:last-child {
    border-bottom: none;
  }

  .log-entry.empty {
    color: var(--neutral-400);
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }

  .notification {
    margin-bottom: 1.5rem;
    border-radius: var(--border-radius-lg);
    padding: 1rem 1.5rem;
    box-shadow: var(--shadow-md);
    border-left: 4px solid;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .notification.error {
    background: var(--error-light);
    border-left-color: var(--error-base);
    color: var(--error-dark);
  }

  .notification.success {
    background: var(--success-light);
    border-left-color: var(--success-base);
    color: var(--success-dark);
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .notification-close:hover {
    opacity: 1;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #4b5563;
  }

  .btn-warning {
    background-color: #f59e0b;
    color: white;
  }

  .btn-warning:hover:not(:disabled) {
    background-color: #d97706;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .settings-tab-content {
      padding: 1.5rem;
    }

    .settings-section {
      padding: 1rem;
    }

    .connection-controls {
      flex-direction: column;
    }

    .status-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
