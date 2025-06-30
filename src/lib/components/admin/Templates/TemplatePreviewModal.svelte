<!-- src/lib/components/admin/Templates/TemplatePreviewModal.svelte -->
<script lang="ts">
  import type { Template } from "$lib/services/templates";

  export let template: Template | null = null;

  let isOpen = false;
  let previewContent = {
    subject: "",
    body: ""
  };

  // Reactive statement to update preview when template changes
  $: if (template) {
    previewContent = {
      subject: template.subject || "",
      body: template.body || ""
    };
  }

  function openModal() {
    isOpen = true;
  }

  function closeModal() {
    isOpen = false;
  }

  // Export functions for parent to control
  export { openModal, closeModal };

  // Sample context for preview
  const sampleContext = {
    customer_name: "John Doe",
    order_code: "ORD-001-ABC",
    invoice_code: "INV-001",
    product_name: "Kaos Custom",
    amount_due: "150,000",
    payment_link: "https://checkout.xendit.co/sample",
    expiry_date: "31/12/2024 23:59"
  };

  // Simple template variable replacement
  function renderTemplate(text: string): string {
    if (!text) return "";
    
    let rendered = text;
    Object.entries(sampleContext).forEach(([key, value]) => {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(pattern, value);
    });
    
    return rendered;
  }
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>
          <i class="fas fa-eye"></i>
          Preview Template: {template?.name || 'Unknown'}
        </h3>
        <button class="close-btn" on:click={closeModal}>
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="template-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Nama:</span>
              <span class="value">{template?.name || '-'}</span>
            </div>
            <div class="info-item">
              <span class="label">Tipe:</span>
              <span class="value">{template?.type || '-'}</span>
            </div>
            <div class="info-item">
              <span class="label">Channel:</span>
              <span class="value channel-{template?.channel}">
                {#if template?.channel === 'whatsapp'}
                  <i class="fab fa-whatsapp"></i> WhatsApp
                {:else if template?.channel === 'email'}
                  <i class="fas fa-envelope"></i> Email
                {:else if template?.channel === 'both'}
                  <i class="fas fa-paper-plane"></i> WhatsApp & Email
                {:else}
                  {template?.channel || '-'}
                {/if}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value status-{template?.is_active}">
                {template?.is_active ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
          </div>
        </div>

        <div class="preview-section">
          <h4><i class="fas fa-mobile-alt"></i> Preview dengan Data Contoh</h4>
          
          {#if template?.channel === 'email' || template?.channel === 'both'}
            <div class="preview-card email-preview">
              <div class="preview-header">
                <i class="fas fa-envelope"></i>
                Email Preview
              </div>
              
              {#if previewContent.subject}
                <div class="email-subject">
                  <strong>Subject:</strong> {renderTemplate(previewContent.subject)}
                </div>
              {/if}
              
              <div class="email-body">
                <div class="body-content">
                  {renderTemplate(previewContent.body)}
                </div>
              </div>
            </div>
          {/if}

          {#if template?.channel === 'whatsapp' || template?.channel === 'both'}
            <div class="preview-card whatsapp-preview">
              <div class="preview-header">
                <i class="fab fa-whatsapp"></i>
                WhatsApp Preview
              </div>
              
              <div class="whatsapp-message">
                <div class="message-content">
                  {renderTemplate(previewContent.body)}
                </div>
                <div class="message-time">
                  {new Date().toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          {/if}
        </div>

        <div class="sample-data">
          <h4><i class="fas fa-database"></i> Data Contoh yang Digunakan</h4>
          <div class="sample-grid">
            {#each Object.entries(sampleContext) as [key, value]}
              <div class="sample-item">
                <code>{`{{${key}}}`}</code>
                <span>→</span>
                <span class="sample-value">{value}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={closeModal}>
          <i class="fas fa-times"></i>
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
    border-radius: 12px 12px 0 0;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .template-info {
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-item .label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .info-item .value {
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .info-item .value.channel-whatsapp {
    color: #059669;
  }

  .info-item .value.channel-email {
    color: #2563eb;
  }

  .info-item .value.channel-both {
    color: #7c3aed;
  }

  .info-item .value.status-true {
    color: #059669;
  }

  .info-item .value.status-false {
    color: #dc2626;
  }

  .preview-section h4,
  .sample-data h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .preview-card {
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  .preview-header {
    background: #f3f4f6;
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .email-preview .preview-header {
    background: #dbeafe;
    color: #1e40af;
  }

  .whatsapp-preview .preview-header {
    background: #dcfce7;
    color: #166534;
  }

  .email-subject {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }

  .email-body, .whatsapp-message {
    padding: 1rem;
  }

  .body-content, .message-content {
    white-space: pre-wrap;
    line-height: 1.6;
    color: #1f2937;
  }

  .whatsapp-message {
    background: #e7f3ff;
    position: relative;
  }

  .message-time {
    text-align: right;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }

  .sample-data {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .sample-grid {
    display: grid;
    gap: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .sample-item {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .sample-item code {
    background: #1f2937;
    color: #fbbf24;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
  }

  .sample-value {
    color: #059669;
    font-weight: 500;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  @media (max-width: 768px) {
    .modal-content {
      width: 95%;
      max-height: 95vh;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .sample-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }
</style> 