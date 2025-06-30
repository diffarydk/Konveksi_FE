<!-- src/lib/components/admin/Orders/OrderList.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { slide, fade } from "svelte/transition";
  // import { ordersService } from "$lib/services/orders";
  import type { Order } from "$lib/types/order";

  // Helper functions to replace ordersService
  function getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      menunggu_link: "warning",
      link_dibuat: "info",
      dp_dibayar: "success",
      menunggu_pelunasan: "warning",
      lunas: "success",
      dibatalkan: "danger",
    };
    return statusMap[status] || "secondary";
  }

  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      menunggu_link: "Menunggu Link",
      link_dibuat: "Link Dibuat",
      dp_dibayar: "DP Dibayar",
      menunggu_pelunasan: "Menunggu Pelunasan",
      lunas: "Lunas",
      dibatalkan: "Dibatalkan",
    };
    return statusMap[status] || status;
  }

  export let orders: Order[] = [];
  export let isLoading = false;
  export let currentPage = 1;
  export let totalPages = 1;
  export let totalCount = 0;

  const dispatch = createEventDispatcher<{
    edit: Order;
    delete: string;
    createPaymentLink: string;
    viewDetails: Order;
    pageChange: number;
  }>();

  // Filter and search with performance optimization
  let searchTerm = "";
  let statusFilter = "";
  let sortField = "created_at";
  let sortDirection = "desc";

  // Performance: Debounced search
  let searchTimeout: number | null = null;
  let debouncedSearchTerm = "";

  // Performance: Memoized filtered orders
  let lastOrders: Order[] = [];
  let lastSearchTerm = "";
  let lastStatusFilter = "";
  let memoizedFilteredOrders: Order[] = [];

  // Performance: Debounced search implementation
  $: {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      debouncedSearchTerm = searchTerm;
    }, 300); // 300ms debounce
  }

  // Performance: Optimized filtering with memoization
  $: {
    const shouldRecalculate =
      orders !== lastOrders ||
      debouncedSearchTerm !== lastSearchTerm ||
      statusFilter !== lastStatusFilter;

    if (shouldRecalculate) {
      console.log("🔄 Recalculating filtered orders...");

      memoizedFilteredOrders = orders.filter((order) => {
        const matchesSearch =
          debouncedSearchTerm === "" ||
          order.customer_name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          order.product_name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          order.order_code
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "" || order.status_order === statusFilter;

        return matchesSearch && matchesStatus;
      });

      // Update memoization cache
      lastOrders = orders;
      lastSearchTerm = debouncedSearchTerm;
      lastStatusFilter = statusFilter;

      console.log(
        `✅ Filtered: ${memoizedFilteredOrders.length} / ${orders.length} orders`
      );
    }
  }

  // Performance: Optimized sorting with memoization
  let lastSortField = "";
  let lastSortDirection = "";
  let memoizedSortedOrders: Order[] = [];

  $: {
    const shouldRecalculateSort =
      memoizedFilteredOrders !== memoizedSortedOrders ||
      sortField !== lastSortField ||
      sortDirection !== lastSortDirection;

    if (shouldRecalculateSort) {
      console.log(`📊 Sorting by ${sortField} (${sortDirection})...`);

      memoizedSortedOrders = [...memoizedFilteredOrders].sort((a, b) => {
        let aValue: any = a[sortField as keyof Order];
        let bValue: any = b[sortField as keyof Order];

        // Handle undefined values
        if (aValue === undefined || aValue === null) aValue = "";
        if (bValue === undefined || bValue === null) bValue = "";

        // Handle date sorting
        if (sortField === "created_at" || sortField === "updated_at") {
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

      // Update sort memoization cache
      lastSortField = sortField;
      lastSortDirection = sortDirection;

      console.log(`✅ Sorted: ${memoizedSortedOrders.length} orders`);
    }
  }

  // Final computed property for template
  $: sortedOrders = memoizedSortedOrders;

  // Available status options
  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "menunggu_link", label: "Menunggu Link" },
    { value: "link_dibuat", label: "Link Dibuat" },
    { value: "dp_dibayar", label: "DP Dibayar" },
    { value: "menunggu_pelunasan", label: "Menunggu Pelunasan" },
    { value: "lunas", label: "Lunas" },
    { value: "dibatalkan", label: "Dibatalkan" },
  ];

  // Sort icon helper
  function getSortIcon(field: string): string {
    if (sortField !== field) return "fas fa-sort";
    return sortDirection === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
  }

  // Handle sort
  function handleSort(field: string) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Get progress percentage
  function getProgressPercentage(order: Order): number {
    const paid = parseFloat(order.paid_amount);
    const total = parseFloat(order.total_price);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  // Get production status display
  function getProductionStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      menunggu: "Menunggu",
      diproses: "Diproses",
      selesai: "Selesai",
    };
    return statusMap[status] || status;
  }

  // Get production status badge class
  function getProductionStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      menunggu: "warning",
      diproses: "info",
      selesai: "success",
    };
    return statusMap[status] || "secondary";
  }

  // Handle actions
  function handleEdit(order: Order) {
    dispatch("edit", order);
  }

  function handleDelete(order: Order) {
    dispatch("delete", order.id);
  }

  function handleCreatePaymentLink(orderId: string) {
    dispatch("createPaymentLink", orderId);
  }

  function handleViewDetails(order: Order) {
    dispatch("viewDetails", order);
  }

  function handlePageChange(page: number) {
    dispatch("pageChange", page);
  }

  // Performance: Cleanup on destroy
  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    console.log("🧹 OrderList cleanup completed");
  });
</script>

<div class="order-list-container">
  <!-- Header with filters and search -->
  <div class="list-header">
    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari pesanan, pelanggan, atau kode..."
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

  <!-- Add loading overlay for better UX -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <span>Memuat pesanan...</span>
        <small>Mengoptimalkan performa...</small>
      </div>
    </div>
  {/if}

  <!-- Orders Content -->
  <div class="orders-content" class:loading={isLoading}>
    {#if isLoading && orders.length === 0}
      <!-- Show skeleton loader for first load -->
      <div class="skeleton-loader">
        {#each Array(5) as _, i}
          <div class="skeleton-row" style="animation-delay: {i * 100}ms">
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
          </div>
        {/each}
      </div>
    {:else if sortedOrders.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-shopping-bag"></i>
        </div>
        <h3>Tidak ada pesanan</h3>
        <p>
          {#if searchTerm || statusFilter}
            Tidak ada pesanan yang sesuai dengan filter yang dipilih.
          {:else}
            Belum ada pesanan yang dibuat. Buat pesanan pertama Anda!
          {/if}
        </p>
      </div>
    {:else}
      <div class="orders-table-container" transition:fade>
        <table class="orders-table">
          <thead>
            <tr>
              <th class="sortable" on:click={() => handleSort("order_code")}>
                <span>Kode Pesanan</span>
                <i class={getSortIcon("order_code")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("customer_name")}>
                <span>Pelanggan</span>
                <i class={getSortIcon("customer_name")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("product_name")}>
                <span>Produk</span>
                <i class={getSortIcon("product_name")}></i>
              </th>
              <th class="sortable" on:click={() => handleSort("total_price")}>
                <span>Total</span>
                <i class={getSortIcon("total_price")}></i>
              </th>
              <th>Progress Pembayaran</th>
              <th>Status Pembayaran</th>
              <th>Status Produksi</th>
              <th class="sortable" on:click={() => handleSort("created_at")}>
                <span>Tanggal</span>
                <i class={getSortIcon("created_at")}></i>
              </th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedOrders as order (order.id)}
              <tr transition:fade={{ duration: 300 }}>
                <td>
                  <div class="order-code">
                    <span class="code">{order.order_code}</span>
                    <span class="payment-type"
                      >{order.payment_type?.toUpperCase() || "N/A"}</span
                    >
                  </div>
                </td>
                <td>
                  <div class="customer-info">
                    <span class="name">{order.customer_name}</span>
                    <span class="contact">{order.contact_information}</span>
                  </div>
                </td>
                <td>
                  <div class="product-info">
                    <span class="name">{order.product_name}</span>
                    <span class="quantity">{order.quantity} pcs</span>
                  </div>
                </td>
                <td>
                  <div class="price-info">
                    <span class="total"
                      >Rp {parseInt(order.total_price).toLocaleString(
                        "id-ID"
                      )}</span
                    >
                    <span class="paid"
                      >Rp {parseInt(order.paid_amount || "0").toLocaleString(
                        "id-ID"
                      )} dibayar</span
                    >
                  </div>
                </td>
                <td>
                  <div class="progress-info">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        style="width: {getProgressPercentage(order)}%"
                      ></div>
                    </div>
                    <span class="progress-text"
                      >{getProgressPercentage(order)}%</span
                    >
                  </div>
                </td>
                <td>
                  <span
                    class="status-badge {getStatusClass(order.status_order)}"
                  >
                    {getStatusText(order.status_order)}
                  </span>
                </td>
                <td>
                  <span
                    class="status-badge {getProductionStatusBadgeClass(
                      order.production_status || 'menunggu'
                    )}"
                  >
                    {getProductionStatusText(
                      order.production_status || "menunggu"
                    )}
                  </span>
                </td>
                <td>
                  <span class="date">{formatDate(order.created_at)}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="action-btn primary"
                      on:click={() => handleViewDetails(order)}
                      title="Lihat Detail"
                    >
                      <i class="fas fa-eye"></i>
                    </button>

                    {#if order.status_order === "menunggu_link"}
                      <button
                        class="action-btn success"
                        on:click={() => handleCreatePaymentLink(order.id)}
                        title="Buat Link Pembayaran"
                      >
                        <i class="fas fa-link"></i>
                      </button>
                    {/if}

                    <button
                      class="action-btn secondary"
                      on:click={() => handleEdit(order)}
                      title="Edit"
                    >
                      <i class="fas fa-edit"></i>
                    </button>

                    <button
                      class="action-btn danger"
                      on:click={() => handleDelete(order)}
                      title="Hapus"
                    >
                      <i class="fas fa-trash"></i>
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

  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="pagination">
      <div class="pagination-info">
        Menampilkan {sortedOrders.length} dari {totalCount} pesanan
      </div>

      <div class="pagination-controls">
        <button
          class="pagination-btn"
          disabled={currentPage === 1}
          on:click={() => handlePageChange(currentPage - 1)}
        >
          <i class="fas fa-chevron-left"></i>
          Sebelumnya
        </button>

        {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const start = Math.max(1, currentPage - 2);
          return start + i;
        }) as page}
          {#if page <= totalPages}
            <button
              class="pagination-btn {page === currentPage ? 'active' : ''}"
              on:click={() => handlePageChange(page)}
            >
              {page}
            </button>
          {/if}
        {/each}

        <button
          class="pagination-btn"
          disabled={currentPage === totalPages}
          on:click={() => handlePageChange(currentPage + 1)}
        >
          Selanjutnya
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
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

  .btn {
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

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .orders-content {
    min-height: 400px;
    position: relative;
  }

  .orders-content.loading {
    opacity: 0.7;
    pointer-events: none;
  }

  /* Loading Overlay */
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

  .loading-content small {
    color: #6b7280;
    font-size: 0.875rem;
  }

  /* Skeleton Loader */
  .skeleton-loader {
    padding: 1.5rem;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
    opacity: 0;
    animation: fadeInSkeleton 0.5s ease forwards;
  }

  @keyframes fadeInSkeleton {
    to {
      opacity: 1;
    }
  }

  .skeleton-cell {
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .loading-state,
  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: #6b7280;
  }

  .loading-spinner,
  .empty-icon {
    margin-bottom: 1rem;
  }

  .loading-spinner i,
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

  .order-code {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .order-code .code {
    font-weight: 600;
    color: #111827;
    font-family: "Courier New", monospace;
  }

  .order-code .payment-type {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    width: fit-content;
  }

  .customer-info,
  .product-info,
  .price-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .customer-info .name,
  .product-info .name {
    font-weight: 500;
    color: #111827;
  }

  .customer-info .contact,
  .product-info .quantity {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .price-info .total {
    font-weight: 600;
    color: #111827;
  }

  .price-info .paid {
    font-size: 0.875rem;
    color: #10b981;
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
    background: #dbeafe;
    color: #1d4ed8;
  }

  .status-badge.success {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.danger {
    background: #fee2e2;
    color: #991b1b;
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

  .action-btn.danger {
    background: #fee2e2;
    color: #dc2626;
  }

  .action-btn.danger:hover {
    background: #fecaca;
  }

  .pagination {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
  }

  .pagination-info {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .pagination-controls {
    display: flex;
    gap: 0.5rem;
  }

  .pagination-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background: white;
    color: #111827;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pagination-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #f3f4f6;
  }

  .pagination-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    .list-header {
      flex-direction: column;
      align-items: stretch;
    }

    .search-section {
      flex-direction: column;
      max-width: none;
    }

    .pagination {
      flex-direction: column;
      gap: 1rem;
    }

    .orders-table {
      font-size: 0.875rem;
    }

    .orders-table th,
    .orders-table td {
      padding: 0.75rem;
    }

    .action-buttons {
      flex-wrap: wrap;
    }
  }
</style>
