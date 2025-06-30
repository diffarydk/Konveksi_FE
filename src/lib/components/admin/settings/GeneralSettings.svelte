<!-- Tab Pengaturan Umum -->
<script lang="ts">
  import { settingsStore, type GeneralSettings } from "$lib/stores/settings";

  export let settings: GeneralSettings;
  export let errors: Record<string, string> = {};

  let logoFile: File | null = null;
  let logoPreview: string = settings.logoUrl || "";

  function handleInput(field: keyof GeneralSettings, value: any) {
    settingsStore.updateSettings("general", { [field]: value });
    settingsStore.validateField("general", field, value);
  }

  function handleLogoUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      logoFile = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        logoPreview = e.target?.result as string;
        handleInput("logoUrl", logoPreview);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeLogoPreview() {
    logoFile = null;
    logoPreview = "";
    handleInput("logoUrl", "");

    // Reset file input
    const fileInput = document.getElementById("logoUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }

  function getFieldError(field: string): string {
    return errors[`general.${field}`] || "";
  }
</script>

<div class="settings-tab-content">
  <!-- Mockup Watermark -->
  <div class="mockup-watermark">
    <span>MOCKUP</span>
  </div>

  <!-- Tab Header -->
  <div class="tab-header">
    <h3>Pengaturan Umum (MOCKUP)</h3>
    <p>Kelola informasi dasar website dan konfigurasi sistem</p>
  </div>

  <!-- Form Grid -->
  <div class="form-sections">
    <!-- Section 1: Website Identity -->
    <div class="form-section">
      <div class="section-header">
        <h4>Identitas Website</h4>
        <p>Informasi dasar yang akan ditampilkan di website</p>
      </div>

      <div class="form-grid">
        <!-- Nama Situs -->
        <div class="form-group">
          <label for="siteName" class="form-label">
            Nama Situs <span class="required">*</span>
          </label>
          <input
            id="siteName"
            type="text"
            class="form-input {getFieldError('siteName') ? 'error' : ''}"
            bind:value={settings.siteName}
            on:input={(e) =>
              handleInput("siteName", (e.target as HTMLInputElement).value)}
            placeholder="Masukkan nama situs"
          />
          <div class="help-text">
            Nama ini akan ditampilkan di header website dan dokumen resmi
          </div>
          {#if getFieldError("siteName")}
            <div class="error-text">{getFieldError("siteName")}</div>
          {/if}
        </div>

        <!-- Logo Upload -->
        <div class="form-group">
          <label for="logoUpload" class="form-label"> Logo Situs </label>

          <div class="logo-upload-container">
            {#if logoPreview}
              <div class="logo-preview">
                <img src={logoPreview} alt="Logo preview" />
                <div class="logo-overlay">
                  <button
                    type="button"
                    class="remove-logo-btn"
                    on:click={removeLogoPreview}
                    title="Hapus logo"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            {:else}
              <div class="logo-upload-area">
                <div class="upload-icon">
                  <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="upload-text">
                  <p>
                    Drag & drop logo atau <span class="upload-link"
                      >pilih file</span
                    >
                  </p>
                  <p class="upload-hint">PNG, JPG, SVG maksimal 2MB</p>
                </div>
              </div>
            {/if}

            <input
              id="logoUpload"
              type="file"
              class="logo-input"
              accept="image/*"
              on:change={handleLogoUpload}
            />
          </div>

          <div class="help-text">
            Logo yang akan ditampilkan di header website. Rasio persegi atau
            landscape disarankan.
          </div>
          {#if getFieldError("logoUrl")}
            <div class="error-text">{getFieldError("logoUrl")}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Section 2: Contact Information -->
    <div class="form-section">
      <div class="section-header">
        <h4>Informasi Kontak</h4>
        <p>Email yang akan digunakan untuk komunikasi sistem</p>
      </div>

      <div class="form-grid">
        <!-- Email Kontak -->
        <div class="form-group">
          <label for="contactEmail" class="form-label">
            Email Kontak Utama <span class="required">*</span>
          </label>
          <input
            id="contactEmail"
            type="email"
            class="form-input {getFieldError('contactEmail') ? 'error' : ''}"
            bind:value={settings.contactEmail}
            on:input={(e) =>
              handleInput("contactEmail", (e.target as HTMLInputElement).value)}
            placeholder="admin@example.com"
          />
          <div class="help-text">
            Email ini akan digunakan untuk komunikasi sistem dan support
            pelanggan
          </div>
          {#if getFieldError("contactEmail")}
            <div class="error-text">{getFieldError("contactEmail")}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Section 3: System Settings -->
    <div class="form-section">
      <div class="section-header">
        <h4>Pengaturan Sistem</h4>
        <p>Kontrol akses dan status operasional website</p>
      </div>

      <div class="form-grid">
        <!-- Mode Pemeliharaan -->
        <div class="form-group toggle-group">
          <div class="toggle-card">
            <div class="toggle-info">
              <label for="maintenanceMode" class="form-label">
                Mode Pemeliharaan
              </label>
              <div class="help-text">
                Aktifkan untuk menonaktifkan akses publik sementara. Hanya admin
                yang dapat mengakses website.
              </div>
            </div>
            <div class="toggle-switch">
              <input
                id="maintenanceMode"
                type="checkbox"
                bind:checked={settings.maintenanceMode}
                on:change={(e) =>
                  handleInput(
                    "maintenanceMode",
                    (e.target as HTMLInputElement).checked
                  )}
              />
              <label for="maintenanceMode" class="toggle-slider">
                <span class="toggle-text off">OFF</span>
                <span class="toggle-text on">ON</span>
              </label>
            </div>
          </div>

          {#if settings.maintenanceMode}
            <div class="maintenance-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <span
                >Website sedang dalam mode pemeliharaan. Pengunjung tidak dapat
                mengakses website.</span
              >
            </div>
          {/if}
        </div>
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

  .form-input {
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

  .logo-upload-container {
    position: relative;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
    overflow: hidden;
  }

  .logo-upload-container:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  .logo-upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    text-align: center;
  }

  .upload-icon {
    font-size: 2.5rem;
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  .upload-text p {
    margin: 0.25rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .upload-link {
    color: #3b82f6;
    font-weight: 500;
  }

  .upload-hint {
    font-size: 0.75rem !important;
    color: #9ca3af !important;
  }

  .logo-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .logo-preview {
    position: relative;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
    background: #f9fafb;
  }

  .logo-preview img {
    max-width: 100%;
    max-height: 100px;
    object-fit: contain;
    border-radius: 8px;
  }

  .logo-overlay {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }

  .remove-logo-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.75rem;
  }

  .remove-logo-btn:hover {
    background: #dc2626;
    transform: scale(1.1);
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

  .maintenance-warning {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 1rem;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    color: #92400e;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .maintenance-warning i {
    color: #f59e0b;
    font-size: 1rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .form-grid {
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

    .logo-upload-area {
      padding: 1.5rem;
    }
  }
</style>
