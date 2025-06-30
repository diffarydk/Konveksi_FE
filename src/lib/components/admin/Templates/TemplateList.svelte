<!-- src/lib/components/admin/Templates/TemplateList.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, fly } from "svelte/transition";
  import type { Template, TemplateFilters } from "$lib/services/templates";

  // Props
  export let templates: Template[] = [];
  export let isLoading = false;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    create: void;
    edit: Template;
    preview: Template;
    delete: Template;
    filterChange: TemplateFilters;
    refresh: void;
  }>();

  // Local state
  let searchQuery = "";

  // Computed filtered templates
  $: filteredTemplates = templates.filter((template) => {
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Handle actions
  function handleCreate() {
    dispatch("create");
  }

  function handleEdit(template: Template) {
    dispatch("edit", template);
  }

  function handlePreview(template: Template) {
    dispatch("preview", template);
  }

  function handleDelete(template: Template) {
    dispatch("delete", template);
  }

  // Get channel icon
  function getChannelIcon(channel: string): string {
    switch (channel) {
      case "whatsapp": return "fab fa-whatsapp";
      case "email": return "fas fa-envelope";
      case "both": return "fas fa-paper-plane";
      default: return "fas fa-question-circle";
    }
  }
</script>

<div class="template-list-container">
  <!-- Search -->
  <div class="search-section">
    <input
      type="text"
      placeholder="Cari template..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <!-- Templates Grid -->
  <div class="templates-section">
    {#if isLoading}
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Memuat template...</p>
      </div>
    {:else if filteredTemplates.length === 0}
      <div class="empty-state">
        <i class="fas fa-file-alt"></i>
        <h3>Tidak ada template ditemukan</h3>
        <button class="btn-primary" on:click={handleCreate}>
          <i class="fas fa-plus"></i>
          Buat Template Pertama
        </button>
      </div>
    {:else}
      <div class="templates-grid">
        {#each filteredTemplates as template, index (template.id)}
          <div class="template-card" in:fly={{ y: 20, delay: index * 50, duration: 400 }}>
            <div class="template-header">
              <h3 class="template-name">{template.name}</h3>
              <span class="status-badge" class:active={template.is_active}>
                {template.is_active ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>

            <div class="template-content">
              <div class="template-meta">
                <span class="template-type">
                  <i class="fas fa-tag"></i>
                  {template.type}
                </span>
                <span class="template-channel">
                  <i class={getChannelIcon(template.channel)}></i>
                  {template.channel}
                </span>
              </div>
              
              <div class="template-body">
                {template.body.substring(0, 100)}...
              </div>
            </div>

            <div class="template-actions">
              <button class="action-btn" on:click={() => handlePreview(template)}>
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn" on:click={() => handleEdit(template)}>
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn" on:click={() => handleDelete(template)}>
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .template-list-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .search-section {
    background: white;
    border-radius: var(--border-radius-lg);
    padding: 1rem;
    box-shadow: var(--shadow-sm);
  }

  .search-input {
    width: 100%;
    max-width: 400px;
    padding: 0.75rem;
    border: 1px solid var(--neutral-300);
    border-radius: var(--border-radius-md);
    font-size: 0.925rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px var(--primary-100);
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    background: white;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--neutral-200);
  }

  .loading-state i {
    font-size: 2rem;
    color: var(--primary-500);
    margin-bottom: 1rem;
  }

  .empty-state i {
    font-size: 3rem;
    color: var(--neutral-300);
    margin-bottom: 1rem;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .template-card {
    background: white;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--neutral-200);
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .template-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .template-header {
    padding: 1.25rem 1.25rem 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .template-name {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--neutral-900);
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-sm);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    background: var(--neutral-100);
    color: var(--neutral-600);
  }

  .status-badge.active {
    background: var(--success-100);
    color: var(--success-700);
  }

  .template-content {
    padding: 0 1.25rem 1rem;
  }

  .template-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .template-type,
  .template-channel {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--neutral-600);
  }

  .template-body {
    font-size: 0.875rem;
    color: var(--neutral-600);
    line-height: 1.5;
  }

  .template-actions {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--neutral-100);
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    background: var(--neutral-25);
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius-md);
    border: none;
    background: var(--neutral-100);
    color: var(--neutral-600);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: var(--neutral-200);
  }

  .btn-primary {
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius-md);
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    background: var(--primary-600);
    color: white;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary:hover {
    background: var(--primary-700);
  }

  @media (max-width: 768px) {
    .templates-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 