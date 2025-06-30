<!-- Real-time Dashboard & Connection Manager -->
<script lang="ts">
  import { settingsStore, type RealTimeSettings } from "$lib/stores/settings";
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";

  // Import existing services
  import { WebSocketManager } from "$lib/services/WebSocketManager";
  import { smartPolling } from "$lib/services/realtime-polling";
  import {
    connectionState,
    connectionStatus,
    notifications,
    orderData,
    adminOrdersData,
    websocketStoreActions,
  } from "$lib/stores/websocketStore";
  import { auth } from "$lib/stores/auth";

  export let settings: RealTimeSettings;
  export let errors: Record<string, string> = {};

  // WebSocket Manager instance
  let wsManager: WebSocketManager | null = null;
  let isInitializing = false;
  let systemLogs: Array<{
    id: string;
    time: string;
    level: "info" | "warn" | "error" | "success";
    source: "websocket" | "polling" | "system";
    message: string;
  }> = [];

  // Activity tracking
  let activityCount = 0;
  let lastActivity = new Date();
  let uptime = 0;

  // Real-time clock
  let currentTime = new Date().toLocaleString();
  let clockInterval: number;

  // Polling status
  let pollingStatus = smartPolling.getStatus();
  let pollingStatusInterval: number;

  // Connection management
  let selectedConnectionMode: "websocket" | "polling" | "hybrid" = "hybrid";
  let connectionEndpoint = "admin"; // 'admin' or 'public'
  let autoReconnect = true;

  // Backend connection status
  let backendStatus = {
    isOnline: false,
    lastChecked: null as Date | null,
    error: null as string | null,
    apiVersion: null as string | null,
  };

  function addLog(
    level: "info" | "warn" | "error" | "success",
    source: "websocket" | "polling" | "system",
    message: string
  ) {
    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      level,
      source,
      message,
    };

    systemLogs = [newLog, ...systemLogs.slice(0, 99)]; // Keep 100 logs max

    // Update UI store
    handleInput("lastUpdate", new Date().toLocaleString());
  }

  async function initializeWebSocket() {
    if (!browser || isInitializing) return;

    // Check backend status first
    if (!backendStatus.isOnline) {
      addLog("warn", "system", "Cannot connect WebSocket - Backend is offline");
      return;
    }

    isInitializing = true;
    addLog("info", "system", "Initializing WebSocket connection...");

    try {
      // Get WebSocket manager instance (environment auto-detected)
      wsManager = WebSocketManager.getInstance();

      // Setup event listeners
      setupWebSocketEventListeners();

      // Connect based on endpoint selection
      if (connectionEndpoint === "admin") {
        // Get auth token for admin connection
        const authData = $auth;
        if (authData && authData.accessToken) {
          await wsManager.connectForAdminDashboard(authData.accessToken);
          addLog(
            "success",
            "websocket",
            "Admin WebSocket connected successfully"
          );
        } else {
          addLog(
            "error",
            "websocket",
            "No auth token available for admin connection"
          );
        }
      } else {
        await wsManager.connectForPublicTracking();
        addLog(
          "success",
          "websocket",
          "Public WebSocket connected successfully"
        );
      }
    } catch (error) {
      addLog("error", "websocket", `Connection failed: ${error}`);

      // Auto-fallback to polling if enabled
      if (selectedConnectionMode === "hybrid") {
        addLog("info", "system", "Falling back to polling mode...");
        startSmartPolling();
      }
    } finally {
      isInitializing = false;
    }
  }

  function setupWebSocketEventListeners() {
    if (!wsManager) return;

    // Connection events
    wsManager.on("connection:established", () => {
      addLog("success", "websocket", "WebSocket connection established");
      activityCount++;
      lastActivity = new Date();
    });

    wsManager.on("connection:lost", (data) => {
      addLog("warn", "websocket", `Connection lost: ${data.reason}`);

      if (autoReconnect && selectedConnectionMode !== "polling") {
        addLog(
          "info",
          "websocket",
          "Auto-reconnect enabled, attempting to reconnect..."
        );
      }
    });

    wsManager.on("connection:error", (data) => {
      addLog("error", "websocket", `Connection error occurred`);
    });

    // Order events
    wsManager.on("order:created", (data) => {
      addLog(
        "info",
        "websocket",
        `New order created: ${data.order?.order_code || data.order?.id || "Unknown"}`
      );
      activityCount++;
      lastActivity = new Date();
    });

    wsManager.on("order:updated", (data) => {
      addLog(
        "info",
        "websocket",
        `Order updated: ${data.order?.order_code || data.order?.id || "Unknown"}`
      );
      activityCount++;
      lastActivity = new Date();
    });

    wsManager.on("order:status_update", (data) => {
      addLog(
        "info",
        "websocket",
        `Order status changed: ${data.order_code} → ${data.new_status}`
      );
      activityCount++;
      lastActivity = new Date();
    });

    wsManager.on("order:payment_update", (data) => {
      addLog(
        "success",
        "websocket",
        `Payment updated: ${data.order_code} → ${data.payment_type}`
      );
      activityCount++;
      lastActivity = new Date();
    });

    // System events
    wsManager.on("system:notification", (data) => {
      addLog("info", "websocket", `System notification: ${data.message}`);
      activityCount++;
      lastActivity = new Date();
    });

    wsManager.on("system:error", (data) => {
      addLog("error", "websocket", `System error: ${data.message}`);
    });

    // Raw message counter
    wsManager.on("message:raw", () => {
      activityCount++;
      lastActivity = new Date();
    });
  }

  function startSmartPolling() {
    // Check backend status first
    if (!backendStatus.isOnline) {
      addLog("warn", "system", "Cannot start polling - Backend is offline");
      return;
    }

    if (!smartPolling.getStatus().isActive) {
      // Setup polling event listeners
      smartPolling.on("data_update", (data: any) => {
        addLog(
          "info",
          "polling",
          `Data update received: ${data.data?.results?.length || 0} orders`
        );
        activityCount++;
        lastActivity = new Date();
      });

      smartPolling.on("payment_update", (data: any) => {
        addLog("success", "polling", `Payment updates: ${data.count} orders`);
      });

      smartPolling.on("status_change", (data: any) => {
        addLog("info", "polling", `Status changes: ${data.count} orders`);
      });

      smartPolling.on("polling_error", (data: any) => {
        const isApiNotFound = data.error.message.includes("404");
        if (isApiNotFound) {
          addLog(
            "warn",
            "polling",
            `API endpoint not available (404) - Backend may not be running`
          );
          // Auto-disable polling after max retries for 404 errors
          if (data.retryCount >= 3) {
            addLog(
              "info",
              "system",
              "Auto-disabling polling due to API unavailability"
            );
            stopSmartPolling();
          }
        } else {
          addLog(
            "error",
            "polling",
            `Polling error (retry ${data.retryCount}): ${data.error.message}`
          );
        }
      });

      smartPolling.start();
      addLog("success", "polling", "Smart polling started");
    }
  }

  function stopSmartPolling() {
    if (smartPolling.getStatus().isActive) {
      smartPolling.stop();
      addLog("info", "polling", "Smart polling stopped");
    }
  }

  async function disconnectWebSocket() {
    if (wsManager) {
      wsManager.disconnect();
      addLog("info", "websocket", "WebSocket disconnected manually");
    }
  }

  async function testConnection() {
    addLog("info", "system", "Testing connection...");

    if (
      selectedConnectionMode === "websocket" ||
      selectedConnectionMode === "hybrid"
    ) {
      try {
        await initializeWebSocket();
        addLog("success", "system", "WebSocket test successful");
      } catch (error) {
        addLog("error", "system", `WebSocket test failed: ${error}`);
      }
    }

    if (
      selectedConnectionMode === "polling" ||
      selectedConnectionMode === "hybrid"
    ) {
      try {
        await smartPolling.pollNow();
        addLog("success", "system", "Polling test successful");
      } catch (error) {
        addLog("error", "system", `Polling test failed: ${error}`);
      }
    }
  }

  function forceReconnect() {
    addLog("info", "system", "Force reconnecting...");

    // Disconnect all
    if (wsManager) {
      wsManager.disconnect();
    }
    stopSmartPolling();

    // Clear stores
    websocketStoreActions.resetAll();

    // Reconnect based on mode
    setTimeout(() => {
      if (
        selectedConnectionMode === "websocket" ||
        selectedConnectionMode === "hybrid"
      ) {
        initializeWebSocket();
      }
      if (
        selectedConnectionMode === "polling" ||
        selectedConnectionMode === "hybrid"
      ) {
        startSmartPolling();
      }
    }, 1000);
  }

  function getSystemHealthScore(): number {
    let score = 0;
    let maxScore = 0;

    // WebSocket connection (50% weight)
    maxScore += 50;
    if ($connectionState.connected) {
      score += 50;
    } else if ($connectionState.connecting) {
      score += 25; // Partial score for connecting
    }

    // Polling availability (30% weight)
    maxScore += 30;
    if (pollingStatus.isActive && pollingStatus.retryCount < 3) {
      score += 30;
    } else if (pollingStatus.isActive) {
      score += 15; // Partial score for active but with errors
    }

    // Recent activity (20% weight)
    maxScore += 20;
    const lastActivityMinutes = (Date.now() - lastActivity.getTime()) / 60000;
    if (lastActivityMinutes < 5) {
      score += 20;
    } else if (lastActivityMinutes < 15) {
      score += 10;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  function clearLogs() {
    systemLogs = [];
    addLog("info", "system", "System logs cleared");
  }

  function exportLogs() {
    const logData = systemLogs
      .map(
        (log) =>
          `[${log.time}] [${log.source.toUpperCase()}] ${log.level.toUpperCase()}: ${log.message}`
      )
      .join("\n");

    const blob = new Blob([logData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `realtime-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    addLog("info", "system", "Logs exported successfully");
  }

  function handleInput(field: keyof RealTimeSettings, value: any) {
    settingsStore.updateSettings("realTime", { [field]: value });
  }

  function getFieldError(field: string): string {
    return errors[`realTime.${field}`] || "";
  }

  async function testBackendConnection() {
    addLog("info", "system", "Testing backend connection...");

    try {
      // Test using the API service health check
      const { api } = await import("$lib/services/api");
      const healthResponse = await api.healthCheck();

      if (healthResponse.status === "healthy") {
        backendStatus = {
          isOnline: true,
          lastChecked: new Date(),
          error: null,
          apiVersion: "v1.0",
        };
        addLog(
          "success",
          "system",
          "Backend connection successful - API is online"
        );
        return true;
      } else {
        throw new Error(healthResponse.message);
      }
    } catch (error: any) {
      backendStatus = {
        isOnline: false,
        lastChecked: new Date(),
        error: error.message,
        apiVersion: null,
      };

      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("f808-180-254-65-209.ngrok-free.app")
      ) {
        addLog(
          "error",
          "system",
          "Backend not running - Please start Django server at f808-180-254-65-209.ngrok-free.app"
        );
      } else {
        addLog(
          "error",
          "system",
          `Backend connection failed: ${error.message}`
        );
      }
      return false;
    }
  }

  async function startBackendWatcher() {
    // Check backend status every 30 seconds
    const checkBackend = async () => {
      await testBackendConnection();
    };

    // Initial check
    await checkBackend();

    // Set up interval
    const interval = setInterval(checkBackend, 30000);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  // Lifecycle
  onMount(() => {
    if (!browser) return;

    // Start real-time clock
    clockInterval = setInterval(() => {
      currentTime = new Date().toLocaleString();
      uptime++;
    }, 1000);

    // Update polling status
    pollingStatusInterval = setInterval(() => {
      pollingStatus = smartPolling.getStatus();
    }, 2000);

    // Initialize based on current settings
    addLog("info", "system", "Real-time dashboard initialized");

    // Start backend monitoring
    startBackendWatcher();

    // Auto-start connections based on settings (with delay for backend check)
    setTimeout(async () => {
      // Wait for initial backend check
      const isBackendOnline = await testBackendConnection();

      if (isBackendOnline) {
        if (
          settings.websocketConnected ||
          selectedConnectionMode === "websocket" ||
          selectedConnectionMode === "hybrid"
        ) {
          setTimeout(() => initializeWebSocket(), 500);
        }

        if (
          settings.pollingActive ||
          selectedConnectionMode === "polling" ||
          selectedConnectionMode === "hybrid"
        ) {
          setTimeout(() => startSmartPolling(), 700);
        }
      } else {
        addLog(
          "warn",
          "system",
          "Backend offline - Connections disabled until backend is available"
        );
      }
    }, 1000);
  });

  onDestroy(() => {
    if (clockInterval) clearInterval(clockInterval);
    if (pollingStatusInterval) clearInterval(pollingStatusInterval);

    // Cleanup connections
    if (wsManager) {
      wsManager.disconnect();
    }
    stopSmartPolling();

    addLog("info", "system", "Real-time dashboard destroyed");
  });

  // Reactive statements
  $: connectedStatus = $connectionStatus;
  $: wsState = $connectionState;
  $: recentNotifications = $notifications.slice(0, 5);
</script>

<div class="settings-tab-content">
  <!-- Functional Watermark -->
  <div class="functional-watermark">
    <span>LIVE</span>
  </div>

  <!-- Tab Header -->
  <div class="tab-header">
    <h3>Real-time Dashboard & Connection Manager</h3>
    <p>
      Monitor koneksi real-time dan sistem - <span class="current-time"
        >{currentTime}</span
      >
    </p>
  </div>

  <!-- Form Sections -->
  <div class="form-sections">
    <!-- Section 1: Connection Manager -->
    <div class="form-section">
      <div class="section-header">
        <h4>Connection Manager</h4>
        <p>Kelola koneksi WebSocket dan polling untuk monitoring real-time</p>
      </div>

      <div class="connection-grid">
        <!-- Connection Mode -->
        <div class="form-group">
          <label class="form-label">Mode Koneksi</label>
          <div class="mode-selector">
            <button
              class="mode-btn {selectedConnectionMode === 'websocket'
                ? 'active'
                : ''}"
              on:click={() => (selectedConnectionMode = "websocket")}
            >
              <i class="fas fa-bolt"></i>
              WebSocket Only
            </button>
            <button
              class="mode-btn {selectedConnectionMode === 'polling'
                ? 'active'
                : ''}"
              on:click={() => (selectedConnectionMode = "polling")}
            >
              <i class="fas fa-sync"></i>
              Polling Only
            </button>
            <button
              class="mode-btn {selectedConnectionMode === 'hybrid'
                ? 'active'
                : ''}"
              on:click={() => (selectedConnectionMode = "hybrid")}
            >
              <i class="fas fa-network-wired"></i>
              Hybrid Mode
            </button>
          </div>
        </div>

        <!-- Endpoint Selection -->
        <div class="form-group">
          <label class="form-label">Endpoint</label>
          <select bind:value={connectionEndpoint} class="form-select">
            <option value="admin">Admin Dashboard (Authenticated)</option>
            <option value="public">Public Tracking (No Auth)</option>
          </select>
        </div>

        <!-- Connection Controls -->
        <div class="form-group">
          <label class="form-label">Actions</label>
          <div class="action-buttons">
            <button
              class="btn btn-primary"
              on:click={initializeWebSocket}
              disabled={isInitializing}
            >
              {#if isInitializing}
                <div class="loading-spinner"></div>
                Connecting...
              {:else}
                <i class="fas fa-play"></i>
                Connect
              {/if}
            </button>

            <button class="btn btn-secondary" on:click={disconnectWebSocket}>
              <i class="fas fa-stop"></i>
              Disconnect
            </button>

            <button class="btn btn-outline" on:click={testConnection}>
              <i class="fas fa-vial"></i>
              Test
            </button>

            <button class="btn btn-warning" on:click={forceReconnect}>
              <i class="fas fa-redo"></i>
              Force Reconnect
            </button>

            <button class="btn btn-outline" on:click={testBackendConnection}>
              <i class="fas fa-server"></i>
              Test Backend
            </button>
          </div>
        </div>

        <!-- Auto-reconnect -->
        <div class="form-group">
          <label class="toggle-label">
            <input type="checkbox" bind:checked={autoReconnect} />
            <span class="toggle-text">Auto-reconnect on connection loss</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Section 2: Live Status Dashboard -->
    <div class="status-section">
      <div class="section-header">
        <h4>Live Status Dashboard</h4>
        <p>Monitor real-time connection status dan system metrics</p>
      </div>

      <div class="status-grid">
        <!-- Backend Status -->
        <div class="status-card">
          <div class="status-header">
            <h5><i class="fas fa-server"></i> Backend API</h5>
            <div
              class="status-indicator {backendStatus.isOnline
                ? 'connected'
                : 'disconnected'}"
            >
              <div class="status-dot"></div>
              <span>{backendStatus.isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
          <div class="status-details">
            <p>API Version: {backendStatus.apiVersion || "Unknown"}</p>
            <p>
              Last Check: {backendStatus.lastChecked
                ? backendStatus.lastChecked.toLocaleTimeString()
                : "Never"}
            </p>
            {#if backendStatus.error}
              <p class="error-text">Error: {backendStatus.error}</p>
            {/if}
          </div>
        </div>

        <!-- WebSocket Status -->
        <div class="status-card">
          <div class="status-header">
            <h5><i class="fas fa-bolt"></i> WebSocket</h5>
            <div
              class="status-indicator {wsState.connected
                ? 'connected'
                : wsState.connecting
                  ? 'connecting'
                  : 'disconnected'}"
            >
              <div class="status-dot"></div>
              <span>{connectedStatus.text}</span>
            </div>
          </div>
          <div class="status-details">
            <p>Access Level: {wsState.accessLevel}</p>
            <p>Reconnect Attempts: {wsState.reconnectAttempts}</p>
            <p>
              Last Connected: {wsState.lastConnected
                ? new Date(wsState.lastConnected).toLocaleTimeString()
                : "Never"}
            </p>
          </div>
        </div>

        <!-- Polling Status -->
        <div class="status-card">
          <div class="status-header">
            <h5><i class="fas fa-sync"></i> Smart Polling</h5>
            <div
              class="status-indicator {pollingStatus.isActive
                ? 'connected'
                : 'disconnected'}"
            >
              <div class="status-dot"></div>
              <span>{pollingStatus.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
          <div class="status-details">
            <p>
              Interval: {(pollingStatus.currentInterval / 1000).toFixed(1)}s
            </p>
            <p>Retry Count: {pollingStatus.retryCount}</p>
            <p>
              Last Update: {pollingStatus.lastUpdate
                ? new Date(pollingStatus.lastUpdate).toLocaleTimeString()
                : "Never"}
            </p>
          </div>
        </div>

        <!-- Activity Summary -->
        <div class="status-card">
          <div class="status-header">
            <h5><i class="fas fa-activity"></i> Activity</h5>
            <div class="metrics-badge">
              <span class="metric-number">{activityCount}</span>
              <span class="metric-label">Events</span>
            </div>
          </div>
          <div class="status-details">
            <p>Last Activity: {lastActivity.toLocaleTimeString()}</p>
            <p>Total Events: {activityCount}</p>
          </div>
        </div>

        <!-- System Health -->
        <div class="status-card">
          <div class="status-header">
            <h5><i class="fas fa-heartbeat"></i> System Health</h5>
            <div class="health-indicator">
              <div
                class="health-score {getSystemHealthScore() > 70
                  ? 'good'
                  : getSystemHealthScore() > 40
                    ? 'warning'
                    : 'poor'}"
              >
                {getSystemHealthScore()}%
              </div>
            </div>
          </div>
          <div class="status-details">
            <p>
              Uptime: {Math.floor(uptime / 60)}m {uptime % 60}s
            </p>
            <p>Connected: {$connectionState.connected ? "Yes" : "No"}</p>
            <p>
              Mode: {$connectionState.connected && pollingStatus.isActive
                ? "HYBRID"
                : $connectionState.connected
                  ? "WEBSOCKET"
                  : pollingStatus.isActive
                    ? "POLLING"
                    : "DISCONNECTED"}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Live System Logs -->
    <div class="logs-section">
      <div class="section-header">
        <h4>Live System Logs</h4>
        <p>
          Monitor aktivitas real-time dan debugging information ({systemLogs.length}
          entries)
        </p>
      </div>

      <div class="logs-content">
        <div class="logs-header">
          <h5>System Activity</h5>
          <div class="logs-controls">
            <button
              class="btn btn-outline btn-sm"
              on:click={exportLogs}
              disabled={systemLogs.length === 0}
            >
              <i class="fas fa-download"></i>
              Export ({systemLogs.length})
            </button>
            <button
              class="btn btn-outline btn-sm"
              on:click={clearLogs}
              disabled={systemLogs.length === 0}
            >
              <i class="fas fa-trash"></i>
              Clear
            </button>
          </div>
        </div>

        <div class="logs-list">
          {#each systemLogs as log (log.id)}
            <div class="log-entry {log.level}">
              <span class="log-time">{log.time}</span>
              <span class="log-source {log.source}"
                >{log.source.toUpperCase()}</span
              >
              <span class="log-level">{log.level.toUpperCase()}</span>
              <span class="log-message">{log.message}</span>
            </div>
          {:else}
            <div class="empty-logs">
              <i class="fas fa-inbox"></i>
              <p>No system logs yet. Start a connection to see activity.</p>
            </div>
          {/each}
        </div>

        <!-- Notifications Preview -->
        {#if recentNotifications.length > 0}
          <div class="notifications-preview">
            <h6>Recent Notifications</h6>
            {#each recentNotifications as notification}
              <div class="notification-item {notification.type}">
                <span class="notification-time"
                  >{new Date(notification.timestamp).toLocaleTimeString()}</span
                >
                <span class="notification-message">{notification.message}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Quick Start Guide (when backend offline) -->
      {#if !backendStatus.isOnline}
        <div class="quick-start-guide">
          <h6><i class="fas fa-info-circle"></i> Quick Start Guide</h6>
          <p>Backend API tidak terdeteksi. Untuk menjalankan backend:</p>
          <div class="code-block">
            <code>
              # Navigate to backend directory<br />
              cd /path/to/backend<br /><br />
              # Start Django development server<br />
              python manage.py runserver localhost:8000<br /><br />
              # Backend akan tersedia di:<br />
              # HTTP API: http://localhost:8000/api/v1/<br />
              # WebSocket: ws://localhost:8000/ws/
            </code>
          </div>
          <p class="guide-note">
            <i class="fas fa-lightbulb"></i>
            Setelah backend berjalan, dashboard akan otomatis detect dan connect!
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-tab-content {
    position: relative;
    padding: 0;
    background: transparent;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .functional-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 4rem;
    font-weight: bold;
    color: rgba(16, 185, 129, 0.03);
    pointer-events: none;
    z-index: 0;
    user-select: none;
    letter-spacing: 0.2em;
    animation: pulse 3s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.05;
    }
    50% {
      opacity: 0.1;
    }
  }

  .tab-header {
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
  }

  .tab-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .tab-header p {
    color: #6b7280;
    margin: 0;
    font-size: 1rem;
  }

  .current-time {
    color: #10b981;
    font-weight: 600;
    font-family: "SF Mono", monospace;
    padding: 0.25rem 0.5rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 4px;
  }

  .form-sections {
    display: grid;
    gap: 1.5rem;
    position: relative;
    z-index: 1;
    grid-template-columns: 1fr;
  }

  .form-section,
  .status-section,
  .logs-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .form-section:hover,
  .status-section:hover,
  .logs-section:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }

  .section-header {
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .section-header h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .section-header p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .connection-grid {
    display: grid;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .mode-selector {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }

  .mode-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #f8fafc;
  }

  .mode-btn.active {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
  }

  .form-select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
  }

  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
  }

  .toggle-text {
    user-select: none;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .status-card {
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.2s ease;
  }

  .status-card:hover {
    background: #f8fafc;
    border-color: #e5e7eb;
  }

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .status-header h5 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .status-indicator.connected .status-dot {
    background: #10b981;
  }

  .status-indicator.connecting .status-dot {
    background: #f59e0b;
  }

  .status-indicator.disconnected .status-dot {
    background: #ef4444;
  }

  .status-indicator.connected {
    color: #10b981;
  }

  .status-indicator.connecting {
    color: #f59e0b;
  }

  .status-indicator.disconnected {
    color: #ef4444;
  }

  .status-details {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .status-details p {
    margin: 0 0 0.25rem 0;
  }

  .metrics-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .metric-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: #10b981;
  }

  .metric-label {
    font-size: 0.7rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .health-score {
    font-size: 1rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .health-score.good {
    background: #d1fae5;
    color: #065f46;
  }

  .health-score.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .health-score.poor {
    background: #fee2e2;
    color: #991b1b;
  }

  .error-text {
    color: #ef4444 !important;
    font-weight: 500;
    font-size: 0.7rem;
  }

  .logs-content {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
  }

  .logs-header h5 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .logs-controls {
    display: flex;
    gap: 0.5rem;
  }

  .logs-list {
    max-height: 300px;
    overflow-y: auto;
    font-family: "SF Mono", "Monaco", monospace;
  }

  .log-entry {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.75rem;
    animation: slideInRight 0.3s ease-out;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .log-entry:hover {
    background: #f8fafc;
  }

  .log-time {
    color: #6b7280;
    min-width: 60px;
    font-variant-numeric: tabular-nums;
  }

  .log-source {
    min-width: 60px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.65rem;
  }

  .log-source.websocket {
    color: #3b82f6;
  }
  .log-source.polling {
    color: #f59e0b;
  }
  .log-source.system {
    color: #6b7280;
  }

  .log-level {
    font-weight: 600;
    min-width: 50px;
    text-transform: uppercase;
  }

  .log-entry.info .log-level {
    color: #3b82f6;
  }
  .log-entry.warn .log-level {
    color: #f59e0b;
  }
  .log-entry.error .log-level {
    color: #ef4444;
  }
  .log-entry.success .log-level {
    color: #10b981;
  }

  .log-message {
    color: #374151;
    flex: 1;
  }

  .empty-logs {
    padding: 2rem;
    text-align: center;
    color: #9ca3af;
  }

  .empty-logs i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  .notifications-preview {
    padding: 1rem;
    background: #f9fafb;
    border-top: 1px solid #e2e8f0;
  }

  .notifications-preview h6 {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .notification-item {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem 0;
    font-size: 0.75rem;
  }

  .notification-time {
    color: #6b7280;
    min-width: 60px;
  }

  .notification-message {
    color: #374151;
  }

  .quick-start-guide {
    margin-top: 1rem;
    padding: 1.5rem;
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 8px;
  }

  .quick-start-guide h6 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #0369a1;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quick-start-guide p {
    color: #374151;
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
  }

  .code-block {
    background: #1f2937;
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
  }

  .code-block code {
    color: #10b981;
    font-size: 0.75rem;
    line-height: 1.6;
    display: block;
  }

  .guide-note {
    background: #fefce8;
    border: 1px solid #eab308;
    border-radius: 6px;
    padding: 0.75rem;
    margin: 1rem 0 0 0;
    color: #a16207;
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    background: none;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
    border-color: #6b7280;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
    border-color: #4b5563;
  }

  .btn-warning {
    background: #f59e0b;
    color: white;
    border-color: #f59e0b;
  }

  .btn-warning:hover:not(:disabled) {
    background: #d97706;
    border-color: #d97706;
  }

  .btn-outline {
    background: white;
    color: #6b7280;
    border-color: #d1d5db;
  }

  .btn-outline:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

  .btn-sm {
    padding: 0.375rem 0.5rem;
    font-size: 0.7rem;
  }

  .loading-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .status-grid {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      grid-template-columns: 1fr;
    }

    .functional-watermark {
      font-size: 2.5rem;
      opacity: 0.8;
    }

    .mode-selector {
      grid-template-columns: 1fr;
    }

    .logs-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .log-entry {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
    }
  }
</style>
