<!-- Tab Notifikasi Email -->
<script lang="ts">
  import {
    settingsStore,
    type EmailNotificationSettings,
  } from "$lib/stores/settings";

  export let settings: EmailNotificationSettings;
  export let errors: Record<string, string> = {};

  let previewVisible = false;

  interface MockupData {
    customerName: string;
    orderNumber: string;
    products: string;
    totalAmount: string;
    orderDate: string;
  }

  let mockupData: MockupData = {
    customerName: "John Doe",
    orderNumber: "KP-2024-001",
    products: "Kaos Polos Hitam (M) x 2",
    totalAmount: "Rp 150.000",
    orderDate: new Date().toLocaleDateString("id-ID"),
  };

  function handleInput(field: keyof EmailNotificationSettings, value: any) {
    settingsStore.updateSettings("emailNotifications", { [field]: value });
    settingsStore.validateField("emailNotifications", field, value);
  }

  function getFieldError(field: string): string {
    return errors[`emailNotifications.${field}`] || "";
  }

  function togglePreview() {
    previewVisible = !previewVisible;
  }

  function updateMockupData(field: keyof MockupData, value: string) {
    mockupData[field] = value;
    mockupData = { ...mockupData };
  }

  function generatePreviewHTML(): string {
    let content = settings.emailHeader || "<h2>Kaos Polos Berkualitas</h2>";

    content += `
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #111827; margin: 0 0 10px 0;">Pesanan Baru Diterima</h3>
        <p style="color: #6b7280; margin: 0;">Halo Admin, ada pesanan baru yang masuk!</p>
      </div>

      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="color: #111827; margin: 0 0 15px 0;">Detail Pesanan</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Nama Pelanggan:</td>
            <td style="padding: 8px 0; color: #111827;">${mockupData.customerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Nomor Pesanan:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600;">${mockupData.orderNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Produk:</td>
            <td style="padding: 8px 0; color: #111827;">${mockupData.products}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Total:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600;">${mockupData.totalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Tanggal:</td>
            <td style="padding: 8px 0; color: #111827;">${mockupData.orderDate}</td>
          </tr>
        </table>
      </div>
    `;

    content +=
      settings.emailFooter ||
      "<p>Terima kasih telah menggunakan layanan kami.</p>";

    return content;
  }
</script>

<div class="settings-tab-content">
  <!-- Mockup Watermark -->
  <div class="mockup-watermark">
    <span>MOCKUP</span>
  </div>

  <!-- Tab Header -->
  <div class="tab-header">
    <h3>Template Email (MOCKUP)</h3>
    <p>Kelola template dan pengaturan notifikasi email untuk sistem</p>
  </div>

  <!-- Form Sections -->
  <div class="form-sections">
    <!-- Section 1: Pengaturan Notifikasi -->
    <div class="form-section">
      <div class="section-header">
        <h4>Pengaturan Notifikasi</h4>
        <p>Kontrol kapan dan bagaimana notifikasi email dikirim</p>
      </div>

      <div class="form-grid">
        <!-- Toggle Notifikasi -->
        <div class="form-group toggle-group">
          <div class="toggle-card">
            <div class="toggle-info">
              <label for="enableNewOrderNotifications" class="form-label">
                Notifikasi Pesanan Baru
              </label>
              <div class="help-text">
                Kirim email otomatis ke admin ketika ada pesanan baru masuk
              </div>
            </div>
            <div class="toggle-switch">
              <input
                id="enableNewOrderNotifications"
                type="checkbox"
                bind:checked={settings.enableNewOrderNotifications}
                on:change={(e) =>
                  handleInput(
                    "enableNewOrderNotifications",
                    (e.target as HTMLInputElement).checked
                  )}
              />
              <label for="enableNewOrderNotifications" class="toggle-slider">
                <span class="toggle-text off">OFF</span>
                <span class="toggle-text on">ON</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Template Editor -->
    <div class="form-section">
      <div class="section-header">
        <h4>Editor Template</h4>
        <p>Kustomisasi header dan footer email yang akan dikirim</p>
      </div>

      <div class="form-grid">
        <!-- Email Header -->
        <div class="form-group">
          <label for="emailHeader" class="form-label"> Header Email </label>
          <textarea
            id="emailHeader"
            class="form-textarea {getFieldError('emailHeader') ? 'error' : ''}"
            bind:value={settings.emailHeader}
            on:input={(e) =>
              handleInput(
                "emailHeader",
                (e.target as HTMLTextAreaElement).value
              )}
            placeholder="<h2>Nama Perusahaan</h2>"
            rows="3"
          ></textarea>
          <div class="help-text">
            HTML untuk header email. Gunakan tag HTML sederhana seperti h1, h2,
            p, img
          </div>
          {#if getFieldError("emailHeader")}
            <div class="error-text">{getFieldError("emailHeader")}</div>
          {/if}
        </div>

        <!-- Email Footer -->
        <div class="form-group">
          <label for="emailFooter" class="form-label"> Footer Email </label>
          <textarea
            id="emailFooter"
            class="form-textarea {getFieldError('emailFooter') ? 'error' : ''}"
            bind:value={settings.emailFooter}
            on:input={(e) =>
              handleInput(
                "emailFooter",
                (e.target as HTMLTextAreaElement).value
              )}
            placeholder="<p>Terima kasih telah menggunakan layanan kami.</p>"
            rows="3"
          ></textarea>
          <div class="help-text">
            HTML untuk footer email. Tambahkan informasi kontak atau social
            media
          </div>
          {#if getFieldError("emailFooter")}
            <div class="error-text">{getFieldError("emailFooter")}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Section 3: Preview & Testing -->
    <div class="form-section">
      <div class="section-header">
        <h4>Preview & Mockup</h4>
        <p>Pratinjau dan kustomisasi data contoh untuk testing template</p>
      </div>

      <!-- Mockup Data Editor -->
      <div class="mockup-editor">
        <h5>Data Contoh (Customizable)</h5>
        <div class="mockup-grid">
          <div class="mockup-field">
            <label>Nama Pelanggan</label>
            <input
              type="text"
              class="mockup-input"
              bind:value={mockupData.customerName}
              on:input={(e) =>
                updateMockupData(
                  "customerName",
                  (e.target as HTMLInputElement).value
                )}
            />
          </div>
          <div class="mockup-field">
            <label>Nomor Pesanan</label>
            <input
              type="text"
              class="mockup-input"
              bind:value={mockupData.orderNumber}
              on:input={(e) =>
                updateMockupData(
                  "orderNumber",
                  (e.target as HTMLInputElement).value
                )}
            />
          </div>
          <div class="mockup-field">
            <label>Produk</label>
            <input
              type="text"
              class="mockup-input"
              bind:value={mockupData.products}
              on:input={(e) =>
                updateMockupData(
                  "products",
                  (e.target as HTMLInputElement).value
                )}
            />
          </div>
          <div class="mockup-field">
            <label>Total Amount</label>
            <input
              type="text"
              class="mockup-input"
              bind:value={mockupData.totalAmount}
              on:input={(e) =>
                updateMockupData(
                  "totalAmount",
                  (e.target as HTMLInputElement).value
                )}
            />
          </div>
        </div>
      </div>

      <!-- Preview Controls -->
      <div class="preview-controls">
        <button type="button" class="btn btn-outline" on:click={togglePreview}>
          <i class="fas {previewVisible ? 'fa-eye-slash' : 'fa-eye'}"></i>
          <span>{previewVisible ? "Sembunyikan" : "Tampilkan"} Preview</span>
        </button>
      </div>

      <!-- Email Preview -->
      {#if previewVisible}
        <div class="email-preview">
          <div class="preview-header">
            <h5>Preview Email</h5>
            <button
              type="button"
              class="refresh-btn"
              on:click={() => (previewVisible = true)}
              title="Refresh preview"
            >
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <div class="preview-content">
            {@html generatePreviewHTML()}
          </div>
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

  .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    background: white;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    resize: vertical;
    min-height: 80px;
  }

  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-textarea.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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

  .mockup-editor {
    margin-bottom: 1.5rem;
    padding: 1.25rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .mockup-editor h5 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
  }

  .mockup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .mockup-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mockup-field label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
  }

  .mockup-input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    background: white;
  }

  .mockup-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .preview-controls {
    margin-bottom: 1rem;
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
    background: none;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .email-preview {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .preview-header h5 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .refresh-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .refresh-btn:hover {
    color: #374151;
    background: rgba(107, 114, 128, 0.1);
  }

  .preview-content {
    padding: 1.5rem;
    max-height: 600px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    line-height: 1.6;
  }

  /* Preview content styling */
  .preview-content :global(h1),
  .preview-content :global(h2),
  .preview-content :global(h3) {
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .preview-content :global(p) {
    color: #374151;
    margin: 0 0 1rem 0;
  }

  .preview-content :global(table) {
    font-size: 0.875rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .form-grid,
    .mockup-grid {
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

    .preview-content {
      padding: 1rem;
    }
  }
</style>
