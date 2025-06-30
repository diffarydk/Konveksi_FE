<!-- Halaman Pengaturan Admin - Design Minimalis -->
<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { enhance } from "$app/forms";
  import { settingsStore, getTabIcon, getTabLabel } from "$lib/stores/settings";
  import {
    connectionState,
    connectionStatus,
    notifications,
    lastMessage,
    websocketStoreActions,
  } from "$lib/stores/websocketStore";
  import type { PageData } from "./$types";

  // Import komponen tab
  import GeneralSettings from "$lib/components/admin/settings/GeneralSettings.svelte";
  import ApiSettings from "$lib/components/admin/settings/ApiSettings.svelte";
  import EmailNotifications from "$lib/components/admin/settings/EmailNotifications.svelte";
  import SecuritySettings from "$lib/components/admin/settings/SecuritySettings.svelte";
  import RealTime from "$lib/components/admin/settings/RealTime.svelte";
  import Breadcrumb from "$lib/components/admin/common/Breadcrumb.svelte";
  import Notification from "$lib/components/admin/common/Notification.svelte";

  export let data: PageData;

  // Reactive stores
  let settings = settingsStore.settings;
  let uiState = settingsStore.uiState;
  let hasChanges = settingsStore.hasChanges;

  // Live WebSocket state from websocketStore
  $: wsState = $connectionState;
  $: wsConnectionStatus = $connectionStatus;
  $: wsLastMessage = $lastMessage;
  $: wsNotifications = $notifications;

  // Reactive connection status derivations
  $: isConnected = wsState.connected;
  $: isConnecting = wsState.connecting;
  $: isDisconnected = !wsState.connected && !wsState.connecting;
  $: hasError = !!wsState.error;
  $: errorMessage = wsState.error;

  // Tab configuration
  const tabs = [
    {
      id: "general",
      label: getTabLabel("general"),
      icon: "⚙️",
      description: "Pengaturan dasar",
    },
    {
      id: "api",
      label: getTabLabel("api"),
      icon: "🔑",
      description: "Integrasi layanan",
    },
    {
      id: "emailNotifications",
      label: getTabLabel("emailNotifications"),
      icon: "📧",
      description: "Template email",
    },
    {
      id: "security",
      label: getTabLabel("security"),
      icon: "🛡️",
      description: "Keamanan sistem",
    },
    {
      id: "realTime",
      label: getTabLabel("realTime"),
      icon: "🔌",
      description: "Koneksi real-time",
    },
  ];

  // Breadcrumb
  const breadcrumbs = [
    { label: "Home", link: "/admin" },
    { label: "Pengaturan", active: true },
  ];

  let activeTab = data.activeTab || "general";
  let formElement: HTMLFormElement;

  onMount(() => {
    // Load initial data ke store
    if (data.settings) {
      settingsStore.loadSettings(data.settings);
    }

    // Set active tab
    settingsStore.setActiveTab(activeTab);
  });

  function switchTab(tabId: string) {
    if (tabId === activeTab) return;

    activeTab = tabId;
    settingsStore.setActiveTab(tabId);

    // Update URL tanpa reload page
    const url = new URL($page.url);
    url.searchParams.set("tab", tabId);
    goto(url.toString(), { replaceState: true });
  }

  function handleSave() {
    let currentHasChanges!: boolean;
    let currentUiState!: any;
    hasChanges.subscribe((value) => (currentHasChanges = value))();
    uiState.subscribe((value) => (currentUiState = value))();

    if (!currentHasChanges || currentUiState.isSaving) return;

    // Skip form submission for real-time tab (it's a monitoring dashboard, not settings)
    if (activeTab === "realTime") {
      console.log("Real-time tab is for monitoring only, no settings to save");
      return;
    }

    // Trigger form submission untuk Progressive Enhancement
    if (formElement) {
      formElement.requestSubmit();
    }
  }

  function handleReset() {
    if (confirm("Apakah Anda yakin ingin membatalkan semua perubahan?")) {
      settingsStore.resetChanges();
      settingsStore.showNotification("info", "Perubahan dibatalkan");
    }
  }

  function handleReconnect() {
    // Simple reload for reconnection attempt
    window.location.reload();
  }

  async function handleManualSync() {
    try {
      const { syncWebSocketState } = await import("$lib/stores/websocketStore");
      syncWebSocketState();
      console.log("🔄 Manual sync triggered - check WebSocket status");

      // Show temporary success message
      const originalText = "Manual Sync";
      const button = document.querySelector("[data-sync-button]");
      if (button) {
        button.textContent = "✅ Synced!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Manual sync failed:", error);
    }
  }

  // Progressive Enhancement form handler
  function enhanceForm() {
    return async ({ formData }: { formData: FormData }) => {
      settingsStore.setSaving(true);
      settingsStore.clearErrors();

      try {
        // Get all form data
        const submitData = Object.fromEntries(formData);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock success response
        let currentSettings!: any;
        settings.subscribe((value) => (currentSettings = value))();
        settingsStore.saveSuccess(currentSettings);
      } catch (error) {
        console.error("Save error:", error);
        settingsStore.saveError({
          general: "Gagal menyimpan pengaturan. Silakan coba lagi.",
        });
      }
    };
  }
</script>

<!-- Page Head -->
<svelte:head>
  <title>{data.meta?.title || "Pengaturan Sistem - Admin Panel"}</title>
  <meta
    name="description"
    content={data.meta?.description || "Kelola pengaturan sistem"}
  />
</svelte:head>

<div class="settings-page">
  <!-- Breadcrumb -->
  <div class="breadcrumb-wrapper">
    <Breadcrumb items={breadcrumbs} />
  </div>

  <!-- Page Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-text">
        <h1 class="page-title">Pengaturan Sistem</h1>
        <p class="page-description">
          Kelola konfigurasi aplikasi dan integrasi sistem
        </p>
      </div>

      <!-- Save Actions -->
      <div class="save-actions">
        <button
          class="btn btn-outline"
          on:click={handleReset}
          disabled={!$hasChanges || $uiState.isSaving}
        >
          <i class="fas fa-undo"></i>
          <span>Batal</span>
        </button>

        <button
          class="btn btn-primary"
          on:click={handleSave}
          disabled={!$hasChanges || $uiState.isSaving}
          class:saving={$uiState.isSaving}
        >
          {#if $uiState.isSaving}
            <div class="loading-spinner"></div>
            <span>Menyimpan...</span>
          {:else}
            <i class="fas fa-save"></i>
            <span>Simpan Perubahan</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <div class="tab-container">
        {#each tabs as tab}
          <button
            class="tab-button"
            class:active={activeTab === tab.id}
            on:click={() => switchTab(tab.id)}
          >
            <div class="tab-content">
              <span class="tab-icon">{tab.icon}</span>
              <div class="tab-text">
                <span class="tab-label">{tab.label}</span>
                <span class="tab-description">{tab.description}</span>
              </div>

              <!-- Live Status Indicator for Real-time Tab -->
              {#if tab.id === "realTime"}
                <div
                  class="live-status-indicator"
                  class:connected={isConnected}
                  class:connecting={isConnecting}
                  class:disconnected={isDisconnected}
                  title="WebSocket Status: {wsConnectionStatus.text}"
                >
                  <div class="pulse"></div>
                </div>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Real-time Connection Status Card (Only show when realTime tab is active) -->
  {#if activeTab === "realTime"}
    <div class="settings-card realtime-summary-card">
      <div class="card-header">
        <h3>🔌 Real-time Connection Summary</h3>
        <p>Quick overview of real-time connection status.</p>
      </div>
      <div class="card-body">
        <div class="status-summary-grid">
          <div class="summary-item">
            <div class="summary-label">WebSocket</div>
            <div class="summary-value">
              <div
                class="status-indicator"
                class:connected={isConnected}
                class:connecting={isConnecting}
                class:disconnected={isDisconnected}
              >
                <div class="pulse"></div>
              </div>
              <span class="status-text">
                {isConnected
                  ? "Connected"
                  : isConnecting
                    ? "Connecting"
                    : "Disconnected"}
              </span>
            </div>
          </div>

          <div class="summary-item">
            <div class="summary-label">Access Level</div>
            <div class="summary-value">{wsState.accessLevel || "public"}</div>
          </div>

          <div class="summary-item">
            <div class="summary-label">Last Update</div>
            <div class="summary-value">
              {wsState.lastMessage
                ? new Date(wsState.lastMessage).toLocaleTimeString("id-ID")
                : "Never"}
            </div>
          </div>

          <div class="summary-item">
            <div class="summary-label">Notifications</div>
            <div class="summary-value">{wsNotifications.length} unread</div>
          </div>
        </div>

        {#if hasError}
          <div class="error-summary">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{errorMessage}</span>
            <button class="btn btn-sm btn-primary" on:click={handleReconnect}>
              Reconnect
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="page-content">
    {#if activeTab !== "realTime"}
      <!-- Progressive Enhancement Form untuk tab settings -->
      <form
        bind:this={formElement}
        method="POST"
        use:enhance={enhanceForm}
        class="settings-form"
      >
        <!-- Hidden inputs for form data -->
        <input type="hidden" name="activeTab" value={activeTab} />

        <!-- Tab Content untuk settings -->
        <div class="tab-content-wrapper">
          {#if activeTab === "general"}
            <GeneralSettings
              settings={$settings.general}
              errors={$uiState.errors}
            />
          {:else if activeTab === "api"}
            <ApiSettings settings={$settings.api} errors={$uiState.errors} />
          {:else if activeTab === "emailNotifications"}
            <EmailNotifications
              settings={$settings.emailNotifications}
              errors={$uiState.errors}
            />
          {:else if activeTab === "security"}
            <SecuritySettings
              settings={$settings.security}
              errors={$uiState.errors}
            />
          {/if}
        </div>
      </form>
    {:else}
      <!-- RealTime component terpisah dari form -->
      <div class="tab-content-wrapper realtime-tab">
        <RealTime settings={$settings.realTime} errors={$uiState.errors} />
      </div>
    {/if}
  </div>
</div>

<!-- Global Notification -->
<Notification />

<style>
  .settings-page {
    min-height: 100vh;
    background: #fafafa;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
  }

  .breadcrumb-wrapper {
    margin-bottom: 2rem;
  }

  .page-header {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.025em;
  }

  .page-description {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
    font-weight: 400;
  }

  .save-actions,
  .action-buttons {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .tab-navigation {
    background: #f9fafb;
    border-top: 1px solid #f3f4f6;
  }

  .tab-container {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .tab-container::-webkit-scrollbar {
    display: none;
  }

  .tab-button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
    position: relative;
    padding: 1rem 1.5rem;
    border-bottom: 2px solid transparent;
  }

  .tab-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .tab-icon {
    font-size: 1.125rem;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .tab-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .tab-label {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .tab-description {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 400;
    line-height: 1.2;
  }

  .live-status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: relative;
  }

  .live-status-indicator.connected {
    background: #10b981;
  }

  .live-status-indicator.connecting {
    background: #f59e0b;
  }

  .live-status-indicator.disconnected {
    background: #ef4444;
  }

  .live-status-indicator .pulse {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .live-status-indicator.connected .pulse {
    background: #10b981;
  }

  .live-status-indicator.connecting .pulse {
    background: #f59e0b;
  }

  .live-status-indicator.disconnected .pulse {
    background: #ef4444;
  }

  .tab-button:hover {
    background: rgba(59, 130, 246, 0.05);
    color: #374151;
  }

  .tab-button:hover .tab-icon {
    opacity: 1;
  }

  .tab-button.active {
    background: white;
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    box-shadow: 0 -1px 0 0 white;
  }

  .tab-button.active .tab-icon {
    opacity: 1;
  }

  .tab-button.active .tab-description {
    color: #6b7280;
  }

  .settings-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .realtime-summary-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
  }

  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .card-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .card-header p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }

  .card-body {
    padding: 1.5rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 2rem;
  }

  .setting-item:last-child {
    margin-bottom: 0;
  }

  .setting-item-label {
    flex: 1;
  }

  .setting-item-label h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .setting-item-label p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  .setting-item-control {
    flex-shrink: 0;
  }

  .realtime-status-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    position: relative;
  }

  .status-indicator.connected {
    background: #10b981;
  }

  .status-indicator.connecting {
    background: #f59e0b;
  }

  .status-indicator.disconnected {
    background: #ef4444;
  }

  .status-indicator .pulse {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .status-indicator.connected .pulse {
    background: #10b981;
  }

  .status-indicator.connecting .pulse {
    background: #f59e0b;
  }

  .status-indicator.disconnected .pulse {
    background: #ef4444;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      opacity: 1;
    }
    70% {
      transform: scale(1);
      opacity: 0.5;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }

  .status-text {
    font-weight: 500;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.status-connected {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.status-connecting {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.status-disconnected {
    background: #fee2e2;
    color: #991b1b;
  }

  .connection-details {
    display: grid;
    gap: 0.5rem;
    min-width: 300px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 4px;
    border: 1px solid #f3f4f6;
  }

  .detail-row .label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.75rem;
  }

  .detail-row .value {
    font-weight: 600;
    color: #111827;
    font-size: 0.75rem;
  }

  .detail-row .value.success {
    color: #10b981;
  }

  .detail-row .value.warning {
    color: #f59e0b;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #991b1b;
    font-size: 0.875rem;
  }

  .code-block {
    background-color: #f4f4f4;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 0.8rem;
    max-height: 150px;
    overflow-y: auto;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    min-width: 300px;
  }

  .notifications-list {
    display: grid;
    gap: 0.5rem;
    min-width: 300px;
  }

  .notification-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid;
    font-size: 0.75rem;
    gap: 0.5rem;
  }

  .notification-item.info {
    background: #eff6ff;
    border-color: #dbeafe;
    color: #1e40af;
  }

  .notification-item.success {
    background: #f0fdf4;
    border-color: #dcfce7;
    color: #166534;
  }

  .notification-item.warning {
    background: #fffbeb;
    border-color: #fed7aa;
    color: #92400e;
  }

  .notification-item.error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .notification-time {
    font-weight: 500;
    opacity: 0.7;
    white-space: nowrap;
  }

  .notification-message {
    flex: 1;
    line-height: 1.3;
  }

  .text-danger {
    color: #dc3545;
  }

  .page-content {
    position: relative;
  }

  .settings-form {
    width: 100%;
  }

  .tab-content-wrapper {
    min-height: 200px;
    animation: fadeIn 0.3s ease-out;
  }

  .tab-content-wrapper.realtime-tab {
    min-height: auto;
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

  .btn {
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    border: 1px solid;
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.875rem;
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

  .loading-spinner {
    width: 16px;
    height: 16px;
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

  /* Status Summary Grid */
  .status-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    text-align: center;
    transition: all 0.2s ease;
  }

  .summary-item:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .summary-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-value {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
  }

  .error-summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #991b1b;
    font-size: 0.875rem;
    animation: fadeIn 0.3s ease-out;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .settings-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .save-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .tab-button {
      padding: 0.75rem 1rem;
    }

    .tab-text {
      display: none;
    }

    .tab-icon {
      font-size: 1.25rem;
    }

    .setting-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .connection-details,
    .code-block,
    .notifications-list {
      min-width: auto;
      width: 100%;
    }

    .status-summary-grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .summary-item {
      padding: 0.5rem;
    }

    .summary-label {
      font-size: 0.625rem;
    }

    .summary-value {
      font-size: 0.75rem;
      flex-direction: column;
      gap: 0.25rem;
    }

    .error-summary {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
  }
</style>
