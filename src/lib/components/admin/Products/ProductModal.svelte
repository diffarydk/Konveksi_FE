<!-- src/lib/components/admin/Products/ProductModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { modals } from "$lib/stores/ui";
  import { createProduct, updateProduct } from "$lib/services/products";
  import type { Product } from "$lib/types/product";

  export let product: Partial<Product> = {}; // For edit mode
  export let isEdit: boolean = false;
  export let onSave: () => void = () => {}; // Default empty function

  const dispatch = createEventDispatcher();

  // Form state
  let formData = {
    nama: "",
    kategori: "",
    deskripsi: "",
    harga: 0,
    stok: 0,
    // gambar: '',
    // ukuran: [] as string[],
    // warna: [] as string[],
    // featured: false
  };

  let isSubmitting = false;
  let error: string | null = null;
  let activeTab = "basic"; // basic, details, images

  // Size options
  const sizeOptions = ["S", "M", "L", "XL", "XXL", "3XL"];

  // Color options
  const colorOptions = [
    { value: "white", label: "White", hex: "#ffffff" },
    { value: "black", label: "Black", hex: "#000000" },
    { value: "red", label: "Red", hex: "#ef4444" },
    { value: "blue", label: "Blue", hex: "#2563eb" },
    { value: "green", label: "Green", hex: "#10b981" },
    { value: "yellow", label: "Yellow", hex: "#f8e11b" },
    { value: "orange", label: "Orange", hex: "#f59e0b" },
    { value: "purple", label: "Purple", hex: "#8b5cf6" },
  ];

  // Update form data if editing product
  $: if (isEdit && product.id) {
    formData = {
      nama: product.nama || "",
      kategori: product.kategori || "shirt",
      deskripsi: product.deskripsi || "",
      harga: product.harga || 0,
      stok: product.stok || 0,
      // gambar: product.gambar || '',
      // ukuran: product.ukuran || [],
      // warna: product.warna || [],
      // featured: product.featured || false
    };
  }

  // Category options
  const categories = [
    {
      value: "shirt",
      label: "Kaos",
      description: "T-shirts dan kaos lengan pendek",
    },
    { value: "polo", label: "Polo", description: "Polo shirts dan henley" },
    {
      value: "jacket",
      label: "Jaket",
      description: "Jaket, sweater, dan hoodie",
    },
    {
      value: "uniform",
      label: "Seragam",
      description: "Seragam kantor dan sekolah",
    },
    { value: "pants", label: "Celana", description: "Celana dan shorts" },
    {
      value: "accessories",
      label: "Aksesoris",
      description: "Topi, tas, dan merchandise",
    },
  ];

  // Toggle size selection
  // function toggleSize(size: string) {
  //   if (formData.ukuran.includes(size)) {
  //     formData.ukuran = formData.ukuran.filter(s => s !== size);
  //   } else {
  //     formData.ukuran = [...formData.ukuran, size];
  //   }
  // }

  // // Toggle color selection
  // function toggleColor(color: string) {
  //   if (formData.warna.includes(color)) {
  //     formData.warna = formData.warna.filter(c => c !== color);
  //   } else {
  //     formData.warna = [...formData.warna, color];
  //   }
  // }

  // // Get color hex by value
  // function getColorHex(value: string): string {
  //   const color = colorOptions.find(c => c.value === value);
  //   return color ? color.hex : '#cccccc';
  // }

  // Close modal handler
  function closeModal() {
    modals.close("productModal");
    resetForm();
  }

  // Reset form
  function resetForm() {
    if (!isEdit) {
      formData = {
        nama: "",
        kategori: "shirt",
        deskripsi: "",
        harga: 0,
        stok: 0,
        // gambar: '',
        // ukuran: [],
        // warna: [],
        // featured: false
      };
    }
    error = null;
    activeTab = "basic";
  }

  // Save product handler
  async function handleSubmit() {
    error = null;
    isSubmitting = true;

    try {
      // Validate form
      if (!formData.nama.trim()) {
        throw new Error("Product name is required");
      }

      if (formData.harga <= 0) {
        throw new Error("Price must be greater than 0");
      }

      if (isEdit && product.id) {
        // Update existing product
        await updateProduct(product.id, formData);
      } else {
        // Create new product
        await createProduct(formData);
      }

      // Notify parent
      onSave();
      closeModal();
    } catch (err: any) {
      console.error("Error saving product:", err);
      error = err.message || "Failed to save product. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  // Format price as currency while typing
  function formatPriceInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Remove non-digit characters
    const value = input.value.replace(/\D/g, "");
    formData.harga = parseInt(value || "0");
  }

  // Trap focus in modal when open
  onMount(() => {
    // Wait for modal to appear before focusing
    setTimeout(() => {
      const firstInput = document.querySelector(
        ".modal.active input"
      ) as HTMLElement;
      if (firstInput) firstInput.focus();
    }, 100);
  });
</script>

<!-- Product Modal -->
{#if $modals["productModal"]}
  <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
    <div
      class="modal active"
      transition:fly={{ y: 20, duration: 300, easing: cubicOut }}
      role="dialog"
      aria-labelledby="product-modal-title"
    >
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header">
          <h3 id="product-modal-title" class="modal-title">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h3>
          <button
            class="modal-close"
            on:click={closeModal}
            aria-label="Close"
            title="Close modal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Tab Navigation -->
        <div class="modal-tabs">
          <button
            class="tab-button"
            class:active={activeTab === "basic"}
            on:click={() => (activeTab = "basic")}
          >
            <i class="fas fa-info-circle"></i>
            Basic Info
          </button>
          <button
            class="tab-button"
            class:active={activeTab === "details"}
            on:click={() => (activeTab = "details")}
          >
            <i class="fas fa-list-ul"></i>
            Details
          </button>
          <button
            class="tab-button"
            class:active={activeTab === "images"}
            on:click={() => (activeTab = "images")}
          >
            <i class="fas fa-images"></i>
            Images
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          {#if error}
            <div
              class="alert alert-danger"
              transition:fly={{ y: -10, duration: 200 }}
            >
              <i class="fas fa-exclamation-circle"></i>
              <span>{error}</span>
              <button
                class="alert-close"
                on:click={() => (error = null)}
                aria-label="Close alert"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          {/if}

          <!-- Form Content -->
          <form id="productForm" on:submit|preventDefault={handleSubmit}>
            <!-- Basic Info Tab -->
            {#if activeTab === "basic"}
              <div class="form-section" transition:fade={{ duration: 200 }}>
                <div class="form-group">
                  <label class="form-label" for="productName">
                    <span class="required">*</span> Product Name
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    id="productName"
                    bind:value={formData.nama}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="productName">
                    <span class="required">*</span> Category
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    id="productName"
                    bind:value={formData.kategori}
                    placeholder="Enter Category name"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="productDescription"
                    >Description</label
                  >
                  <textarea
                    class="form-control"
                    id="productDescription"
                    bind:value={formData.deskripsi}
                    placeholder="Enter product description"
                    rows="4"
                  ></textarea>
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label" for="productPrice">
                      <span class="required">*</span> Price
                    </label>
                    <div class="input-group">
                      <span class="input-group-text">Rp</span>
                      <input
                        type="text"
                        class="form-control"
                        id="productPrice"
                        value={formData.harga.toLocaleString("id-ID")}
                        on:input={formatPriceInput}
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="productStock">Stock</label>
                    <input
                      type="number"
                      class="form-control"
                      id="productStock"
                      bind:value={formData.stok}
                      placeholder="Enter stock quantity"
                      min="0"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <div class="form-check">
                    <!-- <input 
                      type="checkbox" 
                      class="form-check-input" 
                      id="productFeatured"
                      bind:checked={formData.featured}
                    > -->
                    <label class="form-check-label" for="productFeatured">
                      Feature this product on homepage
                    </label>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Details Tab -->
            <!-- {#if activeTab === 'details'}
              <div class="form-section" transition:fade={{ duration: 200 }}>
                <div class="form-group">
                  <label class="form-label">Available Sizes</label>
                  <div class="size-options">
                    {#each sizeOptions as size}
                      <button 
                        type="button"
                        class="size-option" 
                        class:selected={formData.ukuran.includes(size)}
                        on:click={() => toggleSize(size)}
                      >
                        {size}
                      </button>
                    {/each}
                  </div>
                  <div class="form-helper">Select all available sizes for this product</div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Available Colors</label>
                  <div class="color-options">
                    {#each colorOptions as color}
                      <button 
                        type="button"
                        class="color-option" 
                        class:selected={formData.warna.includes(color.value)}
                        on:click={() => toggleColor(color.value)}
                        style="--color: {color.hex}"
                        title={color.label}
                      >
                        {#if formData.warna.includes(color.value)}
                          <i class="fas fa-check"></i>
                        {/if}
                      </button>
                    {/each}
                  </div>
                  <div class="form-helper">Select all available colors for this product</div>
                </div>
                
                <div class="selected-options">
                  <div class="selected-section">
                    <h4>Selected Sizes</h4>
                    {#if formData.ukuran.length > 0}
                      <div class="selected-tags">
                        {#each formData.ukuran as size}
                          <div class="selected-tag">
                            {size}
                            <button 
                              type="button" 
                              class="tag-remove" 
                              on:click={() => toggleSize(size)}
                              aria-label={`Remove ${size}`}
                            >
                              <i class="fas fa-times"></i>
                            </button>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="empty-selection">No sizes selected</div>
                    {/if}
                  </div>
                  
                  <div class="selected-section">
                    <h4>Selected Colors</h4>
                    {#if formData.warna.length > 0}
                      <div class="selected-tags">
                        {#each formData.warna as color}
                          <div class="selected-tag" style="--tag-color: {getColorHex(color)}">
                            <div 
                              class="color-preview" 
                              style="background-color: {getColorHex(color)}"
                            ></div>
                            {@const colorLabel = colorOptions.find(c => c.value === color)?.label || color}
                            {colorLabel}
                            <button 
                              type="button" 
                              class="tag-remove" 
                              on:click={() => toggleColor(color)}
                              aria-label={`Remove ${colorLabel}`}
                            >
                              <i class="fas fa-times"></i>
                            </button>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="empty-selection">No colors selected</div>
                    {/if}
                  </div>
                </div>
              </div>
            {/if} -->

            <!-- Images Tab -->
            <!-- {#if activeTab === 'images'}
              <div class="form-section" transition:fade={{ duration: 200 }}>
                <div class="form-group">
                  <label class="form-label" for="productImage">Product Image URL</label>
                  <div class="input-group">
                    <input 
                      type="text" 
                      class="form-control" 
                      id="productImage"
                      bind:value={formData.gambar}
                      placeholder="Enter image URL"
                    >
                    <button 
                      type="button" 
                      class="input-group-btn"
                      disabled={!formData.gambar}
                    >
                      Preview
                    </button>
                  </div>
                  <div class="form-helper">Enter a valid URL for the product image</div>
                </div>
                
                <div class="image-preview">
                  {#if formData.gambar}
                    <div class="preview-container">
                      <img 
                        src={formData.gambar} 
                        alt="Product preview" 
                        class="preview-image"
                        on:error={(e) => e.currentTarget.src = 'https://placehold.co/300x300?text=Image+Error'}
                      />
                    </div>
                  {:else}
                    <div class="empty-preview">
                      <i class="fas fa-image"></i>
                      <p>No image provided</p>
                      <p class="preview-helper">Enter an image URL to preview</p>
                    </div>
                  {/if}
                </div>
                
                <div class="image-upload">
                  <button type="button" class="btn btn-secondary btn-block">
                    <i class="fas fa-upload"></i>
                    Upload Image
                  </button>
                  <div class="form-helper">Upload functionality will be available soon</div>
                </div>
              </div>
            {/if} -->
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <!-- Tab navigation buttons -->
          <div class="tab-navigation">
            {#if activeTab !== "basic"}
              <button
                type="button"
                class="btn btn-text"
                on:click={() =>
                  (activeTab = activeTab === "details" ? "basic" : "details")}
              >
                <i class="fas fa-arrow-left"></i> Previous
              </button>
            {/if}

            {#if activeTab !== "images"}
              <button
                type="button"
                class="btn btn-text"
                on:click={() =>
                  (activeTab = activeTab === "basic" ? "details" : "images")}
              >
                Next <i class="fas fa-arrow-right"></i>
              </button>
            {/if}
          </div>

          <!-- Action buttons -->
          <div class="action-buttons">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={closeModal}
            >
              Cancel
            </button>

            <button
              type="button"
              class="btn btn-primary"
              on:click={handleSubmit}
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                <i class="fas fa-spinner fa-spin"></i>
              {/if}
              {isEdit ? "Update" : "Save"} Product
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Modal backdrop */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    overflow-y: auto;
    padding: 2rem 1rem;
  }

  /* Modal */
  .modal {
    width: 100%;
    max-width: 700px;
    max-height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
    margin: auto;
  }

  .modal-content {
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    max-height: 100%;
  }

  /* Modal header */
  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    margin: -0.5rem;
    border-radius: 0.375rem;
    line-height: 1;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: #f3f4f6;
    color: #ef4444;
  }

  /* Modal tabs */
  .modal-tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .tab-button {
    padding: 0.875rem 1.25rem;
    border: none;
    background: transparent;
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    position: relative;
  }

  .tab-button:hover {
    color: #2563eb;
    background: #f3f4f6;
  }

  .tab-button.active {
    color: #2563eb;
    font-weight: 600;
  }

  .tab-button.active::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #2563eb;
  }

  .tab-button i {
    opacity: 0.7;
    font-size: 0.875rem;
  }

  /* Modal body */
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }

  /* Form section */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Form grid */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  /* Form group */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .form-label {
    font-weight: 500;
    font-size: 0.875rem;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .required {
    color: #ef4444;
  }

  .form-control {
    padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .form-control:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .form-helper {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Input group */
  .input-group {
    display: flex;
    align-items: stretch;
  }

  .input-group .form-control {
    flex: 1;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .input-group-text {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-right: none;
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
    color: #4b5563;
    font-weight: 500;
  }

  .input-group-btn {
    background: #f9fafb;
    border: 1px solid #d1d5db;
    border-left: none;
    border-top-right-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    padding: 0 0.875rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
  }

  .input-group-btn:hover {
    background: #f3f4f6;
  }

  .input-group-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Form check */
  .form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-check-input {
    width: 1rem;
    height: 1rem;
    accent-color: #2563eb;
  }

  .form-check-label {
    font-size: 0.875rem;
    color: #4b5563;
  }

  /* Size options */
  .size-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .size-option {
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .size-option:hover {
    border-color: #9ca3af;
    background: #f9fafb;
  }

  .size-option.selected {
    border-color: #2563eb;
    background: #eff6ff;
    color: #2563eb;
  }

  /* Color options */
  .color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .color-option {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.375rem;
    background-color: var(--color, #cccccc);
    border: 2px solid #f9fafb;
    box-shadow: 0 0 0 1px #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .color-option:hover {
    transform: scale(1.05);
    box-shadow: 0 0 0 1px #9ca3af;
  }

  .color-option.selected {
    box-shadow: 0 0 0 2px #2563eb;
  }

  .color-option i {
    color: white;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    font-size: 1rem;
  }

  /* Selected options */
  .selected-options {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: 1rem;
    padding-top: 1.25rem;
    border-top: 1px solid #e5e7eb;
  }

  .selected-section h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem;
  }

  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .selected-tag {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    font-size: 0.75rem;
    color: #374151;
  }

  .selected-tag::before {
    content: "";
    display: block;
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
    background-color: var(--tag-color, transparent);
  }

  .color-preview {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .tag-remove {
    background: none;
    border: none;
    padding: 0;
    color: #9ca3af;
    cursor: pointer;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.25rem;
  }

  .tag-remove:hover {
    color: #ef4444;
  }

  .empty-selection {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
  }

  /* Image preview */
  .image-preview {
    margin-top: 0.5rem;
    margin-bottom: 1.25rem;
    border: 1px dashed #d1d5db;
    border-radius: 0.5rem;
    padding: 1rem;
    background: #f9fafb;
  }

  .preview-container {
    display: flex;
    justify-content: center;
    padding: 1rem;
  }

  .preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 0.375rem;
  }

  .empty-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    gap: 0.5rem;
    color: #9ca3af;
  }

  .empty-preview i {
    font-size: 2.5rem;
    opacity: 0.5;
  }

  .empty-preview p {
    margin: 0;
    font-size: 0.875rem;
  }

  .preview-helper {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .image-upload {
    margin-top: 0.5rem;
  }

  .btn-block {
    width: 100%;
  }

  /* Alert */
  .alert {
    padding: 0.875rem 1rem;
    margin-bottom: 1.25rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
  }

  .alert-danger {
    background: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .alert i {
    font-size: 1rem;
  }

  .alert span {
    flex: 1;
  }

  .alert-close {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    opacity: 0.7;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .alert-close:hover {
    opacity: 1;
  }

  /* Modal footer */
  .modal-footer {
    padding: 1.25rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
  }

  /* Tab navigation */
  .tab-navigation {
    display: flex;
    gap: 1rem;
  }

  /* Action buttons */
  .action-buttons {
    display: flex;
    gap: 0.75rem;
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
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background: #f9fafb;
  }

  .btn-text {
    background: none;
    color: #2563eb;
    padding: 0.375rem 0.75rem;
  }

  .btn-text:hover {
    background: rgba(37, 99, 235, 0.1);
  }

  /* Responsive styling */
  @media (max-width: 640px) {
    .modal-tabs {
      overflow-x: auto;
    }

    .tab-button {
      padding: 0.75rem 1rem;
      flex-shrink: 0;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .modal-footer {
      flex-direction: column;
      gap: 1rem;
    }

    .tab-navigation,
    .action-buttons {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
