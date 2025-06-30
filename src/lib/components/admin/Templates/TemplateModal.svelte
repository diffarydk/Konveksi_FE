<!-- src/lib/components/admin/Templates/TemplateModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Template } from "$lib/services/templates";

  export let template: Template | null = null;
  export let isEditMode = false;

  const dispatch = createEventDispatcher<{
    saved: Template;
    error: string;
  }>();

  let isOpen = false;
  let modalData = {
    name: "",
    type: "dp_invoice",
    channel: "whatsapp",
    subject: "",
    body: "",
    is_active: true
  };

  // Reactive statements
  $: if (template && isEditMode) {
    modalData = {
      name: template.name || "",
      type: template.type || "dp_invoice",
      channel: template.channel || "whatsapp", 
      subject: template.subject || "",
      body: template.body || "",
      is_active: template.is_active !== false
    };
  }

  function openModal() {
    isOpen = true;
  }

  function closeModal() {
    isOpen = false;
  }

  function handleSubmit() {
    // Stub implementation
    console.log('Template Modal: Save functionality not implemented yet');
    
    // Dispatch fake saved event
    dispatch('saved', {
      id: template?.id || 'new-id',
      name: modalData.name,
      type: modalData.type as any,
      channel: modalData.channel as any,
      subject: modalData.subject,
      body: modalData.body,
      is_active: modalData.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    closeModal();
  }

  // Export functions for parent to control
  export { openModal, closeModal };
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{isEditMode ? 'Edit Template' : 'Buat Template Baru'}</h3>
        <button class="close-btn" on:click={closeModal}>
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="name">Nama Template:</label>
          <input
            id="name"
            type="text"
            bind:value={modalData.name}
            placeholder="Masukkan nama template"
            required
          />
        </div>

        <div class="form-group">
          <label for="type">Tipe Template:</label>
          <select id="type" bind:value={modalData.type}>
            <option value="dp_invoice">DP Invoice</option>
            <option value="pelunasan_invoice">Pelunasan Invoice</option>
            <option value="payment_confirmation">Payment Confirmation</option>
          </select>
        </div>

        <div class="form-group">
          <label for="channel">Channel:</label>
          <select id="channel" bind:value={modalData.channel}>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div class="form-group">
          <label for="body">Body Template:</label>
          <textarea
            id="body"
            bind:value={modalData.body}
            rows="6"
            placeholder="Masukkan template message..."
            required
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={closeModal}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary">
            {isEditMode ? 'Update' : 'Simpan'}
          </button>
        </div>
      </form>
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
    border-radius: 8px;
    padding: 0;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6b7280;
  }

  form {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .form-group textarea {
    resize: vertical;
    font-family: inherit;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }
</style> 