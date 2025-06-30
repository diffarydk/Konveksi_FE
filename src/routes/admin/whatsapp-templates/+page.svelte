<!-- src/routes/admin/whatsapp-templates/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";

  // Mock data untuk demonstrasi
  interface WhatsAppTemplate {
    id: string;
    name: string;
    description: string;
    message: string;
    isActive: boolean;
    category: "payment" | "order" | "general";
    variables: string[];
    lastUsed?: string;
    usageCount: number;
  }

  let templates: WhatsAppTemplate[] = [
    {
      id: "1",
      name: "Pengingat Pembayaran DP",
      description: "Template untuk mengingatkan customer tentang pembayaran DP",
      message:
        "Halo {{customer_name}}, pesanan Anda dengan kode {{order_code}} sudah siap untuk diproses. Silakan lakukan pembayaran DP sebesar {{dp_amount}} melalui link berikut: {{payment_link}}. Terima kasih!",
      isActive: true,
      category: "payment",
      variables: ["customer_name", "order_code", "dp_amount", "payment_link"],
      lastUsed: "2025-01-20T10:30:00Z",
      usageCount: 45,
    },
    {
      id: "2",
      name: "Konfirmasi Order Baru",
      description: "Template konfirmasi ketika order baru diterima",
      message:
        "Terima kasih {{customer_name}}! Order Anda {{order_code}} telah kami terima. Detail pesanan: {{product_name}} ({{quantity}} pcs). Total: {{total_amount}}. Tim kami akan segera memproses pesanan Anda.",
      isActive: true,
      category: "order",
      variables: [
        "customer_name",
        "order_code",
        "product_name",
        "quantity",
        "total_amount",
      ],
      lastUsed: "2025-01-20T14:15:00Z",
      usageCount: 89,
    },
    {
      id: "3",
      name: "Pesanan Siap Diambil",
      description: "Notifikasi ketika pesanan sudah selesai dan siap diambil",
      message:
        "Kabar gembira! Pesanan Anda {{order_code}} sudah selesai diproduksi dan siap untuk diambil/dikirim. Mohon konfirmasi untuk pengaturan pengambilan. Terima kasih atas kepercayaan Anda!",
      isActive: true,
      category: "order",
      variables: ["order_code"],
      lastUsed: "2025-01-19T16:45:00Z",
      usageCount: 67,
    },
    {
      id: "4",
      name: "Pelunasan Invoice",
      description: "Template untuk mengingatkan pelunasan pembayaran",
      message:
        "Halo {{customer_name}}, pesanan {{order_code}} sudah memasuki tahap finishing. Silakan lakukan pelunasan sebesar {{remaining_amount}} untuk proses pengiriman. Link pembayaran: {{payment_link}}",
      isActive: false,
      category: "payment",
      variables: [
        "customer_name",
        "order_code",
        "remaining_amount",
        "payment_link",
      ],
      usageCount: 23,
    },
    {
      id: "5",
      name: "Promo Spesial",
      description: "Template untuk mengirimkan informasi promo kepada customer",
      message:
        "🎉 Promo Spesial untuk {{customer_name}}! Dapatkan diskon 20% untuk order kedua Anda. Gunakan kode: LOYAL20. Berlaku hingga {{promo_end_date}}. Hubungi kami sekarang!",
      isActive: true,
      category: "general",
      variables: ["customer_name", "promo_end_date"],
      lastUsed: "2025-01-18T09:20:00Z",
      usageCount: 156,
    },
  ];

  let isLoading = false;
  let searchTerm = "";
  let categoryFilter = "";
  let statusFilter = "";

  // Filter options
  const categoryOptions = [
    { value: "", label: "Semua Kategori" },
    { value: "payment", label: "Pembayaran" },
    { value: "order", label: "Pesanan" },
    { value: "general", label: "Umum" },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Tidak Aktif" },
  ];

  // Search timeout for debouncing
  let searchTimeout: number | null = null;
  let debouncedSearchTerm = "";

  // Debounced search
  $: {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      debouncedSearchTerm = searchTerm;
    }, 300);
  }

  // Filtered templates
  $: filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      debouncedSearchTerm === "" ||
      template.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      template.description
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || template.category === categoryFilter;

    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "active" && template.isActive) ||
      (statusFilter === "inactive" && !template.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Helper functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getCategoryText(category: string): string {
    const categoryMap: Record<string, string> = {
      payment: "Pembayaran",
      order: "Pesanan",
      general: "Umum",
    };
    return categoryMap[category] || category;
  }

  function getCategoryClass(category: string): string {
    const categoryMap: Record<string, string> = {
      payment: "warning",
      order: "info",
      general: "success",
    };
    return categoryMap[category] || "secondary";
  }

  // Action handlers
  function handleToggleActive(template: WhatsAppTemplate) {
    template.isActive = !template.isActive;
    console.log(
      `Template ${template.name} is now ${template.isActive ? "active" : "inactive"}`
    );
  }

  function handleEditTemplate(template: WhatsAppTemplate) {
    console.log("Editing template:", template.name);
  }

  function handleDeleteTemplate(template: WhatsAppTemplate) {
    console.log("Deleting template:", template.name);
    templates = templates.filter((t) => t.id !== template.id);
  }

  function handleCreateNew() {
    console.log("Creating new template");
  }

  function highlightVariables(message: string): string {
    return message.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="variable">{{$1}}</span>'
    );
  }

  onMount(() => {
    // Load templates data here in real implementation
  });
</script>

<div class="templates-container">
  <!-- Header -->
  <div class="templates-header">
    <div class="header-content">
      <div class="header-text">
        <h1>Template Notifikasi WhatsApp (MOCKUP)</h1>
        <p>Kelola template pesan otomatis untuk komunikasi dengan pelanggan</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" on:click={handleCreateNew}>
          <i class="fas fa-plus"></i>
          Buat Template Baru
        </button>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari template..."
          class="search-input"
        />
      </div>

      <select bind:value={categoryFilter} class="category-filter">
        {#each categoryOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>

      <select bind:value={statusFilter} class="status-filter">
        {#each statusOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <span>Memuat template...</span>
      </div>
    </div>
  {/if}

  <!-- Templates Content -->
  <div class="templates-content" class:loading={isLoading}>
    {#if filteredTemplates.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fab fa-whatsapp"></i>
        </div>
        <h3>Tidak ada template</h3>
        <p>
          {#if searchTerm || categoryFilter || statusFilter}
            Tidak ada template yang sesuai dengan filter yang dipilih.
          {:else}
            Belum ada template WhatsApp yang dibuat. Buat template pertama Anda!
          {/if}
        </p>
      </div>
    {:else}
      <div class="templates-grid">
        {#each filteredTemplates as template (template.id)}
          <div class="template-card" transition:fade={{ duration: 300 }}>
            <!-- Card Header -->
            <div class="card-header">
              <div class="template-info">
                <h3 class="template-name">{template.name}</h3>
                <p class="template-description">{template.description}</p>
                <div class="template-meta">
                  <span
                    class="category-badge {getCategoryClass(template.category)}"
                  >
                    {getCategoryText(template.category)}
                  </span>
                  <span class="usage-count">
                    <i class="fas fa-paper-plane"></i>
                    {template.usageCount} kali digunakan
                  </span>
                </div>
              </div>
              <div class="toggle-section">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    bind:checked={template.isActive}
                    on:change={() => handleToggleActive(template)}
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span
                  class="toggle-label {template.isActive
                    ? 'active'
                    : 'inactive'}"
                >
                  {template.isActive ? "Aktif" : "Tidak Aktif"}
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <div class="message-preview">
                <label class="preview-label">Preview Pesan:</label>
                <div class="message-content">
                  {@html highlightVariables(template.message)}
                </div>
              </div>

              {#if template.variables.length > 0}
                <div class="variables-section">
                  <label class="variables-label">Variabel tersedia:</label>
                  <div class="variables-list">
                    {#each template.variables as variable}
                      <span class="variable-tag">{{ variable }}</span>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if template.lastUsed}
                <div class="last-used">
                  <i class="fas fa-clock"></i>
                  Terakhir digunakan: {formatDate(template.lastUsed)}
                </div>
              {/if}
            </div>

            <!-- Card Footer -->
            <div class="card-footer">
              <button
                class="btn-action btn-edit"
                on:click={() => handleEditTemplate(template)}
                title="Edit Template"
              >
                <i class="fas fa-edit"></i>
                Edit
              </button>
              <button
                class="btn-action btn-delete"
                on:click={() => handleDeleteTemplate(template)}
                title="Hapus Template"
              >
                <i class="fas fa-trash"></i>
                Hapus
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .templates-container {
    min-height: 100vh;
    background: #f9fafb;
  }

  .templates-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-text h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .header-text p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
  }

  .header-actions .btn {
    padding: 0.75rem 1rem;
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

  .btn-primary {
    background: #10b981;
    color: white;
  }

  .btn-primary:hover {
    background: #059669;
  }

  .search-section {
    display: flex;
    gap: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .search-box {
    position: relative;
    flex: 1;
  }

  .search-box i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 0.875rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .category-filter,
  .status-filter {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    min-width: 140px;
    cursor: pointer;
  }

  .category-filter:focus,
  .status-filter:focus {
    outline: none;
    border-color: #10b981;
  }

  .templates-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    min-height: 400px;
    position: relative;
  }

  .templates-content.loading {
    opacity: 0.7;
    pointer-events: none;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(2px);
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: #6b7280;
  }

  .empty-icon {
    margin-bottom: 1rem;
  }

  .empty-icon i {
    font-size: 2.5rem;
    color: #10b981;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    margin: 0;
    max-width: 400px;
    margin: 0 auto;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .template-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
    transition: all 0.2s;
  }

  .template-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .template-info {
    flex: 1;
  }

  .template-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .template-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .template-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .category-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .category-badge.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .category-badge.info {
    background: #dbeafe;
    color: #1e40af;
  }

  .category-badge.success {
    background: #d1fae5;
    color: #065f46;
  }

  .usage-count {
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .toggle-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #d1d5db;
    transition: 0.3s;
    border-radius: 24px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: #10b981;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }

  .toggle-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .toggle-label.active {
    color: #059669;
  }

  .toggle-label.inactive {
    color: #6b7280;
  }

  .card-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preview-label,
  .variables-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
  }

  .message-content {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
  }

  .message-content :global(.variable) {
    background: #10b981;
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
  }

  .variables-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .variable-tag {
    background: #f3f4f6;
    color: #374151;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: "Courier New", monospace;
    border: 1px solid #d1d5db;
  }

  .last-used {
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .card-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #f3f4f6;
    background: #fafafa;
    display: flex;
    gap: 0.75rem;
  }

  .btn-action {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
  }

  .btn-edit {
    color: #3b82f6;
    border-color: #3b82f6;
  }

  .btn-edit:hover {
    background: #3b82f6;
    color: white;
  }

  .btn-delete {
    color: #ef4444;
    border-color: #ef4444;
  }

  .btn-delete:hover {
    background: #ef4444;
    color: white;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .search-section {
      flex-direction: column;
    }

    .templates-content {
      padding: 1rem;
    }

    .templates-grid {
      grid-template-columns: 1fr;
    }

    .card-header {
      flex-direction: column;
      align-items: stretch;
    }

    .toggle-section {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .template-meta {
      gap: 0.5rem;
    }

    .card-footer {
      flex-direction: column;
    }
  }
</style>
