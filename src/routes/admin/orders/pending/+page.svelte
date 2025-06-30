<script lang="ts">
  import { onMount } from "svelte";
  import { slide, fade } from "svelte/transition";

  // Mock data untuk demonstrasi - dalam implementasi nyata akan menggunakan API
  interface PendingOrder {
    id: string;
    order_code: string;
    customer_name: string;
    contact_information: string;
    total_price: string;
    payment_type: "dp" | "lunas";
    created_at: string;
    due_date: string;
    days_overdue?: number;
  }

  let orders: PendingOrder[] = [
    {
      id: "1",
      order_code: "ORD-2024-001",
      customer_name: "Ahmad Rizki",
      contact_information: "081234567890",
      total_price: "150000",
      payment_type: "dp",
      created_at: "2024-01-15T10:00:00Z",
      due_date: "2024-01-18T23:59:59Z",
      days_overdue: 2,
    },
    {
      id: "2",
      order_code: "ORD-2024-002",
      customer_name: "Sari Dewi",
      contact_information: "082345678901",
      total_price: "300000",
      payment_type: "lunas",
      created_at: "2024-01-16T14:30:00Z",
      due_date: "2024-01-19T23:59:59Z",
      days_overdue: 1,
    },
    {
      id: "3",
      order_code: "ORD-2024-003",
      customer_name: "Budi Santoso",
      contact_information: "083456789012",
      total_price: "250000",
      payment_type: "dp",
      created_at: "2024-01-17T09:15:00Z",
      due_date: "2024-01-20T23:59:59Z",
    },
  ];

  let isLoading = false;
  let searchTerm = "";
  let paymentTypeFilter = "";
  let sortField = "due_date";
  let sortDirection = "asc";

  // Filter options
  const paymentTypeOptions = [
    { value: "", label: "Semua Jenis" },
    { value: "dp", label: "DP (Down Payment)" },
    { value: "lunas", label: "Pelunasan" },
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
        .includes(debouncedSearchTerm.toLowerCase());

    const matchesPaymentType =
      paymentTypeFilter === "" || order.payment_type === paymentTypeFilter;

    return matchesSearch && matchesPaymentType;
  });

  $: sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[sortField as keyof PendingOrder];
    let bValue: any = b[sortField as keyof PendingOrder];

    if (aValue === undefined || aValue === null) aValue = "";
    if (bValue === undefined || bValue === null) bValue = "";

    // Handle date sorting
    if (sortField === "created_at" || sortField === "due_date") {
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

  function getPaymentTypeText(type: string): string {
    return type === "dp" ? "DP (50%)" : "Pelunasan";
  }

  function getPaymentTypeClass(type: string): string {
    return type === "dp" ? "warning" : "info";
  }

  function getDueDateClass(order: PendingOrder): string {
    const now = new Date();
    const dueDate = new Date(order.due_date);
    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "danger"; // Overdue
    if (diffDays <= 1) return "warning"; // Due soon
    return "success"; // Safe
  }

  function getDueDateText(order: PendingOrder): string {
    const now = new Date();
    const dueDate = new Date(order.due_date);
    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return `Terlambat ${Math.abs(diffDays)} hari`;
    if (diffDays === 0) return "Jatuh tempo hari ini";
    if (diffDays === 1) return "Jatuh tempo besok";
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
  function handleSendReminder(order: PendingOrder) {
    console.log("Sending reminder for order:", order.order_code);
    // Implementasi kirim reminder via WhatsApp/Email
  }

  function handleConfirmPayment(order: PendingOrder) {
    console.log("Confirming payment for order:", order.order_code);
    // Implementasi konfirmasi pembayaran manual
  }

  function handleViewDetails(order: PendingOrder) {
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
        <h1>Pesanan Menunggu Pembayaran (MOCKUP)</h1>
        <p>
          Kelola pesanan yang memerlukan tindak lanjut pembayaran dari pelanggan
        </p>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-number">{sortedOrders.length}</span>
          <span class="stat-label">Total Menunggu</span>
        </div>
        <div class="stat-item urgent">
          <span class="stat-number"
            >{sortedOrders.filter((o) => getDueDateClass(o) === "danger")
              .length}</span
          >
          <span class="stat-label">Terlambat</span>
        </div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari pesanan atau pelanggan..."
          class="search-input"
        />
      </div>

      <select bind:value={paymentTypeFilter} class="status-filter">
        {#each paymentTypeOptions as option}
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
        <span>Memuat pesanan...</span>
      </div>
    </div>
  {/if}

  <!-- Orders Content -->
  <div class="orders-content" class:loading={isLoading}>
    {#if sortedOrders.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-clock"></i>
        </div>
        <h3>Tidak ada pesanan menunggu pembayaran</h3>
        <p>
          {#if searchTerm || paymentTypeFilter}
            Tidak ada pesanan yang sesuai dengan filter yang dipilih.
          {:else}
            Semua pesanan sudah dibayar atau tidak ada pesanan baru.
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
              <th class="sortable" on:click={() => handleSort("customer_name")}>
                <span>Nama Customer</span>
                <i class={getSortIcon("customer_name")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("total_price")}>
                <span>Total Tagihan</span>
                <i class={getSortIcon("total_price")}></i>
              </th>
              <th>Jenis Pembayaran</th>
              <th class="sortable" on:click={() => handleSort("created_at")}>
                <span>Tanggal Order</span>
                <i class={getSortIcon("created_at")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("due_date")}>
                <span>Batas Waktu Bayar</span>
                <i class={getSortIcon("due_date")}></i>
              </th>
              <th>Status</th>
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
                  <div class="customer-info">
                    <span class="name">{order.customer_name}</span>
                    <span class="contact">{order.contact_information}</span>
                  </div>
                </td>
                <td>
                  <div class="price-info">
                    <span class="total"
                      >Rp {parseInt(order.total_price).toLocaleString(
                        "id-ID"
                      )}</span
                    >
                  </div>
                </td>
                <td>
                  <span
                    class="status-badge {getPaymentTypeClass(
                      order.payment_type
                    )}"
                  >
                    {getPaymentTypeText(order.payment_type)}
                  </span>
                </td>
                <td>
                  <span class="date">{formatDate(order.created_at)}</span>
                </td>
                <td>
                  <div class="due-date-info">
                    <span class="date">{formatDate(order.due_date)}</span>
                    <span class="due-status {getDueDateClass(order)}"
                      >{getDueDateText(order)}</span
                    >
                  </div>
                </td>
                <td>
                  <span class="status-badge warning">Menunggu Pembayaran</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="action-btn success"
                      on:click={() => handleSendReminder(order)}
                      title="Kirim Pengingat"
                    >
                      <i class="fab fa-whatsapp"></i>
                    </button>

                    <button
                      class="action-btn primary"
                      on:click={() => handleConfirmPayment(order)}
                      title="Konfirmasi Bayar"
                    >
                      <i class="fas fa-check"></i>
                    </button>

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
  /* Menggunakan styling yang sama dengan OrderList.svelte */
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

  .stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  .stat-item.urgent .stat-number {
    color: #dc2626;
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

  .price-info .total {
    font-weight: 600;
    color: #111827;
  }

  .due-date-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .due-status {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    text-align: center;
  }

  .due-status.success {
    background: #d1fae5;
    color: #065f46;
  }

  .due-status.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .due-status.danger {
    background: #fee2e2;
    color: #991b1b;
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

  .status-badge.success {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.danger {
    background: #fee2e2;
    color: #991b1b;
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

  .action-btn.success {
    background: #d1fae5;
    color: #059669;
  }

  .action-btn.success:hover {
    background: #a7f3d0;
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
