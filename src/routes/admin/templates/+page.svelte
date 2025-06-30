<!-- src/routes/admin/templates/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  
  // Components
  import Breadcrumb from "$lib/components/admin/common/Breadcrumb.svelte";
  import TemplateList from "$lib/components/admin/Templates/TemplateList.svelte";
  import TemplateModal from "$lib/components/admin/Templates/TemplateModal.svelte";
  import TemplatePreviewModal from "$lib/components/admin/Templates/TemplatePreviewModal.svelte";
  import { modals } from "$lib/stores/ui";
  
  // Services and types
  import { templatesService } from "$lib/services/templates";
  import type { Template, TemplateFilters } from "$lib/services/templates";
  
  // Import styles
  import "$lib/styles/components.css";
  
  // Page state
  let templates: Template[] = [];
  let isLoading = false;
  let error = "";
  let success = "";
  
  // Filtering
  let currentFilters: TemplateFilters = {};
  
  // Modal state
  let selectedTemplate: Template | null = null;
  let isEditMode = false;
  
  // Page metadata
  const pageTitle = "Template Management";
  const breadcrumbs = [
    { label: "Home", link: "/admin" },
    { label: "Templates", active: true },
  ];
  
  // Load templates on mount
  onMount(() => {
    loadTemplates();
  });
  
  // Load templates with optional filters
  async function loadTemplates(filters?: TemplateFilters) {
    isLoading = true;
    error = "";
    
    try {
      templates = await templatesService.getTemplates(filters);
      currentFilters = filters || {};
    } catch (err: any) {
      error = err.message || "Gagal memuat templates";
      templates = [];
    } finally {
      isLoading = false;
    }
  }
  
  // Handle create new template
  function handleCreate() {
    selectedTemplate = null;
    isEditMode = false;
    modals.open("templateModal");
  }
  
  // Handle edit template
  function handleEdit(event: CustomEvent<Template>) {
    selectedTemplate = event.detail;
    isEditMode = true;
    modals.open("templateModal");
  }
  
  // Handle preview template
  function handlePreview(event: CustomEvent<Template>) {
    selectedTemplate = event.detail;
    modals.open("templatePreviewModal");
  }
  
  // Handle delete template
  async function handleDelete(event: CustomEvent<Template>) {
    const template = event.detail;
    
    if (!confirm(`Apakah Anda yakin ingin menghapus template "${template.name}"?`)) {
      return;
    }
    
    try {
      await templatesService.deleteTemplate(template.id);
      showNotification(`Template "${template.name}" berhasil dihapus`, "success");
      await loadTemplates(currentFilters);
    } catch (err: any) {
      error = err.message || "Gagal menghapus template";
      showNotification(error, "error");
    }
  }
  
  // Handle template saved
  function handleTemplateSaved(event: CustomEvent<Template>) {
    const template = event.detail;
    const action = isEditMode ? "diperbarui" : "dibuat";
    showNotification(`Template "${template.name}" berhasil ${action}`, "success");
    loadTemplates(currentFilters);
    modals.close("templateModal");
  }
  
  // Handle template creation/edit error
  function handleTemplateError(event: CustomEvent<string>) {
    error = event.detail;
    showNotification(error, "error");
  }
  
  // Handle filter change
  function handleFilterChange(event: CustomEvent<TemplateFilters>) {
    loadTemplates(event.detail);
  }
  
  // Handle refresh
  function handleRefresh() {
    loadTemplates(currentFilters);
  }
  
  // Show notification
  function showNotification(message: string, type: "success" | "error") {
    if (type === "success") {
      success = message;
      error = "";
      setTimeout(() => {
        success = "";
      }, 5000);
    } else {
      error = message;
      success = "";
      setTimeout(() => {
        error = "";
      }, 5000);
    }
  }
</script>

<svelte:head>
  <title>Template Management - Hay Hill Clothing Admin</title>
</svelte:head>

<div class="templates-page">
  <!-- Page Header -->
  <div class="page-header" in:fade={{ duration: 400, delay: 200 }}>
    <div class="page-header-content">
      <div>
        <h1 class="page-title">{pageTitle}</h1>
        <Breadcrumb items={breadcrumbs} />
        <p class="page-description">
          Kelola template notifikasi untuk berbagai jenis komunikasi dengan pelanggan
        </p>
      </div>

      <div class="page-actions">
        <button
          class="btn-action secondary"
          on:click={handleRefresh}
          disabled={isLoading}
          in:fly={{ y: 20, delay: 300, duration: 400, easing: cubicOut }}
        >
          <i class="fas fa-sync-alt" class:fa-spin={isLoading}></i>
          Refresh
        </button>
        
        <button
          class="btn-action info"
          on:click={handleCreate}
          in:fly={{ y: 20, delay: 350, duration: 400, easing: cubicOut }}
        >
          <i class="fas fa-plus"></i>
          Buat Template Baru
        </button>
      </div>
    </div>
  </div>

  <!-- Success/Error Messages -->
  {#if success}
    <div class="alert alert-success" transition:fly={{ y: -20, duration: 300 }}>
      <i class="fas fa-check-circle"></i>
      <span>{success}</span>
      <button class="alert-close" on:click={() => (success = "")}>
        <i class="fas fa-times"></i>
      </button>
    </div>
  {/if}

  {#if error}
    <div class="alert alert-danger" transition:fly={{ y: -20, duration: 300 }}>
      <i class="fas fa-exclamation-circle"></i>
      <span>{error}</span>
      <button class="alert-close" on:click={() => (error = "")}>
        <i class="fas fa-times"></i>
      </button>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="page-content">
    <div transition:fade={{ duration: 300 }}>
      <TemplateList
        {templates}
        {isLoading}
        on:create={handleCreate}
        on:edit={handleEdit}
        on:preview={handlePreview}
        on:delete={handleDelete}
        on:filterChange={handleFilterChange}
        on:refresh={handleRefresh}
      />
    </div>
  </div>

  <!-- Template Modal -->
  <TemplateModal
    template={selectedTemplate}
    {isEditMode}
    on:saved={handleTemplateSaved}
    on:error={handleTemplateError}
  />

  <!-- Template Preview Modal -->
  <TemplatePreviewModal
    template={selectedTemplate}
  />
</div>

<style>
  .templates-page {
    padding: 0.5rem 0;
  }

  /* Page Header */
  .page-header {
    margin-bottom: 2rem;
  }

  .page-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin: 0 0 0.375rem 0;
  }

  .page-description {
    color: var(--neutral-600);
    font-size: 0.925rem;
    margin: 0.5rem 0 0 0;
    line-height: 1.5;
    max-width: 500px;
  }

  .page-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  /* Alert Messages */
  .alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    border-radius: var(--border-radius-lg);
    position: relative;
  }

  .alert-success {
    background: var(--success-light);
    color: var(--success-dark);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .alert-danger {
    background: var(--error-light);
    color: var(--error-dark);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .alert-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: all 0.2s ease;
  }

  .alert-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  /* Page Content */
  .page-content {
    flex: 1;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page-header-content {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .page-actions {
      justify-content: flex-end;
      flex-wrap: wrap;
    }
  }
</style> 