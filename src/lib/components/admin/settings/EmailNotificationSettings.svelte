<!-- Tab Notifikasi Email -->
<script lang="ts">
  import {
    settingsStore,
    type EmailNotificationSettings,
  } from "$lib/stores/settings";

  export let settings: EmailNotificationSettings;
  export let errors: Record<string, string> = {};

  let newEmailInput = "";

  function handleInput(field: keyof EmailNotificationSettings, value: any) {
    settingsStore.updateSettings("emailNotifications", { [field]: value });
    settingsStore.validateField("emailNotifications", field, value);
  }

  function handleToggle(
    field: keyof EmailNotificationSettings,
    checked: boolean
  ) {
    settingsStore.updateSettings("emailNotifications", { [field]: checked });
  }

  function addEmail() {
    if (newEmailInput.trim() && isValidEmail(newEmailInput.trim())) {
      const updatedEmails = [...settings.adminEmails, newEmailInput.trim()];
      handleInput("adminEmails", updatedEmails);
      newEmailInput = "";
    }
  }

  function removeEmail(index: number) {
    const updatedEmails = settings.adminEmails.filter((_, i) => i !== index);
    handleInput("adminEmails", updatedEmails);
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function getFieldError(field: string): string {
    return errors[`emailNotifications.${field}`] || "";
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      addEmail();
    }
  }
</script>

<div class="settings-tab-content">
  <!-- Mockup Watermark -->
  <div class="mockup-watermark">
    <span>MOCKUP</span>
  </div>

  <div class="tab-header">
    <h3>📧 Notifikasi Email</h3>
    <p>Kelola pengaturan notifikasi email dan template komunikasi</p>
  </div>

  <div class="form-grid">
    <!-- Aktifkan Notifikasi Pesanan Baru -->
    <div class="form-group toggle-group">
      <div class="toggle-header">
        <label for="enableNewOrderNotifications" class="form-label">
          Notifikasi Pesanan Baru
        </label>
        <div class="toggle-switch">
          <input
            id="enableNewOrderNotifications"
            type="checkbox"
            bind:checked={settings.enableNewOrderNotifications}
            on:change={(e) =>
              handleToggle(
                "enableNewOrderNotifications",
                (e.target as HTMLInputElement)?.checked
              )}
          />
          <label for="enableNewOrderNotifications" class="toggle-slider"
          ></label>
        </div>
      </div>
      <div class="help-text">
        Aktifkan untuk menerima notifikasi email setiap ada pesanan baru masuk
      </div>
    </div>

    <!-- Email Penerima Notifikasi -->
    <div class="form-group">
      <label class="form-label">
        Email Penerima Notifikasi Admin
        <span class="email-count">({settings.adminEmails.length} email)</span>
      </label>

      <!-- Daftar Email yang Sudah Ada -->
      <div class="email-list">
        {#each settings.adminEmails as email, index}
          <div class="email-item">
            <span class="email-address">{email}</span>
            <button
              type="button"
              class="remove-email-btn"
              on:click={() => removeEmail(index)}
              title="Hapus email ini"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        {/each}

        {#if settings.adminEmails.length === 0}
          <div class="empty-email-list">
            Belum ada email penerima notifikasi. Tambahkan email di bawah.
          </div>
        {/if}
      </div>

      <!-- Input Email Baru -->
      <div class="add-email-wrapper">
        <input
          type="email"
          class="form-input email-input"
          bind:value={newEmailInput}
          on:keypress={handleKeyPress}
          placeholder="Masukkan email baru..."
        />
        <button
          type="button"
          class="add-email-btn"
          on:click={addEmail}
          disabled={!newEmailInput.trim() ||
            !isValidEmail(newEmailInput.trim())}
        >
          <i class="fas fa-plus"></i>
          Tambah
        </button>
      </div>

      <div class="help-text">
        Semua email dalam daftar akan menerima notifikasi tentang pesanan baru
      </div>
      {#if getFieldError("adminEmails")}
        <div class="error-text">{getFieldError("adminEmails")}</div>
      {/if}
    </div>

    <!-- Header Email -->
    <div class="form-group">
      <label for="emailHeader" class="form-label">Header Email</label>
      <textarea
        id="emailHeader"
        class="form-textarea {getFieldError('emailHeader') ? 'error' : ''}"
        bind:value={settings.emailHeader}
        on:input={(e) =>
          handleInput("emailHeader", (e.target as HTMLTextAreaElement)?.value)}
        placeholder="<h2>Nama Perusahaan</h2>
<p>Tagline atau motto perusahaan</p>"
        rows="4"
      ></textarea>
      <div class="help-text">
        HTML yang akan ditampilkan di bagian atas semua email notifikasi
      </div>
      {#if getFieldError("emailHeader")}
        <div class="error-text">{getFieldError("emailHeader")}</div>
      {/if}
    </div>

    <!-- Footer Email -->
    <div class="form-group">
      <label for="emailFooter" class="form-label">Footer Email</label>
      <textarea
        id="emailFooter"
        class="form-textarea {getFieldError('emailFooter') ? 'error' : ''}"
        bind:value={settings.emailFooter}
        on:input={(e) =>
          handleInput("emailFooter", (e.target as HTMLTextAreaElement)?.value)}
        placeholder="<p>Terima kasih telah menggunakan layanan kami.</p>
<p>© 2024 Nama Perusahaan. All rights reserved.</p>"
        rows="4"
      ></textarea>
      <div class="help-text">
        HTML yang akan ditampilkan di bagian bawah semua email notifikasi
      </div>
      {#if getFieldError("emailFooter")}
        <div class="error-text">{getFieldError("emailFooter")}</div>
      {/if}
    </div>
  </div>

  <!-- Preview Email -->
  <div class="email-preview-section">
    <h4>🔍 Preview Template Email</h4>
    <div class="email-preview">
      <div class="email-header-preview">
        {@html settings.emailHeader || "<h2>Header Email</h2>"}
      </div>
      <div class="email-body-preview">
        <p><strong>Pesanan Baru:</strong> #ORD-12345</p>
        <p><strong>Pelanggan:</strong> John Doe</p>
        <p><strong>Total:</strong> Rp 150.000</p>
        <p>
          <strong>Tanggal:</strong>
          {new Date().toLocaleDateString("id-ID")}
        </p>
      </div>
      <div class="email-footer-preview">
        {@html settings.emailFooter || "<p>Footer Email</p>"}
      </div>
    </div>
  </div>
</div>

<style>
  .settings-tab-content {
    position: relative;
    padding: 2rem;
    background: white;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .mockup-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 6rem;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.05);
    pointer-events: none;
    z-index: 1;
    user-select: none;
  }

  .tab-header {
    margin-bottom: 2rem;
    z-index: 2;
    position: relative;
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

  .form-grid {
    display: grid;
    gap: 1.5rem;
    z-index: 2;
    position: relative;
    margin-bottom: 2rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 500;
    color: var(--neutral-700);
    font-size: 0.875rem;
  }

  .email-count {
    color: var(--neutral-500);
    font-weight: normal;
    font-size: 0.75rem;
  }

  .form-input,
  .form-textarea {
    padding: 0.75rem;
    border: 1px solid var(--neutral-300);
    border-radius: var(--border-radius-md);
    font-size: 0.875rem;
    transition: all 0.2s ease;
    background: white;
    font-family: inherit;
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
    font-family: "Courier New", monospace;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.error,
  .form-textarea.error {
    border-color: var(--error-base);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .toggle-group {
    gap: 0.75rem;
  }

  .toggle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
  }

  .toggle-switch input[type="checkbox"] {
    display: none;
  }

  .toggle-slider {
    position: relative;
    display: block;
    width: 48px;
    height: 24px;
    background: var(--neutral-300);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-slider::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .toggle-switch input[type="checkbox"]:checked + .toggle-slider {
    background: var(--primary-500);
  }

  .toggle-switch input[type="checkbox"]:checked + .toggle-slider::before {
    transform: translateX(24px);
  }

  .email-list {
    border: 1px solid var(--neutral-300);
    border-radius: var(--border-radius-md);
    padding: 0.75rem;
    background: var(--neutral-50);
    max-height: 150px;
    overflow-y: auto;
  }

  .email-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: white;
    border-radius: var(--border-radius-sm);
    margin-bottom: 0.5rem;
    border: 1px solid var(--neutral-200);
  }

  .email-item:last-child {
    margin-bottom: 0;
  }

  .email-address {
    font-size: 0.875rem;
    color: var(--neutral-700);
  }

  .remove-email-btn {
    background: var(--error-light);
    border: 1px solid var(--error-base);
    color: var(--error-base);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-email-btn:hover {
    background: var(--error-base);
    color: white;
  }

  .empty-email-list {
    text-align: center;
    color: var(--neutral-500);
    font-style: italic;
    padding: 1rem;
  }

  .add-email-wrapper {
    display: flex;
    gap: 0.5rem;
  }

  .email-input {
    flex: 1;
  }

  .add-email-btn {
    background: var(--primary-500);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .add-email-btn:hover:not(:disabled) {
    background: var(--primary-600);
  }

  .add-email-btn:disabled {
    background: var(--neutral-300);
    color: var(--neutral-500);
    cursor: not-allowed;
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--neutral-500);
    line-height: 1.4;
  }

  .error-text {
    font-size: 0.75rem;
    color: var(--error-base);
    font-weight: 500;
  }

  .email-preview-section {
    z-index: 2;
    position: relative;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--neutral-200);
  }

  .email-preview-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin: 0 0 1rem 0;
  }

  .email-preview {
    border: 1px solid var(--neutral-300);
    border-radius: var(--border-radius-md);
    background: white;
    overflow: hidden;
  }

  .email-header-preview,
  .email-footer-preview {
    padding: 1rem;
    background: var(--neutral-50);
    border-bottom: 1px solid var(--neutral-200);
  }

  .email-footer-preview {
    border-top: 1px solid var(--neutral-200);
    border-bottom: none;
  }

  .email-body-preview {
    padding: 1.5rem;
    background: white;
  }

  .email-body-preview p {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
  }

  .email-body-preview p:last-child {
    margin-bottom: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .settings-tab-content {
      padding: 1.5rem;
    }

    .mockup-watermark {
      font-size: 4rem;
    }

    .form-grid {
      gap: 1rem;
    }

    .toggle-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .add-email-wrapper {
      flex-direction: column;
    }

    .email-preview-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
    }
  }
</style>
