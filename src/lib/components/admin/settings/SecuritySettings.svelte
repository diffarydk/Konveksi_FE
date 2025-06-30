<!-- Tab Keamanan -->
<script lang="ts">
  import { settingsStore, type SecuritySettings } from "$lib/stores/settings";

  export let settings: SecuritySettings;
  export let errors: Record<string, string> = {};

  function handleInput(field: keyof SecuritySettings, value: any) {
    settingsStore.updateSettings("security", { [field]: value });
    settingsStore.validateField("security", field, value);
  }

  function handleToggle(field: keyof SecuritySettings, checked: boolean) {
    settingsStore.updateSettings("security", { [field]: checked });
  }

  function getFieldError(field: string): string {
    return errors[`security.${field}`] || "";
  }
</script>

<div class="settings-tab-content">
  <!-- Mockup Watermark -->
  <div class="mockup-watermark">
    <span>MOCKUP</span>
  </div>

  <!-- Tab Header -->
  <div class="tab-header">
    <h3>Keamanan Sistem (MOCKUP)</h3>
    <p>Kelola pengaturan keamanan dan akses administrator</p>
  </div>

  <!-- Form Sections -->
  <div class="form-sections">
    <!-- Section 1: Authentication Settings -->
    <div class="form-section">
      <div class="section-header">
        <h4>Pengaturan Otentikasi</h4>
        <p>Kontrol akses dan keamanan login administrator</p>
      </div>

      <div class="form-grid">
        <!-- Two Factor Authentication -->
        <div class="form-group toggle-group">
          <div class="toggle-card">
            <div class="toggle-info">
              <label for="requireTwoFactor" class="form-label">
                Wajibkan Otentikasi Dua Faktor (2FA)
              </label>
              <div class="help-text">
                Mengharuskan semua admin menggunakan aplikasi authenticator
                untuk login
              </div>
            </div>
            <div class="toggle-switch">
              <input
                id="requireTwoFactor"
                type="checkbox"
                bind:checked={settings.requireTwoFactor}
                on:change={(e) =>
                  handleToggle(
                    "requireTwoFactor",
                    (e.target as HTMLInputElement)?.checked
                  )}
              />
              <label for="requireTwoFactor" class="toggle-slider">
                <span class="toggle-text off">OFF</span>
                <span class="toggle-text on">ON</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Session Duration -->
        <div class="form-group">
          <label for="sessionDuration" class="form-label">
            Durasi Sesi Login <span class="input-unit">(Jam)</span>
          </label>
          <div class="number-input-wrapper">
            <input
              id="sessionDuration"
              type="number"
              min="1"
              max="24"
              class="form-input {getFieldError('sessionDuration')
                ? 'error'
                : ''}"
              bind:value={settings.sessionDuration}
              on:input={(e) =>
                handleInput(
                  "sessionDuration",
                  parseInt((e.target as HTMLInputElement)?.value) || 8
                )}
            />
            <span class="input-suffix">jam</span>
          </div>
          <div class="help-text">
            Admin akan otomatis logout setelah waktu ini. Maksimal 24 jam.
          </div>
          {#if getFieldError("sessionDuration")}
            <div class="error-text">{getFieldError("sessionDuration")}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Security Recommendations -->
    <div class="recommendations-section">
      <h4>Rekomendasi Keamanan</h4>
      <div class="recommendation-grid">
        <div class="recommendation-item">
          <div class="recommendation-icon">
            <i class="fas fa-key"></i>
          </div>
          <div class="recommendation-content">
            <h5>Password Kuat</h5>
            <p>Minimal 12 karakter dengan kombinasi huruf, angka, dan simbol</p>
          </div>
        </div>

        <div class="recommendation-item">
          <div class="recommendation-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div class="recommendation-content">
            <h5>Aktifkan 2FA</h5>
            <p>Lapisan keamanan tambahan untuk semua akun admin</p>
          </div>
        </div>

        <div class="recommendation-item">
          <div class="recommendation-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="recommendation-content">
            <h5>Logout Berkala</h5>
            <p>Hindari sesi login aktif terlalu lama di komputer umum</p>
          </div>
        </div>

        <div class="recommendation-item">
          <div class="recommendation-icon">
            <i class="fas fa-eye"></i>
          </div>
          <div class="recommendation-content">
            <h5>Monitor Akses</h5>
            <p>Periksa log login untuk mendeteksi aktivitas mencurigakan</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 2FA Warning -->
    {#if settings.requireTwoFactor}
      <div class="warning-notice">
        <div class="notice-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Peringatan: 2FA Diaktifkan</h4>
        </div>
        <div class="notice-content">
          <p>
            Semua admin harus mengatur authenticator app sebelum login
            berikutnya. Pastikan Anda sudah mengatur 2FA di akun Anda sebelum
            menyimpan pengaturan ini.
          </p>
          <div class="setup-steps">
            <h6>Langkah Setup 2FA:</h6>
            <ol>
              <li>Download aplikasi Google Authenticator atau Authy</li>
              <li>Scan QR code yang akan muncul saat login</li>
              <li>Masukkan kode 6 digit untuk verifikasi</li>
              <li>Simpan backup codes di tempat yang aman</li>
            </ol>
          </div>
        </div>
      </div>
    {/if}
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

  .input-unit {
    color: #9ca3af;
    font-weight: 400;
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

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .number-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-suffix {
    position: absolute;
    right: 0.75rem;
    color: #9ca3af;
    font-size: 0.875rem;
    pointer-events: none;
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

  .toggle-group {
    grid-column: 1 / -1;
  }

  .toggle-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .toggle-info {
    flex: 1;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    flex-shrink: 0;
  }

  .toggle-switch input[type="checkbox"] {
    display: none;
  }

  .toggle-slider {
    position: relative;
    display: block;
    width: 64px;
    height: 32px;
    background: #d1d5db;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .toggle-text {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.625rem;
    font-weight: 600;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .toggle-text.off {
    right: 6px;
    color: #6b7280;
  }

  .toggle-text.on {
    left: 6px;
    color: white;
    opacity: 0;
  }

  .toggle-slider::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 28px;
    height: 28px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toggle-switch input[type="checkbox"]:checked + .toggle-slider {
    background: #3b82f6;
  }

  .toggle-switch input[type="checkbox"]:checked + .toggle-slider .off {
    opacity: 0;
  }

  .toggle-switch input[type="checkbox"]:checked + .toggle-slider .on {
    opacity: 1;
  }

  .toggle-switch input[type="checkbox"]:checked + .toggle-slider::before {
    transform: translateX(32px);
  }

  .recommendations-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
  }

  .recommendations-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .recommendation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .recommendation-item {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .recommendation-item:hover {
    background: #f3f4f6;
  }

  .recommendation-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #dbeafe;
    color: #3b82f6;
    border-radius: 50%;
    flex-shrink: 0;
    font-size: 0.875rem;
  }

  .recommendation-content h5 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .recommendation-content p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  .warning-notice {
    background: #fef3c7;
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
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .setup-steps h6 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #92400e;
    margin: 0 0 0.5rem 0;
  }

  .setup-steps ol {
    color: #92400e;
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
  }

  .setup-steps li {
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }

  .setup-steps li:last-child {
    margin-bottom: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .form-grid,
    .recommendation-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .toggle-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .mockup-watermark {
      font-size: 3rem;
    }

    .recommendation-item {
      flex-direction: column;
      text-align: center;
      align-items: center;
      gap: 0.5rem;
    }
  }
</style>
