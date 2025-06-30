<!-- src/lib/components/admin/Products/ProductList.svelte -->
<script lang="ts">
  import { formatCurrency } from "$lib/utils/formatters";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import type { Product } from "$lib/types/product";
  import type { PaginatedResponse } from "$lib/services/products";
  import { modals } from "$lib/stores/ui";
  import { createEventDispatcher } from "svelte";

  // Accept pagination metadata in addition to products
  export let products: Product[] = [];
  export let isLoading: boolean = false;
  export let onDelete: (id: string) => void;

  // Pagination props
  export let pagination: {
    count: number;
    next: string | null;
    previous: string | null;
    currentPage: number;
    totalPages: number;
  } = {
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  };

  export let pageSize: number = 20;

  // Event dispatcher for communication with parent
  const dispatch = createEventDispatcher<{
    view: string;
    edit: Product;
    add: void;
    pageChange: number;
    pageSizeChange: number;
  }>();

  // Expanded items state
  let expandedItems: Record<string, boolean> = {};

  // Toggle expand item
  function toggleExpand(id: string) {
    expandedItems[id] = !expandedItems[id];
  }

  // Filter products
  let searchTerm = "";
  $: filteredProducts = products.filter(
    (product) =>
      product.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.kategori &&
        product.kategori.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Table columns configuration - removed stock column
  const columns = [
    { key: "nama", label: "Name", width: "25%" },
    { key: "kategori", label: "Category", width: "15%" },
    { key: "deskripsi", label: "Description", width: "35%" },
    { key: "harga", label: "Price", width: "15%" },
    { key: "actions", label: "Actions", width: "10%", type: "actions" },
  ];

  // View product details
  function viewProduct(id: string) {
    console.log(`Viewing product ${id}`);
    // Navigate to product details or open view modal
    dispatch("view", id);
  }

  // Edit product - dispatch event to parent component
  function editProduct(product: Product) {
    console.log(`Editing product ${product.id}`);
    // Tell parent component to edit this product
    dispatch("edit", product);
  }

  // Get category badge class
  function getCategoryClass(category: string | undefined): string {
    if (!category) return "secondary";

    switch (category.toLowerCase()) {
      case "shirt":
        return "primary";
      case "polo":
        return "success";
      case "jacket":
        return "warning";
      case "uniform":
        return "info";
      default:
        return "secondary";
    }
  }

  // Format category label for display - fixed to handle undefined
  function formatCategory(category: string | undefined): string {
    if (!category) return "Uncategorized";

    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  // Pagination functions
  function changePage(page: number) {
    if (page === pagination.currentPage) return;
    if (page < 1 || page > pagination.totalPages) return;

    dispatch("pageChange", page);
  }

  function handlePageSizeChange(event: Event) {
    const newSize = parseInt((event.target as HTMLSelectElement).value);
    dispatch("pageSizeChange", newSize);
  }

  // Generate page numbers array for pagination
  $: pageNumbers = generatePageNumbers(
    pagination.currentPage,
    pagination.totalPages
  );

  function generatePageNumbers(
    currentPage: number,
    totalPages: number
  ): number[] {
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      // Near the start
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      // Near the end
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    // Somewhere in the middle
    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }
</script>

<div class="card">
  <div class="card-header">
    <div>
      <h3 class="card-title">Product Catalog (MOCKUP)</h3>
      <p class="card-subtitle">{pagination.count} products in total</p>
    </div>

    <div class="header-actions">
      <div class="search-box">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          class="search-input"
          placeholder="Search products..."
          bind:value={searchTerm}
        />
        {#if searchTerm}
          <button
            class="search-clear"
            on:click={() => (searchTerm = "")}
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

      <button class="btn btn-primary btn-sm" on:click={() => dispatch("add")}>
        <i class="fas fa-plus"></i>
        <span>Add Product</span>
      </button>
    </div>
  </div>

  <div class="table-responsive">
    {#if isLoading}
      <div class="loading-state">
        <i class="fas fa-spinner fa-pulse"></i>
        <span>Loading products...</span>
      </div>
    {:else if products.length === 0}
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No products found</p>
        <button class="btn btn-primary" on:click={() => dispatch("add")}>
          <i class="fas fa-plus"></i>
          Add First Product
        </button>
      </div>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            {#each columns as column}
              <th style="width: {column.width};">{column.label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#if filteredProducts.length === 0}
            <tr>
              <td colspan={columns.length} class="empty-message">
                <div class="empty-state">
                  <i class="fas fa-search"></i>
                  <p>No products match your search</p>
                  <button
                    class="btn btn-text"
                    on:click={() => (searchTerm = "")}
                  >
                    Clear search
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            {#each filteredProducts as product, i}
              <tr
                class:expanded={expandedItems[product.id]}
                class:even={i % 2 === 0}
                class:odd={i % 2 === 1}
                in:fade={{ duration: 200, delay: i * 30 }}
              >
                <td class="product-name-cell">
                  <button
                    class="expand-toggle"
                    on:click={() => toggleExpand(product.id)}
                    title={expandedItems[product.id] ? "Collapse" : "Expand"}
                  >
                    <i
                      class={`fas fa-chevron-${expandedItems[product.id] ? "down" : "right"}`}
                    ></i>
                  </button>
                  <span class="product-name">{product.nama}</span>
                </td>
                <td>
                  <div
                    class="status-badge {getCategoryClass(product.kategori)}"
                  >
                    <span>{formatCategory(product.kategori)}</span>
                  </div>
                </td>
                <td class="description-cell">
                  <div class="description-text">
                    {product.deskripsi || "No description"}
                  </div>
                </td>
                <td class="price-cell">
                  <div class="price-value">{formatCurrency(product.harga)}</div>
                </td>
                <td class="actions-cell">
                  <div class="table-actions">
                    <button
                      class="action-btn view-btn"
                      on:click={() => viewProduct(product.id)}
                      title="View details"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      class="action-btn edit-btn"
                      on:click={() => editProduct(product)}
                      title="Edit product"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="action-btn delete-btn"
                      on:click={() => onDelete(product.id)}
                      title="Delete product"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>

              {#if expandedItems[product.id]}
                <tr
                  class="expanded-row"
                  transition:fly={{ y: -20, duration: 200 }}
                >
                  <td colspan={columns.length}>
                    <div class="expanded-content">
                      <div class="expanded-section">
                        <h4>Product Details</h4>
                        <div class="details-grid">
                          <div class="detail-item">
                            <span class="detail-label">ID</span>
                            <span class="detail-value">{product.id}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Name</span>
                            <span class="detail-value">{product.nama}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Category</span>
                            <span class="detail-value"
                              >{formatCategory(product.kategori)}</span
                            >
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Price</span>
                            <span class="detail-value"
                              >{formatCurrency(product.harga)}</span
                            >
                          </div>
                          <div class="detail-item full-width">
                            <span class="detail-label">Description</span>
                            <span class="detail-value"
                              >{product.deskripsi ||
                                "No description provided"}</span
                            >
                          </div>
                        </div>
                      </div>

                      <div class="expanded-actions">
                        <button
                          class="btn btn-primary btn-sm"
                          on:click={() => viewProduct(product.id)}
                        >
                          <i class="fas fa-eye"></i>
                          <span>View Details</span>
                        </button>
                        <button
                          class="btn btn-secondary btn-sm"
                          on:click={() => editProduct(product)}
                        >
                          <i class="fas fa-edit"></i>
                          <span>Edit Product</span>
                        </button>
                        <button
                          class="btn btn-danger btn-sm"
                          on:click={() => onDelete(product.id)}
                        >
                          <i class="fas fa-trash"></i>
                          <span>Delete Product</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          {/if}
        </tbody>
      </table>
    {/if}
  </div>

  <div class="card-footer">
    <!-- Show pagination controls if there are products and more than one page -->
    {#if pagination.count > pageSize}
      <div class="pagination">
        <!-- Previous page button -->
        <button
          class="pagination-btn"
          disabled={pagination.currentPage === 1}
          on:click={() => changePage(pagination.currentPage - 1)}
        >
          <i class="fas fa-chevron-left"></i>
        </button>

        <!-- First page (if not visible in current set) -->
        {#if !pageNumbers.includes(1) && pagination.totalPages > 5}
          <button
            class="pagination-btn"
            class:active={pagination.currentPage === 1}
            on:click={() => changePage(1)}
          >
            1
          </button>
          {#if pageNumbers[0] > 2}
            <span class="pagination-ellipsis">...</span>
          {/if}
        {/if}

        <!-- Page numbers -->
        {#each pageNumbers as pageNum}
          <button
            class="pagination-btn"
            class:active={pagination.currentPage === pageNum}
            on:click={() => changePage(pageNum)}
          >
            {pageNum}
          </button>
        {/each}

        <!-- Last page (if not visible in current set) -->
        {#if !pageNumbers.includes(pagination.totalPages) && pagination.totalPages > 5}
          {#if pageNumbers[pageNumbers.length - 1] < pagination.totalPages - 1}
            <span class="pagination-ellipsis">...</span>
          {/if}
          <button
            class="pagination-btn"
            class:active={pagination.currentPage === pagination.totalPages}
            on:click={() => changePage(pagination.totalPages)}
          >
            {pagination.totalPages}
          </button>
        {/if}

        <!-- Next page button -->
        <button
          class="pagination-btn"
          disabled={pagination.currentPage === pagination.totalPages ||
            pagination.totalPages === 0}
          on:click={() => changePage(pagination.currentPage + 1)}
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    {:else}
      <!-- Simple info text when only one page -->
      <div class="items-info">
        Showing {products.length} of {pagination.count} items
      </div>
    {/if}
  </div>
</div>

<style>
  /* Card styles */
  .card {
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.05),
      0 8px 15px rgba(0, 0, 0, 0.03);
    margin-bottom: 2rem;
    border: 1px solid #edf2f7;
  }

  .card-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #edf2f7;
    background-color: #fafafa;
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    margin-bottom: 0.25rem;
  }

  .card-subtitle {
    font-size: 0.875rem;
    color: #64748b;
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
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .search-clear {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0;
    font-size: 0.75rem;
  }

  .search-clear:hover {
    color: #ef4444;
  }

  /* Button styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .btn-sm {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: white;
    color: #334155;
    border: 1px solid #e2e8f0;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-text {
    background: none;
    color: #3b82f6;
    padding: 0.25rem 0.5rem;
    box-shadow: none;
  }

  .btn-text:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  /* Table */
  .table-responsive {
    overflow-x: auto;
    max-height: none;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse; /* Changed from separate to collapse for consistent borders */
    table-layout: fixed;
  }

  .data-table th {
    background: #f8fafc;
    padding: 1rem 1.5rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .data-table td {
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    color: #334155;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
    line-height: 1.4;
    height: 72px; /* Fixed height for all cells to ensure alignment */
    box-sizing: border-box;
  }

  .data-table tbody tr {
    transition: background 0.2s;
  }

  .data-table tbody tr:hover {
    background: #f8fafc;
  }

  .data-table tbody tr.even {
    background-color: #ffffff;
  }

  .data-table tbody tr.odd {
    background-color: #f9fafb;
  }

  .data-table tbody tr.expanded {
    background: #eff6ff; /* Light blue background for expanded row */
  }

  /* Product name cell */
  .product-name-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 100%;
  }

  .product-name {
    font-weight: 500;
    color: #0f172a;
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
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .expand-toggle:hover {
    background: #e2e8f0;
    color: #3b82f6;
  }

  /* Description cell */
  .description-cell {
    max-width: 100%;
  }

  .description-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    line-height: 1.5;
  }

  /* Price cell */
  .price-cell {
    text-align: right;
  }

  /* Price value */
  .price-value {
    font-weight: 600;
    color: #0f172a;
    display: inline-block;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }

  /* Actions cell */
  .actions-cell {
    text-align: center;
  }

  /* Status badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    min-width: 80px;
  }

  .status-badge.primary {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .status-badge.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .status-badge.warning {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }

  .status-badge.danger {
    background: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .status-badge.info {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }

  .status-badge.secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  /* Table actions */
  .table-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border-radius: 0.375rem;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .action-btn.view-btn:hover {
    background: #eff6ff;
    color: #3b82f6;
    border-color: #bfdbfe;
  }

  .action-btn.edit-btn:hover {
    background: #fffbeb;
    color: #f59e0b;
    border-color: #fde68a;
  }

  .action-btn.delete-btn:hover {
    background: #fee2e2;
    color: #ef4444;
    border-color: #fecaca;
  }

  /* Loading and empty states */
  .loading-state,
  .empty-state {
    text-align: center;
    padding: 4rem 1.5rem;
    color: #64748b;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: #f8fafc;
  }

  .loading-state i,
  .empty-state i {
    font-size: 2.5rem;
    opacity: 0.6;
    color: #94a3b8;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
    color: #475569;
  }

  .empty-message {
    text-align: center;
    padding: 4rem 1.5rem;
  }

  /* Expanded content */
  .expanded-row {
    background: #eff6ff;
  }

  .expanded-row td {
    padding: 0; /* Remove padding for expanded row cell */
    border-bottom: none; /* Remove border for expanded row */
  }

  .expanded-content {
    padding: 1.5rem 2rem 2rem;
    background: #f8fafc;
    border-top: 1px solid #bfdbfe;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .expanded-section {
    margin-bottom: 1.5rem;
  }

  .expanded-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 1.25rem;
    color: #1e293b;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem 2rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .detail-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .detail-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
    line-height: 1.5;
  }

  .expanded-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
    padding-top: 1.5rem;
  }

  /* Card footer with pagination */
  .card-footer {
    padding: 1.25rem 1.5rem;
    border-top: 1px solid #edf2f7;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8fafc;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
  }

  .pagination-btn {
    width: 36px;
    height: 36px;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    background: white;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .pagination-btn:hover {
    background: #f8fafc;
    color: #3b82f6;
    border-color: #bfdbfe;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .pagination-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }

  .pagination-btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .pagination-ellipsis {
    width: 36px;
    text-align: center;
    color: #64748b;
    font-size: 1rem;
  }

  .items-info {
    font-size: 0.875rem;
    color: #64748b;
    padding: 0.5rem 1rem;
    background: #f1f5f9;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .data-table {
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

  @media (max-width: 640px) {
    .header-actions {
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
    }

    .search-box {
      width: 100%;
    }
  }
</style>
