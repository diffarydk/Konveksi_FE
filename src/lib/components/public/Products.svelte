<script lang="ts">
  import { onMount } from "svelte";
  import { fly, fade, scale, slide } from "svelte/transition";
  import { cubicOut, elasticOut } from "svelte/easing";

  interface Product {
    id: string;
    image: string;
    images: string[];
    category: string;
    title: string;
    price: string;
    originalPrice?: string;
    description: string;
    whatsappLink: string;
    features: string[];
    badge?: string;
  }

  interface Category {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  }

  const categories: Category[] = [
    {
      id: "casual",
      name: "Casual",
      icon: "👕",
      description: "Pakaian casual nyaman untuk sehari-hari",
      color: "#3b82f6",
    },
    {
      id: "formal",
      name: "Formal",
      icon: "👔",
      description: "Busana formal untuk tampil profesional",
      color: "#8b5cf6",
    },
    {
      id: "outer",
      name: "Outer",
      icon: "🧥",
      description: "Outer wear stylish dan fungsional",
      color: "#10b981",
    },
    {
      id: "seragam",
      name: "Seragam",
      icon: "👥",
      description: "Seragam custom untuk institusi",
      color: "#f59e0b",
    },
  ];

  const allProducts: Product[] = [
    {
      id: "kaos-polos",
      image: "images/kaos.png",
      images: ["images/kaos.png", "images/kaos.png", "images/kaos.png"],
      category: "casual",
      title: "Kaos Polos Premium",
      price: "Rp 150.000",
      originalPrice: "Rp 200.000",
      description:
        "Kaos polos premium dengan bahan cotton combed 30s yang nyaman dan tahan lama.",
      features: [
        "Cotton Combed 30s",
        "Anti-shrink",
        "Breathable",
        "Berbagai warna",
      ],
      badge: "BEST SELLER",
      whatsappLink:
        "https://wa.me/62087776299650?text=Saya%20tertarik%20dengan%20Kaos%20Polos%20Premium",
    },
    {
      id: "kaos-sablon",
      image: "images/kaos.png",
      images: ["images/kaos.png", "images/kaos.png"],
      category: "casual",
      title: "Kaos Custom Sablon",
      price: "Rp 180.000",
      description:
        "Kaos dengan sablon berkualitas tinggi, design custom sesuai kebutuhan.",
      features: ["Sablon DTG", "Design custom", "Tahan lama", "Hasil tajam"],
      whatsappLink:
        "https://wa.me/62087776299650?text=Saya%20tertarik%20dengan%20Kaos%20Custom%20Sablon",
    },
    {
      id: "kemeja-formal",
      image: "images/kaos.png",
      images: ["images/kaos.png", "images/kaos.png"],
      category: "formal",
      title: "Kemeja Formal Oxford",
      price: "Rp 200.000",
      description:
        "Kemeja formal dengan bahan Oxford premium untuk tampilan profesional.",
      features: ["Bahan Oxford", "Slim fit", "Anti-wrinkle", "Formal look"],
      badge: "NEW",
      whatsappLink:
        "https://wa.me/62087776299650?text=Saya%20tertarik%20dengan%20Kemeja%20Formal%20Oxford",
    },
    {
      id: "hoodie-premium",
      image: "images/kaos.png",
      images: ["images/kaos.png", "images/kaos.png", "images/kaos.png"],
      category: "outer",
      title: "Hoodie Premium",
      price: "Rp 350.000",
      description:
        "Hoodie dengan bahan fleece premium yang hangat dan stylish.",
      features: ["Fleece premium", "Double layer", "Waterproof", "Unisex"],
      whatsappLink:
        "https://wa.me/62087776299650?text=Saya%20tertarik%20dengan%20Hoodie%20Premium",
    },
    {
      id: "seragam-kantor",
      image: "images/kaos.png",
      images: ["images/kaos.png", "images/kaos.png"],
      category: "seragam",
      title: "Seragam Kantor Custom",
      price: "Rp 200.000",
      description:
        "Seragam kantor dengan design professional dan bahan berkualitas.",
      features: [
        "Design custom",
        "Bahan premium",
        "Tahan lama",
        "Professional",
      ],
      whatsappLink:
        "https://wa.me/62087776299650?text=Saya%20tertarik%20dengan%20Seragam%20Kantor%20Custom",
    },
  ];

  let activeCategory = "all";
  let currentSlide = 0;
  let selectedProduct: Product | null = null;
  let showQuickView = false;
  let isMobile = false;
  let autoSlideInterval: number;

  $: filteredProducts =
    activeCategory === "all"
      ? allProducts
      : allProducts.filter((product) => product.category === activeCategory);

  $: featuredProducts = allProducts.filter((product) => product.badge);

  onMount(() => {
    isMobile = window.innerWidth <= 768;

    // Auto slide for featured products
    startAutoSlide();

    const handleResize = () => {
      isMobile = window.innerWidth <= 768;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (autoSlideInterval) clearInterval(autoSlideInterval);
    };
  });

  function startAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    // Delay auto-slide lebih lama untuk mengurangi gangguan
    autoSlideInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % featuredProducts.length;
    }, 8000);
  }

  function setActiveCategory(categoryId: string) {
    activeCategory = categoryId;
  }

  function openQuickView(product: Product) {
    selectedProduct = product;
    showQuickView = true;
  }

  function closeQuickView() {
    showQuickView = false;
    selectedProduct = null;
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % featuredProducts.length;
    startAutoSlide();
  }

  function prevSlide() {
    currentSlide =
      currentSlide === 0 ? featuredProducts.length - 1 : currentSlide - 1;
    startAutoSlide();
  }
</script>

{@html "<!--Products.svelte-->"}

<section class="products-enhanced" id="products">
  <div class="products-container">
    <!-- Section Header -->
    <div class="section-header" in:fly={{ y: 30, duration: 800 }}>
      <div class="header-badge">
        <span>Produk Unggulan</span>
      </div>
      <h2 class="section-title">
        Koleksi <span class="title-accent">Premium</span> Kami
      </h2>
      <p class="section-subtitle">
        Temukan produk berkualitas tinggi yang telah dipercaya ribuan pelanggan
      </p>
    </div>

    <!-- Featured Products Carousel -->
    <div class="featured-carousel" in:fade={{ delay: 400, duration: 800 }}>
      <div class="carousel-header">
        <h3>🔥 Produk Terlaris</h3>
        <div class="carousel-controls">
          <button class="carousel-btn" on:click={prevSlide}>
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="carousel-btn" on:click={nextSlide}>
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div class="carousel-wrapper">
        <div
          class="carousel-track"
          style="transform: translateX(-{currentSlide * 100}%)"
        >
          {#each featuredProducts as product, index}
            <div class="featured-card" class:active={index === currentSlide}>
              <div class="featured-image">
                <img src={product.image} alt={product.title} />
                <div class="featured-badge">{product.badge}</div>
                <div class="featured-overlay">
                  <button
                    class="quick-view-btn"
                    on:click={() => openQuickView(product)}
                  >
                    <i class="fas fa-eye"></i>
                    <span>Quick View</span>
                  </button>
                </div>
              </div>
              <div class="featured-content">
                <div class="featured-category">
                  {categories.find((c) => c.id === product.category)?.name}
                </div>
                <h4>{product.title}</h4>
                <div class="featured-price">
                  <span class="current-price">{product.price}</span>
                  {#if product.originalPrice}
                    <span class="original-price">{product.originalPrice}</span>
                  {/if}
                </div>
                <a
                  href={product.whatsappLink}
                  target="_blank"
                  class="featured-cta"
                >
                  <i class="fab fa-whatsapp"></i>
                  <span>Pesan Sekarang</span>
                </a>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="carousel-indicators">
        {#each featuredProducts as _, index}
          <button
            class="indicator"
            class:active={index === currentSlide}
            on:click={() => {
              currentSlide = index;
              startAutoSlide();
            }}
          ></button>
        {/each}
      </div>
    </div>

    <!-- Category Filter -->
    <div class="category-filter" in:fly={{ y: 20, delay: 600, duration: 600 }}>
      <button
        class="filter-btn"
        class:active={activeCategory === "all"}
        on:click={() => setActiveCategory("all")}
      >
        <span class="filter-icon">🎯</span>
        <span>Semua</span>
      </button>

      {#each categories as category}
        <button
          class="filter-btn"
          class:active={activeCategory === category.id}
          style="--category-color: {category.color}"
          on:click={() => setActiveCategory(category.id)}
        >
          <span class="filter-icon">{category.icon}</span>
          <span>{category.name}</span>
        </button>
      {/each}
    </div>

    <!-- Products Grid -->
    <div class="products-grid" in:fly={{ y: 20, delay: 800, duration: 600 }}>
      {#each filteredProducts as product, index}
        <div
          class="product-card-enhanced"
          in:scale={{ delay: index * 100, duration: 500, easing: elasticOut }}
          on:click={() => openQuickView(product)}
          role="button"
          tabindex="0"
        >
          <div class="product-image-container">
            <img
              src={product.image}
              alt={product.title}
              class="product-image"
            />
            {#if product.badge}
              <div class="product-badge">{product.badge}</div>
            {/if}
            <div class="product-overlay">
              <div class="overlay-actions">
                <button class="action-btn">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn">
                  <i class="fas fa-heart"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="product-content">
            <div class="product-category">
              {categories.find((c) => c.id === product.category)?.icon}
              {categories.find((c) => c.id === product.category)?.name}
            </div>
            <h3 class="product-title">{product.title}</h3>
            <p class="product-description">{product.description}</p>

            <div class="product-features">
              {#each product.features.slice(0, 2) as feature}
                <span class="feature-tag">✓ {feature}</span>
              {/each}
            </div>

            <div class="product-footer">
              <div class="product-price">
                <span class="current-price">{product.price}</span>
                {#if product.originalPrice}
                  <span class="original-price">{product.originalPrice}</span>
                {/if}
              </div>
              <a
                href={product.whatsappLink}
                target="_blank"
                class="product-cta"
              >
                <i class="fab fa-whatsapp"></i>
                <span>Konsultasi</span>
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- CTA Section -->
    <div class="products-cta" in:fade={{ delay: 1000, duration: 800 }}>
      <div class="cta-content">
        <h3>Tidak Menemukan yang Anda Cari?</h3>
        <p>Konsultasikan kebutuhan custom Anda dengan tim ahli kami</p>
        <div class="cta-buttons">
          <a
            href="https://wa.me/62087776299650?text=Halo%2C%20saya%20ingin%20konsultasi%20untuk%20produk%20custom"
            target="_blank"
            class="cta-primary"
          >
            <i class="fab fa-whatsapp"></i>
            <span>Konsultasi Custom</span>
          </a>
          <button
            class="cta-secondary"
            on:click={() => setActiveCategory("all")}
          >
            <i class="fas fa-th"></i>
            <span>Lihat Semua Produk</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick View Modal -->
  {#if showQuickView && selectedProduct}
    <div
      class="modal-overlay"
      on:click={closeQuickView}
      transition:fade={{ duration: 300 }}
    >
      <div
        class="quick-view-modal"
        on:click|stopPropagation
        transition:scale={{ duration: 400, easing: cubicOut }}
      >
        <button class="modal-close" on:click={closeQuickView}>
          <i class="fas fa-times"></i>
        </button>

        <div class="modal-content">
          <div class="modal-image">
            <img src={selectedProduct.image} alt={selectedProduct.title} />
            {#if selectedProduct.badge}
              <div class="modal-badge">{selectedProduct.badge}</div>
            {/if}
          </div>

          <div class="modal-info">
            <div class="modal-category">
              {categories.find((c) => c.id === selectedProduct!.category)?.icon}
              {categories.find((c) => c.id === selectedProduct!.category)?.name}
            </div>
            <h3>{selectedProduct!.title}</h3>
            <p>{selectedProduct!.description}</p>

            <div class="modal-features">
              <h4>✨ Keunggulan Produk:</h4>
              <ul>
                {#each selectedProduct.features as feature}
                  <li>✓ {feature}</li>
                {/each}
              </ul>
            </div>

            <div class="modal-price">
              <span class="current-price">{selectedProduct.price}</span>
              {#if selectedProduct.originalPrice}
                <span class="original-price"
                  >{selectedProduct.originalPrice}</span
                >
              {/if}
            </div>

            <div class="modal-actions">
              <a
                href={selectedProduct.whatsappLink}
                target="_blank"
                class="modal-cta-primary"
              >
                <i class="fab fa-whatsapp"></i>
                <span>Pesan via WhatsApp</span>
              </a>
              <button class="modal-cta-secondary" on:click={closeQuickView}>
                <i class="fas fa-shopping-cart"></i>
                <span>Tambah ke Keranjang</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .products-enhanced {
    padding: 6rem 2rem;
    background: linear-gradient(180deg, var(--bg-light) 0%, var(--white) 100%);
  }

  .products-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Section Header */
  .section-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .header-badge {
    display: inline-block;
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    padding: 0.5rem 1.2rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: clamp(2rem, 6vw, 3rem);
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--text-dark);
  }

  .title-accent {
    color: var(--primary);
    position: relative;
  }

  .title-accent::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--yellow);
    border-radius: 2px;
  }

  .section-subtitle {
    color: var(--text-light);
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Featured Carousel */
  .featured-carousel {
    margin-bottom: 4rem;
    background: var(--white);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
  }

  .carousel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .carousel-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-dark);
  }

  .carousel-controls {
    display: flex;
    gap: 0.5rem;
  }

  .carousel-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: var(--bg-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .carousel-btn:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.1);
  }

  .carousel-wrapper {
    overflow: hidden;
    border-radius: 16px;
  }

  .carousel-track {
    display: flex;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .featured-card {
    min-width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: center;
    padding: 2rem;
    background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
    color: white;
  }

  .featured-image {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
  }

  .featured-image img {
    width: 100%;
    height: 300px;
    object-fit: cover;
  }

  .featured-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: var(--yellow);
    color: var(--text-dark);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .featured-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .featured-card:hover .featured-overlay {
    opacity: 1;
  }

  .quick-view-btn {
    background: white;
    color: var(--text-dark);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .quick-view-btn:hover {
    transform: scale(1.05);
  }

  .featured-content h4 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .featured-category {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 15px;
    font-size: 0.9rem;
    display: inline-block;
    margin-bottom: 1rem;
  }

  .featured-price {
    margin-bottom: 2rem;
  }

  .current-price {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--yellow);
  }

  .original-price {
    text-decoration: line-through;
    opacity: 0.7;
    margin-left: 0.5rem;
  }

  .featured-cta {
    background: var(--yellow);
    color: var(--text-dark);
    text-decoration: none;
    padding: 1rem 2rem;
    border-radius: 25px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .featured-cta:hover {
    background: var(--yellow-dark);
    transform: translateY(-2px);
  }

  .carousel-indicators {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }

  .indicator {
    width: 12px;
    height: 12px;
    border: none;
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .indicator.active {
    background: var(--primary);
    transform: scale(1.2);
  }

  /* Category Filter */
  .category-filter {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 3rem;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--white);
    border: 2px solid transparent;
    color: var(--text-dark);
    padding: 0.75rem 1.5rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  }

  .filter-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .filter-btn.active {
    background: var(--category-color, var(--primary));
    color: white;
    transform: translateY(-3px);
  }

  .filter-icon {
    font-size: 1.2rem;
  }

  /* Products Grid */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }

  /* Tablet Styles */
  @media (max-width: 1024px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .featured-card {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      text-align: center;
    }

    .featured-image {
      order: 1;
    }

    .featured-content {
      order: 2;
    }

    .category-filter {
      gap: 0.75rem;
    }

    .filter-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
    }
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .products-enhanced {
      padding: 3rem 1rem;
    }

    .section-title {
      font-size: 2rem;
    }

    .products-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .featured-carousel {
      padding: 1.5rem;
      margin-bottom: 2rem;
      border-radius: 16px;
    }

    .carousel-header {
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .carousel-header h3 {
      font-size: 1.25rem;
      text-align: center;
    }

    .featured-card {
      padding: 1.5rem;
      border-radius: 16px;
    }

    .featured-content h4 {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .featured-price {
      margin-bottom: 1.5rem;
    }

    .current-price {
      font-size: 1.5rem;
    }

    .category-filter {
      justify-content: center;
      margin-bottom: 2rem;
    }

    .filter-btn {
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      flex: 1;
      min-width: 120px;
      max-width: 150px;
    }

    .filter-icon {
      font-size: 1rem;
    }

    .product-card-enhanced {
      border-radius: 16px;
    }

    .product-image {
      height: 220px;
    }

    .product-content {
      padding: 1.25rem;
    }

    .product-title {
      font-size: 1.125rem;
      margin-bottom: 0.5rem;
    }

    .product-description {
      font-size: 0.85rem;
      margin-bottom: 0.75rem;
    }

    .product-features {
      margin-bottom: 1rem;
    }

    .feature-tag {
      font-size: 0.7rem;
      padding: 0.25rem 0.6rem;
    }

    .product-price {
      margin-bottom: 1rem;
    }

    .price-current {
      font-size: 1.1rem;
    }

    .product-actions {
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-btn-primary,
    .action-btn-secondary {
      width: 100%;
      justify-content: center;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
    }

    /* CTA Section Mobile */
    .products-cta {
      text-align: center;
      padding: 2rem 1rem;
      border-radius: 16px;
    }

    .cta-title {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
    }

    .cta-description {
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .cta-buttons {
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }

    .cta-primary,
    .cta-secondary {
      width: 100%;
      justify-content: center;
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }

  /* Small Mobile Styles */
  @media (max-width: 480px) {
    .products-enhanced {
      padding: 2rem 0.75rem;
    }

    .section-title {
      font-size: 1.75rem;
    }

    .featured-carousel {
      padding: 1rem;
    }

    .featured-card {
      padding: 1rem;
    }

    .featured-content h4 {
      font-size: 1.25rem;
    }

    .current-price {
      font-size: 1.25rem;
    }

    .category-filter {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-btn {
      flex: 1;
      min-width: 100px;
      max-width: 140px;
      padding: 0.6rem 0.75rem;
      font-size: 0.8rem;
    }

    .product-content {
      padding: 1rem;
    }

    .product-title {
      font-size: 1rem;
    }

    .action-btn-primary,
    .action-btn-secondary {
      padding: 0.875rem 1rem;
      font-size: 0.85rem;
    }

    .header-badge {
      font-size: 0.8rem;
      padding: 0.4rem 1rem;
    }
  }

  .product-card-enhanced {
    background: var(--white);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .product-card-enhanced:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  }

  .product-image-container {
    position: relative;
    overflow: hidden;
  }

  .product-image {
    width: 100%;
    height: 250px;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .product-card-enhanced:hover .product-image {
    transform: scale(1.1);
  }

  .product-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--yellow);
    color: var(--text-dark);
    padding: 0.4rem 0.8rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    z-index: 2;
  }

  .product-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .product-card-enhanced:hover .product-overlay {
    opacity: 1;
  }

  .overlay-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 50px;
    height: 50px;
    background: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dark);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .action-btn:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.1);
  }

  .product-content {
    padding: 1.5rem;
  }

  .product-category {
    color: var(--primary);
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .product-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--text-dark);
  }

  .product-description {
    color: var(--text-light);
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .product-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .feature-tag {
    background: var(--bg-light);
    color: var(--text-dark);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .product-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .product-price .current-price {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--primary);
  }

  .product-price .original-price {
    text-decoration: line-through;
    color: var(--text-light);
    font-size: 0.9rem;
    margin-left: 0.5rem;
  }

  .product-cta {
    background: var(--primary);
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 15px;
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .product-cta:hover {
    background: var(--primary-dark);
    transform: scale(1.05);
  }

  /* CTA Section */
  .products-cta {
    background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
    border-radius: 20px;
    padding: 3rem 2rem;
    text-align: center;
    color: white;
  }

  .cta-content h3 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .cta-content p {
    opacity: 0.9;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }

  .cta-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .cta-primary,
  .cta-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    border-radius: 25px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }

  .cta-primary {
    background: var(--yellow);
    color: var(--text-dark);
  }

  .cta-primary:hover {
    background: var(--yellow-dark);
    transform: translateY(-3px);
  }

  .cta-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
  }

  .cta-secondary:hover {
    background: white;
    color: var(--primary);
  }

  /* Quick View Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .quick-view-modal {
    background: white;
    border-radius: 20px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
  }

  .modal-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
  }

  .modal-image {
    position: relative;
  }

  .modal-image img {
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 16px;
  }

  .modal-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: var(--yellow);
    color: var(--text-dark);
    padding: 0.5rem 1rem;
    border-radius: 15px;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .modal-info h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-dark);
  }

  .modal-category {
    color: var(--primary);
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .modal-features {
    margin: 1.5rem 0;
  }

  .modal-features h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-dark);
  }

  .modal-features ul {
    list-style: none;
    padding: 0;
  }

  .modal-features li {
    color: var(--text-light);
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }

  .modal-price {
    margin: 1.5rem 0;
  }

  .modal-price .current-price {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
  }

  .modal-cta-primary,
  .modal-cta-secondary {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }

  .modal-cta-primary {
    background: var(--primary);
    color: white;
  }

  .modal-cta-primary:hover {
    background: var(--primary-dark);
  }

  .modal-cta-secondary {
    background: var(--bg-light);
    color: var(--text-dark);
  }

  .modal-cta-secondary:hover {
    background: var(--yellow);
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .products-enhanced {
      padding: 4rem 1rem;
    }

    .featured-card {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .featured-image {
      order: 2;
    }

    .featured-content {
      order: 1;
    }

    .category-filter {
      gap: 0.5rem;
    }

    .filter-btn {
      font-size: 0.85rem;
      padding: 0.5rem 1rem;
    }

    .products-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }

    .modal-content {
      grid-template-columns: 1fr;
      padding: 1.5rem;
    }

    .modal-actions {
      flex-direction: column;
    }
  }
</style>
