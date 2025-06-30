<script lang="ts">
  import { onMount } from "svelte";
  import { slide, fade } from "svelte/transition";

  // Mock data untuk demonstrasi - dalam implementasi nyata akan menggunakan API
  interface ProductionOrder {
    id: string;
    order_code: string;
    product_name: string;
    quantity: number;
    customer_name: string;
    contact_information: string;
    production_start_date: string;
    estimated_completion_date: string;
    production_status: "cutting" | "jahit" | "finishing" | "quality_check";
    design_notes?: string;
    progress_percentage: number;
  }

  let orders: ProductionOrder[] = [
    {
      id: "1",
      order_code: "ORD-2024-001",
      product_name: "Kaos Custom Design A",
      quantity: 50,
      customer_name: "PT. Example Company",
      contact_information: "081234567890",
      production_start_date: "2024-01-15T10:00:00Z",
      estimated_completion_date: "2024-01-22T17:00:00Z",
      production_status: "jahit",
      design_notes: "Logo di dada kiri, warna navy",
      progress_percentage: 65,
    },
    {
      id: "2",
      order_code: "ORD-2024-002",
      product_name: "Jersey Futsal Custom",
      quantity: 25,
      customer_name: "Tim Futsal Garuda",
      contact_information: "082345678901",
      production_start_date: "2024-01-16T09:00:00Z",
      estimated_completion_date: "2024-01-24T17:00:00Z",
      production_status: "cutting",
      design_notes: "Nama pemain di punggung, nomor 1-25",
      progress_percentage: 30,
    },
    {
      id: "3",
      order_code: "ORD-2024-003",
      product_name: "Polo Shirt Corporate",
      quantity: 100,
      customer_name: "Bank Mandiri Cabang Jakarta",
      contact_information: "083456789012",
      production_start_date: "2024-01-17T08:00:00Z",
      estimated_completion_date: "2024-01-25T17:00:00Z",
      production_status: "finishing",
      design_notes: "Logo bank di dada kanan, warna biru dongker",
      progress_percentage: 85,
    },
  ];

  let isLoading = false;
  let searchTerm = "";
  let statusFilter = "";
  let sortField = "estimated_completion_date";
  let sortDirection = "asc";

  // Filter options
  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "cutting", label: "Cutting" },
    { value: "jahit", label: "Jahit" },
    { value: "finishing", label: "Finishing" },
    { value: "quality_check", label: "Quality Check" },
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

  // Filtered and sorted orders
  $: filteredOrders = orders.filter((order) => {
    const matchesSearch =
      debouncedSearchTerm === "" ||
      order.customer_name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      order.order_code
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      order.product_name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "" || order.production_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  $: sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[sortField as keyof ProductionOrder];
    let bValue: any = b[sortField as keyof ProductionOrder];

    if (aValue === undefined || aValue === null) aValue = "";
    if (bValue === undefined || bValue === null) bValue = "";

    // Handle date sorting
    if (
      sortField === "production_start_date" ||
      sortField === "estimated_completion_date"
    ) {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    // Handle string sorting
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Helper functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getProductionStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      cutting: "Cutting",
      jahit: "Jahit",
      finishing: "Finishing",
      quality_check: "Quality Check",
    };
    return statusMap[status] || status;
  }

  function getProductionStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      cutting: "warning",
      jahit: "info",
      finishing: "primary",
      quality_check: "success",
    };
    return statusMap[status] || "secondary";
  }

  function getCompletionUrgency(order: ProductionOrder): string {
    const now = new Date();
    const completion = new Date(order.estimated_completion_date);
    const diffDays = Math.ceil(
      (completion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "danger"; // Overdue
    if (diffDays <= 2) return "warning"; // Due soon
    return "success"; // Safe
  }

  function getCompletionText(order: ProductionOrder): string {
    const now = new Date();
    const completion = new Date(order.estimated_completion_date);
    const diffDays = Math.ceil(
      (completion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return `Terlambat ${Math.abs(diffDays)} hari`;
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Besok";
    return `${diffDays} hari lagi`;
  }

  function getSortIcon(field: string): string {
    if (sortField !== field) return "fas fa-sort";
    return sortDirection === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
  }

  function handleSort(field: string) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  // Action handlers
  function handleUpdateProgress(order: ProductionOrder) {
    console.log("Updating progress for order:", order.order_code);
    // Implementasi update progress produksi
  }

  function handleViewDesignNotes(order: ProductionOrder) {
    console.log("Viewing design notes for order:", order.order_code);
    // Implementasi lihat catatan desain
  }

  function handleViewDetails(order: ProductionOrder) {
    console.log("Viewing details for order:", order.order_code);
    // Navigasi ke halaman detail pesanan
  }

  onMount(() => {
    // Load data here in real implementation
  });
</script>

<div class="order-list-container">
  <!-- Header -->
  <div class="list-header">
    <div class="header-content">
      <div class="header-text">
        <h1>Pesanan Dalam Produksi (MOCKUP)</h1>
        <p>
          Monitor dan kelola progress produksi semua pesanan yang sedang
          dikerjakan
        </p>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-number">{sortedOrders.length}</span>
          <span class="stat-label">Total Produksi</span>
        </div>
        <div class="stat-item urgent">
          <span class="stat-number"
            >{sortedOrders.filter((o) => getCompletionUrgency(o) === "danger")
              .length}</span
          >
          <span class="stat-label">Terlambat</span>
        </div>
        <div class="stat-item warning">
          <span class="stat-number"
            >{sortedOrders.filter((o) => getCompletionUrgency(o) === "warning")
              .length}</span
          >
          <span class="stat-label">Mendesak</span>
        </div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari pesanan, produk, atau customer..."
          class="search-input"
        />
      </div>

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
        <span>Memuat data produksi...</span>
      </div>
    </div>
  {/if}

  <!-- Orders Content -->
  <div class="orders-content" class:loading={isLoading}>
    {#if sortedOrders.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-industry"></i>
        </div>
        <h3>Tidak ada pesanan dalam produksi</h3>
        <p>
          {#if searchTerm || statusFilter}
            Tidak ada pesanan yang sesuai dengan filter yang dipilih.
          {:else}
            Belum ada pesanan yang masuk ke tahap produksi.
          {/if}
        </p>
      </div>
    {:else}
      <div class="orders-table-container" transition:fade>
        <table class="orders-table">
          <thead>
            <tr>
              <th class="sortable" on:click={() => handleSort("order_code")}>
                <span>Kode Order</span>
                <i class={getSortIcon("order_code")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("product_name")}>
                <span>Nama Produk</span>
                <i class={getSortIcon("product_name")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("quantity")}>
                <span>Kuantitas</span>
                <i class={getSortIcon("quantity")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("customer_name")}>
                <span>Customer</span>
                <i class={getSortIcon("customer_name")}></i>
              </th>
              <th
                class="sortable"
                on:click={() => handleSort("production_start_date")}
              >
                <span>Tanggal Mulai</span>
                <i class={getSortIcon("production_start_date")}></i>
              </th>
              <th
                class="sortable"
                on:click={() => handleSort("estimated_completion_date")}
              >
                <span>Estimasi Selesai</span>
                <i class={getSortIcon("estimated_completion_date")}></i>
              </th>
              <th>Status Produksi</th>
              <th>Progress</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedOrders as order (order.id)}
              <tr transition:fade={{ duration: 300 }}>
                <td>
                  <div class="order-code">
                    <span class="code">{order.order_code}</span>
                  </div>
                </td>
                <td>
                  <div class="product-info">
                    <span class="name">{order.product_name}</span>
                    {#if order.design_notes}
                      <span class="notes" title={order.design_notes}>
                        <i class="fas fa-sticky-note"></i>
                        Ada catatan desain
                      </span>
                    {/if}
                  </div>
                </td>
                <td>
                  <div class="quantity-info">
                    <span class="quantity">{order.quantity} pcs</span>
                  </div>
                </td>
                <td>
                  <div class="customer-info">
                    <span class="name">{order.customer_name}</span>
                    <span class="contact">{order.contact_information}</span>
                  </div>
                </td>
                <td>
                  <span class="date"
                    >{formatDate(order.production_start_date)}</span
                  >
                </td>
                <td>
                  <div class="completion-info">
                    <span class="date"
                      >{formatDate(order.estimated_completion_date)}</span
                    >
                    <span
                      class="completion-status {getCompletionUrgency(order)}"
                    >
                      {getCompletionText(order)}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    class="status-badge {getProductionStatusClass(
                      order.production_status
                    )}"
                  >
                    {getProductionStatusText(order.production_status)}
                  </span>
                </td>
                <td>
                  <div class="progress-info">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        style="width: {order.progress_percentage}%"
                      ></div>
                    </div>
                    <span class="progress-text"
                      >{order.progress_percentage}%</span
                    >
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="action-btn primary"
                      on:click={() => handleUpdateProgress(order)}
                      title="Update Progress"
                    >
                      <i class="fas fa-tasks"></i>
                    </button>

                    {#if order.design_notes}
                      <button
                        class="action-btn info"
                        on:click={() => handleViewDesignNotes(order)}
                        title="Lihat Catatan Desain"
                      >
                        <i class="fas fa-sticky-note"></i>
                      </button>
                    {/if}

                    <button
                      class="action-btn secondary"
                      on:click={() => handleViewDetails(order)}
                      title="Lihat Detail"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Menggunakan styling yang sama dengan OrderList.svelte dan pending page */
  .order-list-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .list-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
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

  .header-stats {
    display: flex;
    gap: 1.5rem;
  }

  .stat-item {
    text-align: center;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    min-width: 100px;
  }

  .stat-item.urgent {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .stat-item.warning {
    border-color: #fcd34d;
    background: #fffbeb;
  }

  .stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  .stat-item.urgent .stat-number {
    color: #dc2626;
  }

  .stat-item.warning .stat-number {
    color: #d97706;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .search-section {
    display: flex;
    gap: 1rem;
    flex: 1;
    max-width: 600px;
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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .status-filter {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    min-width: 180px;
    cursor: pointer;
  }

  .status-filter:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .orders-content {
    min-height: 400px;
    position: relative;
  }

  .orders-content.loading {
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
    color: #6b7280;
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

  .orders-table-container {
    overflow-x: auto;
  }

  .orders-table {
    width: 100%;
    border-collapse: collapse;
  }

  .orders-table th {
    background: #f9fafb;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #111827;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  .orders-table th.sortable {
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
    position: relative;
  }

  .orders-table th.sortable:hover {
    background: #f3f4f6;
  }

  .orders-table th.sortable span {
    display: inline-block;
    margin-right: 1.5rem;
  }

  .orders-table th.sortable i {
    color: #6b7280;
    font-size: 0.75rem;
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
  }

  .orders-table td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: top;
  }

  .orders-table tr:hover {
    background: #fafafa;
  }

  .order-code .code {
    font-weight: 600;
    color: #111827;
    font-family: "Courier New", monospace;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .product-info .name {
    font-weight: 500;
    color: #111827;
  }

  .product-info .notes {
    font-size: 0.75rem;
    color: #059669;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .quantity-info .quantity {
    font-weight: 600;
    color: #111827;
  }

  .customer-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .customer-info .name {
    font-weight: 500;
    color: #111827;
  }

  .customer-info .contact {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .completion-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .completion-status {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    text-align: center;
  }

  .completion-status.success {
    background: #d1fae5;
    color: #065f46;
  }

  .completion-status.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .completion-status.danger {
    background: #fee2e2;
    color: #991b1b;
  }

  .progress-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 100px;
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: center;
  }

  .status-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.info {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-badge.primary {
    background: #e0e7ff;
    color: #3730a3;
  }

  .status-badge.success {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .date {
    font-size: 0.875rem;
    color: #6b7280;
    white-space: nowrap;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.75rem;
  }

  .action-btn.primary {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .action-btn.primary:hover {
    background: #bfdbfe;
  }

  .action-btn.info {
    background: #e0e7ff;
    color: #3730a3;
  }

  .action-btn.info:hover {
    background: #c7d2fe;
  }

  .action-btn.secondary {
    background: #f3f4f6;
    color: #6b7280;
  }

  .action-btn.secondary:hover {
    background: #e5e7eb;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .header-stats {
      justify-content: center;
    }

    .search-section {
      flex-direction: column;
      max-width: none;
    }

    .orders-table {
      font-size: 0.875rem;
    }

    .orders-table th,
    .orders-table td {
      padding: 0.75rem;
    }
  }
</style>
