<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  // Mock data untuk demonstrasi
  interface Invoice {
    id: string;
    invoice_id: string;
    order_code: string;
    customer_name: string;
    amount: string;
    due_date: string;
    status: "paid" | "pending" | "overdue";
    created_at: string;
  }

  let invoices: Invoice[] = [
    {
      id: "1",
      invoice_id: "INV-2025-01-123",
      order_code: "ORD-2024-001",
      customer_name: "Ahmad Rizki",
      amount: "750000",
      due_date: "2025-01-25T23:59:59Z",
      status: "pending",
      created_at: "2025-01-15T10:00:00Z",
    },
    {
      id: "2",
      invoice_id: "INV-2025-01-124",
      order_code: "ORD-2024-002",
      customer_name: "PT. Example Company",
      amount: "1500000",
      due_date: "2025-01-20T23:59:59Z",
      status: "paid",
      created_at: "2025-01-14T14:30:00Z",
    },
    {
      id: "3",
      invoice_id: "INV-2025-01-125",
      order_code: "ORD-2024-003",
      customer_name: "Sari Dewi Boutique",
      amount: "2250000",
      due_date: "2025-01-18T23:59:59Z",
      status: "overdue",
      created_at: "2025-01-13T09:15:00Z",
    },
  ];

  let isLoading = false;
  let searchTerm = "";
  let statusFilter = "";
  let sortField = "created_at";
  let sortDirection = "desc";

  // Filter options
  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "overdue", label: "Overdue" },
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

  // Filtered and sorted invoices
  $: filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      debouncedSearchTerm === "" ||
      invoice.customer_name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      invoice.invoice_id
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  $: sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aValue: any = a[sortField as keyof Invoice];
    let bValue: any = b[sortField as keyof Invoice];

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

  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
    };
    return statusMap[status] || status;
  }

  function getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      paid: "success",
      pending: "warning",
      overdue: "danger",
    };
    return statusMap[status] || "secondary";
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
  function handleViewDetail(invoice: Invoice) {
    console.log("Viewing details for invoice:", invoice.invoice_id);
  }

  function handleResend(invoice: Invoice) {
    console.log("Resending invoice:", invoice.invoice_id);
  }

  function handleDownload(invoice: Invoice) {
    console.log("Downloading PDF for invoice:", invoice.invoice_id);
  }

  function handleCreateNew() {
    console.log("Creating new invoice");
  }

  onMount(() => {
    // Load data here in real implementation
  });
</script>

<div class="invoice-list-container">
  <!-- Header -->
  <div class="list-header">
    <div class="header-content">
      <div class="header-text">
        <h1>Manajemen Invoice (MOCKUP)</h1>
        <p>Kelola dan pantau semua invoice pelanggan dalam satu tempat</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" on:click={handleCreateNew}>
          <i class="fas fa-plus"></i>
          Buat Invoice Baru
        </button>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari berdasarkan ID atau nama customer..."
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
        <span>Memuat invoice...</span>
      </div>
    </div>
  {/if}

  <!-- Invoice Content -->
  <div class="invoices-content" class:loading={isLoading}>
    {#if sortedInvoices.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-file-invoice"></i>
        </div>
        <h3>Tidak ada invoice</h3>
        <p>
          {#if searchTerm || statusFilter}
            Tidak ada invoice yang sesuai dengan filter yang dipilih.
          {:else}
            Belum ada invoice yang dibuat. Buat invoice pertama Anda!
          {/if}
        </p>
      </div>
    {:else}
      <div class="invoices-table-container" transition:fade>
        <table class="invoices-table">
          <thead>
            <tr>
              <th class="sortable" on:click={() => handleSort("invoice_id")}>
                <span>Invoice ID</span>
                <i class={getSortIcon("invoice_id")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("order_code")}>
                <span>Kode Order</span>
                <i class={getSortIcon("order_code")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("customer_name")}>
                <span>Nama Customer</span>
                <i class={getSortIcon("customer_name")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("amount")}>
                <span>Jumlah Tagihan</span>
                <i class={getSortIcon("amount")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("due_date")}>
                <span>Tanggal Jatuh Tempo</span>
                <i class={getSortIcon("due_date")}></i>
              </th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedInvoices as invoice (invoice.id)}
              <tr transition:fade={{ duration: 300 }}>
                <td>
                  <div class="invoice-id">
                    <span class="id">{invoice.invoice_id}</span>
                  </div>
                </td>
                <td>
                  <div class="order-code">
                    <span class="code">{invoice.order_code}</span>
                  </div>
                </td>
                <td>
                  <div class="customer-info">
                    <span class="name">{invoice.customer_name}</span>
                  </div>
                </td>
                <td>
                  <div class="amount-info">
                    <span class="amount"
                      >Rp {parseInt(invoice.amount).toLocaleString(
                        "id-ID"
                      )}</span
                    >
                  </div>
                </td>
                <td>
                  <span class="date">{formatDate(invoice.due_date)}</span>
                </td>
                <td>
                  <span class="status-badge {getStatusClass(invoice.status)}">
                    {getStatusText(invoice.status)}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="action-btn primary"
                      on:click={() => handleViewDetail(invoice)}
                      title="Lihat Detail"
                    >
                      <i class="fas fa-eye"></i>
                    </button>

                    <button
                      class="action-btn info"
                      on:click={() => handleResend(invoice)}
                      title="Kirim Ulang"
                    >
                      <i class="fas fa-paper-plane"></i>
                    </button>

                    <button
                      class="action-btn secondary"
                      on:click={() => handleDownload(invoice)}
                      title="Download PDF"
                    >
                      <i class="fas fa-download"></i>
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
  .invoice-list-container {
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
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
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
    min-width: 140px;
    cursor: pointer;
  }

  .status-filter:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .invoices-content {
    min-height: 400px;
    position: relative;
  }

  .invoices-content.loading {
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

  .invoices-table-container {
    overflow-x: auto;
  }

  .invoices-table {
    width: 100%;
    border-collapse: collapse;
  }

  .invoices-table th {
    background: #f9fafb;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #111827;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  .invoices-table th.sortable {
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
    position: relative;
  }

  .invoices-table th.sortable:hover {
    background: #f3f4f6;
  }

  .invoices-table th.sortable span {
    display: inline-block;
    margin-right: 1.5rem;
  }

  .invoices-table th.sortable i {
    color: #6b7280;
    font-size: 0.75rem;
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
  }

  .invoices-table td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: top;
  }

  .invoices-table tr:hover {
    background: #fafafa;
  }

  .invoice-id .id,
  .order-code .code {
    font-weight: 600;
    color: #111827;
    font-family: "Courier New", monospace;
  }

  .customer-info .name {
    font-weight: 500;
    color: #111827;
  }

  .amount-info .amount {
    font-weight: 600;
    color: #111827;
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

  .status-badge.success {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.warning {
    background: #fef3c7;
    color: #92400e;
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

    .search-section {
      flex-direction: column;
      max-width: none;
    }

    .invoices-table {
      font-size: 0.875rem;
    }

    .invoices-table th,
    .invoices-table td {
      padding: 0.75rem;
    }
  }
</style>
