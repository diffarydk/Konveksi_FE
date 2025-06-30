<!-- src/routes/admin/products/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { modals } from "$lib/stores/ui";
  import { getProducts, deleteProduct } from "$lib/services/products";
  import type { Product } from "$lib/types/product";
  import { auth } from "$lib/stores/auth";
  import { goto } from "$app/navigation";

  import Breadcrumb from "$lib/components/admin/common/Breadcrumb.svelte";
  import ProductList from "$lib/components/admin/Products/ProductList.svelte";
  import ProductModal from "$lib/components/admin/Products/ProductModal.svelte";

  // Page title and breadcrumbs
  const pageTitle = "Products";
  const breadcrumbs = [
    { label: "Home", link: "/admin" },
    { label: "Products", active: true },
  ];

  // Products data
  let products: Product[] = [];
  let isLoading = true;
  let error: string | null = null;
  let detailedError: any = null; // For detailed error information
  let serverResponse: any = null; // For server response debugging

  // Pagination state
  let currentPage = 1;
  let pageSize = 20;
  let paginationData = {
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    totalPages: 1,
  };

  // Modal state
  let isEditMode = false;
  let currentProduct: Partial<Product> = {};

  // Debug flag - set to true to see detailed error info
  let showDebugInfo = true;

  // Load products with pagination and comprehensive error handling
  async function loadProducts() {
    isLoading = true;
    error = null;
    detailedError = null;
    serverResponse = null;

    try {
      // Debug the API endpoint
      console.log("Fetching products from endpoint...");

      // First try a basic fetch to detect server errors
      try {
        const baseUrl = "https://f808-180-254-65-209.ngrok-free.app/api/v1";
        const response = await fetch(
          `${baseUrl}/produkpost/?page=${currentPage}&page_size=${pageSize}`,
          {
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const text = await response.text();
          serverResponse = {
            status: response.status,
            statusText: response.statusText,
            body: text,
            headers: Object.fromEntries([...response.headers.entries()]),
          };
          console.error("Server responded with error:", serverResponse);
        }
      } catch (fetchErr) {
        console.error("Direct fetch failed:", fetchErr);
      }

      // Try the actual API call
      const response = await getProducts(currentPage, pageSize);

      // If we get here, the API call succeeded
      products = response.results || [];

      // Calculate total pages
      const totalPages = Math.ceil(response.count / pageSize);

      // Update pagination data
      paginationData = {
        count: response.count,
        next: response.next,
        previous: response.previous,
        currentPage: currentPage,
        totalPages: totalPages || 1,
      };
    } catch (err: any) {
      console.error("Error loading products:", err);

      // Store the detailed error for debugging
      detailedError = err;

      // Create a user-friendly error message
      if (err?.status === 500) {
        error =
          "Server error occurred. The server might be unavailable or experiencing issues.";
      } else if (err?.status === 401) {
        error = "Your session has expired. Redirecting to login...";
        setTimeout(() => goto("/login"), 2000);
      } else {
        error = err?.message || "Failed to load products. Please try again.";
      }
    } finally {
      isLoading = false;
    }
  }

  // Delete product handler
  async function handleDeleteProduct(id: string) {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        await loadProducts(); // Refresh the list
      } catch (err: any) {
        console.error("Error deleting product:", err);
        alert(err?.message || "Failed to delete product. Please try again.");
      }
    }
  }

  // Page change handler
  function handlePageChange(event: CustomEvent<number>) {
    currentPage = event.detail;
    loadProducts();
  }

  // Open product modal in add mode
  function openAddProductModal() {
    isEditMode = false;
    currentProduct = {};
    modals.open("productModal");
  }

  // Open product modal in edit mode
  function openEditProductModal(event: CustomEvent<Product>) {
    const product = event.detail;
    isEditMode = true;
    currentProduct = { ...product }; // Clone the product data
    modals.open("productModal");
  }

  // Product saved handler
  function handleProductSaved() {
    loadProducts();
    modals.close("productModal");
  }

  // Force refresh function
  function forceRefresh() {
    loadProducts();
  }

  // Toggle debug info
  function toggleDebugInfo() {
    showDebugInfo = !showDebugInfo;
  }

  // Load products on component mount
  onMount(() => {
    // This will execute regardless of auth status
    loadProducts();
  });
</script>

<svelte:head>
  <title>Products - Admin Panel</title>
</svelte:head>

<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">{pageTitle}</h1>
      <Breadcrumb items={breadcrumbs} />
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" on:click={forceRefresh}>
        <i class="fas fa-sync-alt"></i>
        Refresh
      </button>
      <button class="btn btn-secondary">
        <i class="fas fa-download"></i>
        Export
      </button>
      <button class="btn btn-primary" on:click={openAddProductModal}>
        <i class="fas fa-plus"></i>
        Add Product
      </button>
    </div>
  </div>

  {#if error}
    <div class="alert alert-danger">
      <i class="fas fa-exclamation-circle"></i>
      <div>
        <p class="alert-message">{error}</p>
        <button class="btn btn-text" on:click={toggleDebugInfo}>
          {showDebugInfo ? "Hide" : "Show"} Details
        </button>
      </div>
    </div>

    {#if showDebugInfo && (detailedError || serverResponse)}
      <div class="debug-container">
        <h3>Debug Information</h3>

        {#if serverResponse}
          <div class="debug-section">
            <h4>Server Response</h4>
            <pre>{JSON.stringify(serverResponse, null, 2)}</pre>
          </div>
        {/if}

        {#if detailedError}
          <div class="debug-section">
            <h4>Error Details</h4>
            <pre>{JSON.stringify(detailedError, null, 2)}</pre>
          </div>
        {/if}

        <div class="debug-section">
          <h4>Suggestions</h4>
          <ul>
            <li>
              Check if the API server is running at <code
                >https://f808-180-254-65-209.ngrok-free.app</code
              >
            </li>
            <li>
              Verify that your endpoint <code>/api/v1/produkpost/</code> exists and
              accepts GET requests
            </li>
            <li>Check your browser console for CORS or network errors</li>
            <li>Verify authentication is set up correctly</li>
          </ul>
        </div>
      </div>
    {/if}
  {/if}

  <ProductList
    {products}
    {isLoading}
    pagination={paginationData}
    {pageSize}
    onDelete={handleDeleteProduct}
    on:edit={openEditProductModal}
    on:add={openAddProductModal}
    on:pageChange={handlePageChange}
  />

  <ProductModal
    product={currentProduct}
    isEdit={isEditMode}
    onSave={handleProductSaved}
  />
</div>

<style>
  /* Page Header */
  .page-header {
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--gray-900);
  }

  .page-actions {
    display: flex;
    gap: 1rem;
  }

  .alert {
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .alert-danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger, #ef4444);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .alert-message {
    margin: 0 0 0.5rem 0;
  }

  .btn-text {
    background: none;
    color: #3b82f6;
    padding: 0.25rem 0.5rem;
    box-shadow: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-text:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .debug-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .debug-container h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #0f172a;
    font-size: 1rem;
  }

  .debug-section {
    margin-bottom: 1.5rem;
  }

  .debug-section h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #334155;
    font-size: 0.9375rem;
  }

  .debug-section pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 300px;
    overflow-y: auto;
  }

  .debug-section code {
    background: #e2e8f0;
    color: #1e293b;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
  }

  .debug-section ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .debug-section li {
    margin-bottom: 0.5rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }
</style>
