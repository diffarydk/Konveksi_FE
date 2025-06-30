<!-- Tab Integrasi API -->
<script lang="ts">
  import { settingsStore, type ApiSettings } from "$lib/stores/settings";

  export let settings: ApiSettings;
  export let errors: Record<string, string> = {};

  // State untuk show/hide API keys
  let showSecrets: Record<string, boolean> = {
    xenditApiKey: false,
    fonntteToken: false,
  };

  function handleInput(field: keyof ApiSettings, value: any) {
    settingsStore.updateSettings("api", { [field]: value });
    settingsStore.validateField("api", field, value);
  }

  function getFieldError(field: string): string {
    return errors[`api.${field}`] || "";
  }

  function toggleSecret(field: string) {
    showSecrets[field] = !showSecrets[field];
    showSecrets = { ...showSecrets };
  }
</script>

<div class="settings-tab-content">
  <!-- Mockup Watermark -->
  <div class="mockup-watermark">
    <span>MOCKUP</span>
  </div>

  <!-- Tab Header -->
  <div class="tab-header">
    <h3>Integrasi API (MOCKUP)</h3>
    <p>Kelola kunci API untuk layanan eksternal yang terintegrasi</p>
  </div>

  <!-- Form Sections -->
  <div class="form-sections">
    <!-- Section 1: Payment Gateway -->
    <div class="form-section">
      <div class="section-header">
        <h4>Payment Gateway</h4>
        <p>Integrasi dengan Xendit untuk pembayaran digital</p>
      </div>

      <div class="form-grid">
        <!-- Xendit API Key -->
        <div class="form-group">
          <label for="xenditApiKey" class="form-label">
            Xendit API Key <span class="required">*</span>
          </label>
          <div class="secret-input-wrapper">
            <input
              id="xenditApiKey"
              type={showSecrets.xenditApiKey ? "text" : "password"}
              class="form-input secret-input {getFieldError('xenditApiKey')
                ? 'error'
                : ''}"
              bind:value={settings.xenditApiKey}
              on:input={(e) =>
                handleInput(
                  "xenditApiKey",
                  (e.target as HTMLInputElement)?.value
                )}
              placeholder="xnd_development_... atau xnd_production_..."
            />
            <button
              type="button"
              class="secret-toggle"
              on:click={() => toggleSecret("xenditApiKey")}
              title={showSecrets.xenditApiKey ? "Sembunyikan" : "Tampilkan"}
              aria-label={showSecrets.xenditApiKey
                ? "Sembunyikan"
                : "Tampilkan"}
            >
              <i
                class="fas {showSecrets.xenditApiKey
                  ? 'fa-eye-slash'
                  : 'fa-eye'}"
              ></i>
            </button>
          </div>
          <div class="help-text">
            API Key dari Xendit untuk memproses pembayaran digital seperti VA,
            QRIS, dan e-wallet
          </div>
          {#if getFieldError("xenditApiKey")}
            <div class="error-text">{getFieldError("xenditApiKey")}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Section 2: WhatsApp Integration -->
    <div class="form-section">
      <div class="section-header">
        <h4>WhatsApp Integration</h4>
        <p>Integrasi dengan Fonnte untuk pesan WhatsApp otomatis</p>
      </div>

      <div class="form-grid">
        <!-- Fonnte Token -->
        <div class="form-group">
          <label for="fonntteToken" class="form-label"> Fonnte Token </label>
          <div class="secret-input-wrapper">
            <input
              id="fonntteToken"
              type={showSecrets.fonntteToken ? "text" : "password"}
              class="form-input secret-input {getFieldError('fonntteToken')
                ? 'error'
                : ''}"
              bind:value={settings.fonntteToken}
              on:input={(e) =>
                handleInput(
                  "fonntteToken",
                  (e.target as HTMLInputElement)?.value
                )}
              placeholder="Masukkan Fonnte token..."
            />
            <button
              type="button"
              class="secret-toggle"
              on:click={() => toggleSecret("fonntteToken")}
              title={showSecrets.fonntteToken ? "Sembunyikan" : "Tampilkan"}
              aria-label={showSecrets.fonntteToken
                ? "Sembunyikan"
                : "Tampilkan"}
            >
              <i
                class="fas {showSecrets.fonntteToken
                  ? 'fa-eye-slash'
                  : 'fa-eye'}"
              ></i>
            </button>
          </div>
          <div class="help-text">
            Token API dari Fonnte untuk mengirim notifikasi dan pesan WhatsApp
            otomatis
          </div>
          {#if getFieldError("fonntteToken")}
            <div class="error-text">{getFieldError("fonntteToken")}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Integration Status -->
    <div class="integration-status">
      <h4>Status Integrasi</h4>
      <div class="status-grid">
        <div class="status-item">
          <div
            class="status-icon {settings.xenditApiKey
              ? 'connected'
              : 'disconnected'}"
          >
            <i class="fas {settings.xenditApiKey ? 'fa-check' : 'fa-times'}"
            ></i>
          </div>
          <div class="status-info">
            <h5>Xendit Payment</h5>
            <p
              class="status-text {settings.xenditApiKey
                ? 'connected'
                : 'disconnected'}"
            >
              {settings.xenditApiKey ? "Terhubung" : "Belum terkonfigurasi"}
            </p>
          </div>
        </div>

        <div class="status-item">
          <div
            class="status-icon {settings.fonntteToken
              ? 'connected'
              : 'disconnected'}"
          >
            <i class="fas {settings.fonntteToken ? 'fa-check' : 'fa-times'}"
            ></i>
          </div>
          <div class="status-info">
            <h5>WhatsApp Fonnte</h5>
            <p
              class="status-text {settings.fonntteToken
                ? 'connected'
                : 'disconnected'}"
            >
              {settings.fonntteToken ? "Terhubung" : "Belum terkonfigurasi"}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Notice -->
    <div class="security-notice">
      <div class="notice-header">
        <i class="fas fa-shield-alt"></i>
        <h4>Keamanan API Keys</h4>
      </div>
      <div class="notice-content">
        <p>Pastikan untuk menjaga kerahasiaan kunci API Anda:</p>
        <ul>
          <li>Jangan membagikan API keys dengan pihak yang tidak berwenang</li>
          <li>Gunakan environment production hanya untuk website live</li>
          <li>Monitor penggunaan API melalui dashboard provider</li>
          <li>Ganti kunci secara berkala untuk keamanan optimal</li>
        </ul>
      </div>
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

  .mockup-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 6rem;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.02);
    pointer-events: none;
    z-index: 0;
    user-select: none;
    letter-spacing: 0.2em;
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

  .form-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;
    z-index: 1;
  }

  .form-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    transition: all 0.2s ease;
  }

  .form-section:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }

  .section-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
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

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

  .required {
    color: #ef4444;
  }

  .secret-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    background: white;
  }

  .secret-input {
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    padding-right: 3rem;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .secret-toggle {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .secret-toggle:hover {
    color: #6b7280;
    background: rgba(156, 163, 175, 0.1);
  }

  .help-text {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
    margin-top: 0.25rem;
  }

  .error-text {
    font-size: 0.75rem;
    color: #ef4444;
    font-weight: 500;
    margin-top: 0.25rem;
  }

  .integration-status {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
  }

  .integration-status h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #f3f4f6;
  }

  .status-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .status-icon.connected {
    background: #dcfce7;
    color: #16a34a;
  }

  .status-icon.disconnected {
    background: #fef2f2;
    color: #dc2626;
  }

  .status-info h5 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .status-text {
    font-size: 0.75rem;
    margin: 0;
    font-weight: 500;
  }

  .status-text.connected {
    color: #16a34a;
  }

  .status-text.disconnected {
    color: #dc2626;
  }

  .security-notice {
    background: #fffbeb;
    border: 1px solid #fbbf24;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .notice-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .notice-header i {
    color: #f59e0b;
    font-size: 1.25rem;
  }

  .notice-header h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #92400e;
    margin: 0;
  }

  .notice-content p {
    color: #92400e;
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
  }

  .notice-content ul {
    color: #92400e;
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
  }

  .notice-content li {
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .notice-content li:last-child {
    margin-bottom: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .form-grid,
    .status-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .status-item {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }

    .mockup-watermark {
      font-size: 3rem;
    }
  }
</style>
