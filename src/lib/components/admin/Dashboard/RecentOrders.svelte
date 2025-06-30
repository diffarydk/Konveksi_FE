<!-- src/lib/components/admin/Dashboard/RecentOrders.svelte -->
<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import type { Order } from "$lib/types/order";

  export let orders: Order[] = [];

  // Expanded items state
  let expandedItems: Record<string, boolean> = {};

  // Toggle expand item
  function toggleExpand(id: string) {
    expandedItems[id] = !expandedItems[id];
  }

  // Table columns configuration
  const columns = [
    { key: "id", label: "Order ID", width: "100px" },
    { key: "customer", label: "Customer", width: "180px" },
    { key: "product", label: "Product", width: "auto" },
    { key: "date", label: "Date", width: "120px" },
    { key: "amount", label: "Amount", width: "120px" },
    { key: "status", label: "Status", width: "120px", type: "badge" },
    { key: "actions", label: "Actions", width: "140px", type: "actions" },
  ];

  // Define status badge classes
  function getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "shipped":
        return "info";
      case "pending":
        return "secondary";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  }

  // Format status label for display
  function formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Get status icon
  function getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case "completed":
        return "fas fa-check-circle";
      case "processing":
        return "fas fa-spinner fa-spin";
      case "pending":
        return "fas fa-clock";
      case "cancelled":
        return "fas fa-times-circle";
      default:
        return "fas fa-circle";
    }
  }

  // Handle view action
  function viewOrder(id: string) {
    console.log(`Viewing order ${id}`);
    // Navigate to order details or open modal
  }

  // Handle edit action
  function editOrder(id: string) {
    console.log(`Editing order ${id}`);
    // Navigate to edit page or open edit modal
  }

  // Handle filter search
  let searchQuery = "";

  $: filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.product_name.toLowerCase().includes(query) ||
      order.status_order.toLowerCase().includes(query)
    );
  });
</script>

<div class="orders-container card">
  <div class="card-header">
    <div>
      <h3 class="card-title">Recent Orders</h3>
      <p class="card-subtitle">{orders.length} orders in total</p>
    </div>

    <div class="header-actions">
      <div class="search-box">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          class="search-input"
          placeholder="Search orders..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button
            class="search-clear"
            on:click={() => (searchQuery = "")}
            title="Clear search"
          >
            <i class="fas fa-times"></i>
          </button>
        {/if}
      </div>

      <button class="btn btn-secondary btn-sm">
        <i class="fas fa-filter"></i>
        <span>Filter</span>
      </button>

      <button class="btn btn-primary btn-sm">
        <i class="fas fa-plus"></i>
        <span>New Order</span>
      </button>
    </div>
  </div>

  <div class="table-responsive">
    <table class="orders-table">
      <thead>
        <tr>
          {#each columns as column}
            <th style="width: {column.width};">{column.label}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if filteredOrders.length === 0}
          <tr>
            <td colspan={columns.length} class="empty-message">
              <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>No orders found</p>
                {#if searchQuery}
                  <button
                    class="btn btn-text"
                    on:click={() => (searchQuery = "")}
                  >
                    Clear search
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {:else}
          {#each filteredOrders as order, i}
            <tr
              class:expanded={expandedItems[order.id]}
              in:fade={{ duration: 200, delay: i * 50 }}
            >
              <td class="order-id-cell">
                <button
                  class="expand-toggle"
                  on:click={() => toggleExpand(order.id)}
                  title={expandedItems[order.id] ? "Collapse" : "Expand"}
                >
                  <i
                    class={`fas fa-chevron-${expandedItems[order.id] ? "down" : "right"}`}
                  ></i>
                </button>
                <span class="order-id">{order.id}</span>
              </td>
              <td>
                <div class="customer-info">
                  <div class="customer-avatar">
                    {order.customer_name ? order.customer_name.charAt(0) : "?"}
                  </div>
                  <span class="customer-name"
                    >{order.customer_name || "N/A"}</span
                  >
                </div>
              </td>
              <td class="product-cell">
                <div class="product-info">
                  <span class="product-name">{order.product_name}</span>
                </div>
              </td>
              <td>
                <div class="date-info">
                  <span class="date-value">{formatDate(order.created_at)}</span>
                </div>
              </td>
              <td>
                <div class="amount-info">
                  <span class="amount-value">{order.total_price}</span>
                </div>
              </td>
              <td>
                <div class="status-badge {getStatusClass(order.status_order)}">
                  <i class={getStatusIcon(order.status_order)}></i>
                  <span>{formatStatus(order.status_order)}</span>
                </div>
              </td>
              <td>
                <div class="table-actions">
                  <button
                    class="action-btn view-btn"
                    on:click={() => viewOrder(order.id)}
                    title="View details"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button
                    class="action-btn edit-btn"
                    on:click={() => editOrder(order.id)}
                    title="Edit order"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn more-btn" title="More actions">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                </div>
              </td>
            </tr>

            {#if expandedItems[order.id]}
              <tr
                class="expanded-row"
                transition:fly={{ y: -20, duration: 200 }}
              >
                <td colspan={columns.length}>
                  <div class="expanded-content">
                    <div class="expanded-section">
                      <h4>Order Details</h4>
                      <div class="details-grid">
                        <div class="detail-item">
                          <span class="detail-label">Order Number</span>
                          <span class="detail-value">{order.id}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Customer</span>
                          <span class="detail-value">{order.customer_name}</span
                          >
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Product</span>
                          <span class="detail-value">{order.product_name}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Date</span>
                          <span class="detail-value"
                            >{formatDate(order.created_at)}</span
                          >
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Amount</span>
                          <span class="detail-value">{order.total_price}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Status</span>
                          <div
                            class="status-badge {getStatusClass(
                              order.status_order
                            )}"
                          >
                            <i class={getStatusIcon(order.status_order)}></i>
                            <span>{formatStatus(order.status_order)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="expanded-actions">
                      <button class="btn btn-primary btn-sm">
                        <i class="fas fa-print"></i>
                        <span>Print Invoice</span>
                      </button>
                      <button class="btn btn-secondary btn-sm">
                        <i class="fas fa-envelope"></i>
                        <span>Email Customer</span>
                      </button>
                      {#if order.status_order !== "lunas" && order.status_order !== "dibatalkan"}
                        <button class="btn btn-success btn-sm">
                          <i class="fas fa-check"></i>
                          <span>Mark as Completed</span>
                        </button>
                      {/if}
                    </div>
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <div class="card-footer">
    <div class="pagination">
      <button class="pagination-btn" disabled>
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="pagination-btn active">1</button>
      <button class="pagination-btn">2</button>
      <button class="pagination-btn">3</button>
      <button class="pagination-btn">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <div class="page-size">
      <span>Show:</span>
      <select class="page-size-select">
        <option value="5">5</option>
        <option value="10" selected>10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </select>
      <span>items</span>
    </div>
  </div>
</div>

<style>
  /* Card styles */
  .card {
    background: white;
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    margin-bottom: 2rem;
  }

  .card-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--neutral-200);
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin: 0;
    margin-bottom: 0.25rem;
  }

  .card-subtitle {
    font-size: 0.875rem;
    color: var(--neutral-500);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Search box */
  .search-box {
    position: relative;
    width: 250px;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 2.25rem;
    border: 1px solid var(--neutral-300);
    border-radius: var(--border-radius-md);
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-400);
    box-shadow: 0 0 0 3px var(--primary-100);
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--neutral-400);
    font-size: 0.875rem;
  }

  .search-clear {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--neutral-400);
    cursor: pointer;
    padding: 0;
    font-size: 0.75rem;
  }

  .search-clear:hover {
    color: var(--error-base);
  }

  /* Table */
  .table-responsive {
    overflow-x: auto;
  }

  .orders-table {
    width: 100%;
    border-collapse: collapse;
  }

  .orders-table th {
    background: var(--neutral-50);
    padding: 0.875rem 1.5rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--neutral-600);
    border-bottom: 1px solid var(--neutral-200);
    white-space: nowrap;
  }

  .orders-table td {
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    color: var(--neutral-700);
    border-bottom: 1px solid var(--neutral-200);
    vertical-align: middle;
  }

  .orders-table tbody tr {
    transition: background 0.2s;
  }

  .orders-table tbody tr:hover {
    background: var(--neutral-50);
  }

  .orders-table tbody tr.expanded {
    background: var(--primary-50);
  }

  /* Order ID cell */
  .order-id-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .expand-toggle {
    background: none;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--neutral-500);
    cursor: pointer;
    transition: all 0.2s;
  }

  .expand-toggle:hover {
    background: var(--neutral-200);
    color: var(--primary-600);
  }

  .order-id {
    font-weight: 600;
    color: var(--neutral-900);
  }

  /* Customer info */
  .customer-info {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .customer-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius-md);
    background: var(--neutral-200);
    color: var(--neutral-700);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .customer-name {
    font-weight: 500;
  }

  /* Product info */
  .product-info {
    display: flex;
    flex-direction: column;
  }

  .product-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }

  /* Date info */
  .date-info {
    display: flex;
    flex-direction: column;
  }

  .date-value {
    font-weight: 500;
  }

  /* Amount info */
  .amount-info {
    display: flex;
    flex-direction: column;
  }

  .amount-value {
    font-weight: 600;
    color: var(--neutral-900);
  }

  /* Status badge */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    border-radius: var(--border-radius-md);
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .status-badge.success {
    background: var(--success-light);
    color: var(--success-dark);
  }

  .status-badge.warning {
    background: var(--warning-light);
    color: var(--warning-dark);
  }

  .status-badge.info {
    background: var(--info-light);
    color: var(--info-dark);
  }

  .status-badge.secondary {
    background: var(--neutral-100);
    color: var(--neutral-700);
  }

  .status-badge.danger {
    background: var(--error-light);
    color: var(--error-dark);
  }

  /* Table actions */
  .table-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius-md);
    border: none;
    background: var(--neutral-100);
    color: var(--neutral-600);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .action-btn:hover {
    background: var(--neutral-200);
  }

  .action-btn.view-btn:hover {
    background: var(--primary-100);
    color: var(--primary-600);
  }

  .action-btn.edit-btn:hover {
    background: var(--warning-light);
    color: var(--warning-dark);
  }

  /* Empty state */
  .empty-message {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: var(--neutral-500);
  }

  .empty-state i {
    font-size: 2rem;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
  }

  /* Expanded row */
  .expanded-row {
    background: var(--primary-50);
  }

  .expanded-content {
    padding: 1rem 2rem 1.5rem;
  }

  .expanded-section {
    margin-bottom: 1.5rem;
  }

  .expanded-section h4 {
    font-size: 1rem;
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--neutral-800);
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem 2rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .detail-label {
    font-size: 0.75rem;
    color: var(--neutral-500);
  }

  .detail-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--neutral-900);
  }

  .expanded-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    border-top: 1px solid var(--neutral-200);
    padding-top: 1.5rem;
  }

  /* Card footer */
  .card-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--neutral-200);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .pagination-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--neutral-200);
    background: white;
    color: var(--neutral-700);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .pagination-btn:hover {
    background: var(--neutral-100);
    color: var(--primary-600);
    border-color: var(--neutral-300);
  }

  .pagination-btn.active {
    background: var(--primary-600);
    color: white;
    border-color: var(--primary-600);
  }

  .pagination-btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Page size */
  .page-size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--neutral-600);
  }

  .page-size-select {
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--neutral-300);
    background: white;
    color: var(--neutral-900);
    font-size: 0.875rem;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .orders-table {
      min-width: 900px;
    }

    .header-actions {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 768px) {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .header-actions {
      width: 100%;
    }

    .search-box {
      width: 100%;
    }

    .card-footer {
      flex-direction: column;
      gap: 1rem;
    }

    .pagination {
      width: 100%;
      justify-content: center;
    }
  }
</style>
