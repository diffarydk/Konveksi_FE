<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { fade, fly } from "svelte/transition";
  import { createTooltip } from "@melt-ui/svelte";
  import {
    trackingService,
    type TrackingData,
    type TimelineItem,
    type ProgressInfo,
    type CurrentStage,
    type NextMilestone,
    type EnhancedTimelineItem,
  } from "$lib/services/tracking";

  let isScrolled = false;
  let isMobileMenuOpen = false;
  let orderCode = "";
  let orderData: TrackingData | null = null;
  let isLoading = false;
  let error = "";
  let autoRefreshInterval: number | null = null;

  const {
    elements: {
      trigger,
      content,
      overlay,
      portalled,
      title,
      description,
      close,
    },
    states: { open },
  } = createDialog();

  const {
    elements: { trigger: tooltipTrigger, content: tooltipContent },
    states: { open: tooltipOpen },
  } = createTooltip({
    positioning: {
      placement: "bottom",
    },
    openDelay: 200,
  });

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  async function checkOrderStatus() {
    if (!orderCode.trim()) {
      error = "Masukkan kode pesanan";
      return;
    }

    isLoading = true;
    error = "";

    try {
      const response = await trackingService.trackOrder(orderCode.trim());
      orderData = response.data;
      error = "";

      // Start auto-refresh when order data is successfully loaded
      if (autoRefreshInterval) {
        trackingService.stopAutoRefresh(autoRefreshInterval);
      }

      autoRefreshInterval = trackingService.startAutoRefresh(
        orderCode.trim(),
        (refreshedData) => {
          if (refreshedData.success) {
            orderData = refreshedData.data;
            console.log("📱 Timeline auto-refreshed");
          }
        },
        60000 // 60 seconds - respecting rate limits
      );
    } catch (err: any) {
      console.error("🚨 Tracking error:", err);

      // Enhanced error handling with troubleshooting
      if (err.status === 500) {
        error = `${err.error || "Server Error"}\n\n${err.detail || "Terjadi gangguan server"}`;

        if (err.troubleshooting && Array.isArray(err.troubleshooting)) {
          error +=
            "\n\nTroubleshooting:\n• " + err.troubleshooting.join("\n• ");
        }
      } else if (err.status === 404) {
        error =
          "Order tidak ditemukan. Pastikan kode order yang Anda masukkan benar.";
      } else if (err.status === 429) {
        error = "Terlalu banyak permintaan. Tunggu 1 menit lalu coba lagi.";
      } else if (err.status === 0) {
        error = "Koneksi bermasalah. Periksa internet Anda dan coba lagi.";
      } else {
        error =
          err.error || err.message || "Terjadi kesalahan. Silakan coba lagi.";

        if (err.detail) {
          error += `\n\nDetail: ${err.detail}`;
        }
      }

      orderData = null;
    } finally {
      isLoading = false;
    }
  }

  // Clean up auto-refresh when modal closes
  function resetTracking() {
    orderData = null;
    orderCode = "";
    displayProgress = 0;
    error = "";

    if (autoRefreshInterval) {
      trackingService.stopAutoRefresh(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }

  // Production status helper functions (now using production_status instead of status_order)
  function getProductionIcon(productionStatus: string): string {
    const iconMap: Record<string, string> = {
      menunggu: "fa-clock",
      diproses: "fa-cog",
      selesai: "fa-check-circle",
    };
    return iconMap[productionStatus] || "fa-clock";
  }

  function getProductionDescription(productionStatus: string): string {
    const descriptionMap: Record<string, string> = {
      menunggu:
        "Pesanan dalam antrian produksi dan akan segera dikerjakan oleh tim kami.",
      diproses:
        "Tim produksi sedang mengerjakan pesanan Anda dengan penuh perhatian.",
      selesai: "Proses produksi telah selesai dengan sempurna.",
    };
    return (
      descriptionMap[productionStatus] || "Status pengerjaan tidak diketahui."
    );
  }

  onMount(() => {
    function handleScroll() {
      isScrolled = window.scrollY > 50;
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  onDestroy(() => {
    // Clean up auto-refresh on component destroy
    if (autoRefreshInterval) {
      trackingService.stopAutoRefresh(autoRefreshInterval);
    }
  });

  // Animated counter for progress (enhanced with timeline progress)
  let displayProgress = 0;
  $: if (orderData) {
    // For lunas orders, payment progress should always be 100%
    let targetProgress;

    if (orderData.is_fully_paid && orderData.status_order === "lunas") {
      targetProgress = 100; // Force 100% for fully paid orders
    } else {
      // Use timeline progress if available, fallback to payment progress
      targetProgress =
        orderData.progress?.percentage ||
        trackingService.getPaymentProgress(orderData.payment_summary);
    }

    const interval = setInterval(() => {
      if (displayProgress < targetProgress) {
        displayProgress += 1;
      } else {
        clearInterval(interval);
      }
    }, 20);
  }

  // Enhanced progress calculation using new API data structure
  $: enhancedProgress = (() => {
    if (!orderData?.timeline) return 0;

    const timeline = orderData.timeline;
    const nonEstimatedItems = timeline.filter(
      (item: any) => !item.is_estimated
    );
    const completedItems = nonEstimatedItems.filter(
      (item: any) => item.status === "completed"
    );

    if (nonEstimatedItems.length === 0) return 0;

    const baseProgress = Math.round(
      (completedItems.length / nonEstimatedItems.length) * 100
    );

    // Enhanced calculation using payment progress as backup
    const paymentProgress = getPaymentProgress();

    return Math.max(baseProgress, paymentProgress);
  })();

  // Timeline items categorized by API documentation structure
  $: categorizedTimeline = (() => {
    if (!orderData?.timeline) return [];

    return orderData.timeline
      .map((item: any) => ({
        ...item,
        categoryIcon: getCategoryIcon(item.category),
        categoryColor: getCategoryColor(item.category),
        statusBadge: trackingService.getStatusBadgeClass(item.status),
        formattedTime: trackingService.formatDateShort(item.timestamp),
        estimatedText: item.is_estimated ? "(Estimasi)" : "",
        isEstimated: Boolean(item.is_estimated),
      }))
      .sort((a: any, b: any) => a.order - b.order);
  })();

  // Auto-refresh with rate limiting awareness (60s interval as per API docs)
  $: if ($open && orderData?.order_code) {
    if (autoRefreshInterval) {
      trackingService.stopAutoRefresh(autoRefreshInterval);
    }

    autoRefreshInterval = trackingService.startAutoRefresh(
      orderData.order_code,
      (updatedData) => {
        if (updatedData.success && updatedData.data) {
          orderData = updatedData.data;
          console.log("📱 Timeline auto-updated with API compliance");
        }
      },
      60000 // 60s interval to respect rate limiting (10 req/min)
    );
  }

  // Category icon mapping following API documentation
  function getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      order: "fas fa-shopping-cart", // 🟣 Purple - Order creation, confirmation
      payment: "fas fa-credit-card", // 🟢 Green - DP, pelunasan, invoice
      production: "fas fa-cog", // 🔵 Blue - Production status, pengerjaan
    };
    return iconMap[category] || "fas fa-info-circle";
  }

  // Category color mapping following API documentation
  function getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      order: "purple", // 🟣 Order (Purple) - Pesanan dibuat, konfirmasi
      payment: "green", // 🟢 Payment (Green) - Invoice, pembayaran DP/pelunasan
      production: "blue", // 🔵 Production (Blue) - Status pengerjaan/produksi
    };
    return colorMap[category] || "gray";
  }

  // Enhanced payment progress calculation
  function getPaymentProgress(): number {
    if (!orderData?.payment_summary) return 0;
    return trackingService.getPaymentProgress(orderData.payment_summary);
  }

  // Get timeline statistics for analytics
  $: timelineStats = (() => {
    if (!orderData) return null;
    return trackingService.getTimelineStats(orderData);
  })();

  // Enhanced estimation display
  function getEstimatedCompletion(): string | null {
    if (!orderData) return null;
    return trackingService.getEstimatedCompletion(orderData);
  }

  // Category display names for UI
  function getCategoryDisplayName(category: string): string {
    const displayMap: Record<string, string> = {
      order: "Pesanan",
      payment: "Pembayaran",
      production: "Produksi",
    };
    return displayMap[category] || category;
  }

  // Status icon for timeline items
  function getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      completed: "fas fa-check-circle",
      current: "fas fa-clock",
      pending: "fas fa-hourglass-half",
    };
    return statusIcons[status] || "fas fa-info-circle";
  }
</script>

{@html "<!--Navbar.svelte-->"}

<!-- Simplified Professional Navbar -->
<nav class="navbar" class:scrolled={isScrolled}>
  <div class="nav-container">
    <!-- Clean Logo -->
    <a href="/" class="logo">
      <div class="logo-wrapper">
        <img src="images/logo.jpg" alt="Hay Hill Clothing Logo" />
        <div class="logo-text">
          <span class="logo-hay-hill">Hay Hill</span>
          <span class="logo-clothing">Clothing</span>
        </div>
      </div>
    </a>

    <!-- Clean Navigation -->
    <ul class="nav-links" class:active={isMobileMenuOpen}>
      <li>
        <a href="#order-process" on:click={() => (isMobileMenuOpen = false)}
          >Cara Order</a
        >
      </li>
      <li>
        <a href="#products" on:click={() => (isMobileMenuOpen = false)}
          >Produk</a
        >
      </li>
      <li>
        <a href="#address" on:click={() => (isMobileMenuOpen = false)}>Alamat</a
        >
      </li>
      <li>
        <a href="#FAQ" on:click={() => (isMobileMenuOpen = false)}>FAQ</a>
      </li>

      <!-- Order Tracking Button -->
      <li>
        <button
          use:melt={$trigger}
          use:melt={$tooltipTrigger}
          class="nav-track-order"
        >
          <i class="fas fa-search"></i>
          <span>Cek Pesanan</span>
        </button>
      </li>

      <!-- CTA Button -->
      <li>
        <a href="#contact" class="nav-cta">
          <i class="fas fa-phone"></i>
          <span>Pesan Sekarang</span>
        </a>
      </li>

      <!-- Mobile Close Button -->
      {#if isMobileMenuOpen}
        <button
          class="nav-close"
          on:click={toggleMobileMenu}
          aria-label="Tutup menu"
        >
          <i class="fas fa-times"></i>
        </button>
      {/if}
    </ul>

    <!-- Mobile Toggle -->
    <button
      class="mobile-nav-toggle"
      class:active={isMobileMenuOpen}
      on:click={toggleMobileMenu}
      aria-label="Menu navigasi"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
  </div>
</nav>

<!-- Order Tracking Tooltip -->
<div
  use:melt={$tooltipContent}
  class="tooltip-content"
  transition:fade={{ duration: 100 }}
>
  <p>Cek status pesanan Anda dengan kode unik</p>
</div>

<!-- Enhanced Order Tracking Modal -->
<div use:melt={$portalled}>
  {#if $open}
    <div
      use:melt={$overlay}
      class="modal-overlay"
      transition:fade={{ duration: 200 }}
    />
    <div
      use:melt={$content}
      class="order-modal"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <button use:melt={$close} class="modal-close" on:click={resetTracking}>
        <i class="fas fa-times"></i>
      </button>

      {#if !orderData}
        <!-- Order Search Section -->
        <div class="search-section">
          <div class="search-header">
            <div class="search-icon">
              <i class="fas fa-search"></i>
            </div>
            <div class="search-text">
              <h2>Lacak Pesanan Anda</h2>
              <p>Masukkan kode pesanan untuk melihat status terkini</p>
            </div>
          </div>

          <div class="search-form">
            <div class="input-wrapper">
              <input
                type="text"
                placeholder="Masukkan kode pesanan (contoh: ORD-001-ALFR)"
                bind:value={orderCode}
                on:keypress={(e) => e.key === "Enter" && checkOrderStatus()}
                class:error
                disabled={isLoading}
                class="order-input"
              />
              <button
                on:click={checkOrderStatus}
                class="search-btn"
                disabled={isLoading || !orderCode.trim()}
              >
                {#if isLoading}
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Mencari...</span>
                {:else}
                  <i class="fas fa-search"></i>
                  <span>Lacak</span>
                {/if}
              </button>
            </div>

            {#if error}
              <div class="error-alert" transition:fade>
                <i class="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
              </div>
            {/if}

            <div class="search-help">
              <p>Kode pesanan dapat ditemukan di:</p>
              <div class="help-items">
                <div class="help-item">
                  <i class="fas fa-envelope"></i>
                  <span>Email konfirmasi</span>
                </div>
                <div class="help-item">
                  <i class="fab fa-whatsapp"></i>
                  <span>Pesan WhatsApp</span>
                </div>
                <div class="help-item">
                  <i class="fas fa-receipt"></i>
                  <span>Nota pemesanan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- Order Details Section -->
        <div class="order-details" transition:fade={{ duration: 400 }}>
          <!-- Header with Order Info -->
          <div class="order-header">
            <div class="order-meta">
              <div class="order-code">
                <i class="fas fa-hashtag"></i>
                <span>{orderData.order_code}</span>
              </div>
              <div class="order-customer">
                <i class="fas fa-user"></i>
                <span>{orderData.customer_name}</span>
              </div>
            </div>
            <button class="back-btn" on:click={resetTracking}>
              <i class="fas fa-arrow-left"></i>
              <span>Cari Lain</span>
            </button>
          </div>

          <!-- Status Card -->
          <div class="status-card">
            <div class="status-main">
              <div
                class="status-badge {trackingService.getStatusBadgeClass(
                  orderData.status_order
                )}"
              >
                <i
                  class="fas {orderData.is_fully_paid
                    ? 'fa-check-circle'
                    : 'fa-cog'}"
                ></i>
                <span>{orderData.order_status_display}</span>
              </div>
              <div class="status-details">
                <div class="progress-section">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      style="width: {displayProgress}%"
                    ></div>
                  </div>
                  <div class="progress-info">
                    <span class="progress-text">
                      {displayProgress}% {orderData.is_fully_paid
                        ? "lunas"
                        : "dibayar"}
                    </span>
                    <span class="payment-status">
                      <i
                        class="fas {orderData.is_fully_paid
                          ? 'fa-check-circle'
                          : 'fa-clock'}"
                      ></i>
                      {orderData.is_fully_paid ? "Lunas" : "Belum Lunas"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="payment-summary">
            <h3>
              <i class="fas fa-credit-card"></i>
              Ringkasan Pembayaran
            </h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">Total Pesanan</span>
                <span class="value"
                  >{trackingService.formatCurrency(
                    orderData.payment_summary.total_amount
                  )}</span
                >
              </div>
              <div class="summary-item">
                <span class="label">Sudah Dibayar</span>
                <span class="value success"
                  >{trackingService.formatCurrency(
                    orderData.payment_summary.amount_paid
                  )}</span
                >
              </div>
              <div class="summary-item">
                <span class="label">Sisa Pembayaran</span>
                <span
                  class="value {orderData.payment_summary.remaining_balance ===
                  '0'
                    ? 'success'
                    : 'warning'}"
                >
                  {trackingService.formatCurrency(
                    orderData.payment_summary.remaining_balance
                  )}
                </span>
              </div>
            </div>
          </div>

          <!-- Production Status -->
          <div class="production-status">
            <h3>
              <i class="fas fa-cog"></i>
              Status Pengerjaan
            </h3>
            <div class="production-card">
              <div class="production-main">
                <div
                  class="production-badge {trackingService.getStatusBadgeClass(
                    orderData.production_status || 'menunggu'
                  )}"
                >
                  <i
                    class="fas {getProductionIcon(
                      orderData.production_status || 'menunggu'
                    )}"
                  ></i>
                  <span
                    >{trackingService.getProductionStatusDisplay(
                      orderData.production_status || "menunggu"
                    )}</span
                  >
                </div>
                <div class="production-description">
                  {getProductionDescription(
                    orderData.production_status || "menunggu"
                  )}
                </div>
              </div>
              {#if !orderData.is_fully_paid || orderData.production_status === "menunggu"}
                <div class="production-note">
                  <i class="fas fa-info-circle"></i>
                  <span>
                    {#if !orderData.is_fully_paid}
                      Pengerjaan akan dimulai setelah pembayaran selesai
                    {:else if orderData.production_status === "menunggu"}
                      Pembayaran diterima, pesanan dalam antrian produksi
                    {/if}
                  </span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Invoices Section -->
          <div class="invoices-section">
            <h3>
              <i class="fas fa-file-invoice"></i>
              Invoice Pembayaran ({orderData.invoices.length})
            </h3>
            <div class="invoices-grid">
              {#each orderData.invoices as invoice, i}
                <div class="invoice-card" style="animation-delay: {i * 100}ms">
                  <div class="invoice-header">
                    <div class="invoice-code">
                      <i class="fas fa-receipt"></i>
                      <span>{invoice.invoice_code}</span>
                    </div>
                    <div
                      class="invoice-status {trackingService.getStatusBadgeClass(
                        invoice.invoice_status
                      )}"
                    >
                      <span>{invoice.status_display}</span>
                    </div>
                  </div>
                  <div class="invoice-details">
                    <div class="invoice-type">
                      <span class="label">Tipe Pembayaran:</span>
                      <span class="value">{invoice.invoice_type_display}</span>
                    </div>
                    <div class="invoice-amount">
                      <span class="label">Jumlah:</span>
                      <span class="value"
                        >{trackingService.formatCurrency(
                          invoice.invoice_amount
                        )}</span
                      >
                    </div>
                    {#if invoice.invoice_paid_at}
                      <div class="invoice-paid">
                        <span class="label">Dibayar pada:</span>
                        <span class="value"
                          >{trackingService.formatDate(
                            invoice.invoice_paid_at
                          )}</span
                        >
                      </div>
                    {/if}
                  </div>
                  {#if trackingService.shouldShowPaymentLink(invoice)}
                    <div class="invoice-actions">
                      <a
                        href={invoice.payment_link}
                        target="_blank"
                        class="payment-link-btn"
                      >
                        <i class="fas fa-external-link-alt"></i>
                        <span>Bayar Sekarang</span>
                      </a>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Enhanced Timeline -->
          <div class="timeline-section">
            <div class="timeline-header">
              <h3>
                <i class="fas fa-route"></i>
                Timeline Pesanan
              </h3>
              <div class="timeline-progress-info">
                <span class="milestone-counter">
                  <i class="fas fa-list-ul"></i>
                  {timelineStats?.completedMilestones || 0} / {timelineStats?.totalMilestones ||
                    0} tahap
                  {#if timelineStats?.estimatedMilestones && timelineStats.estimatedMilestones > 0}
                    <small class="estimated-note"
                      >+{timelineStats.estimatedMilestones} estimasi</small
                    >
                  {/if}
                </span>
                <span class="progress-percentage">
                  {enhancedProgress}% selesai
                </span>
              </div>

              <!-- Enhanced Progress Bar -->
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div
                    class="progress-fill shimmer"
                    style="width: {enhancedProgress}%"
                  ></div>
                </div>
              </div>

              <!-- Category Breakdown -->
              {#if timelineStats?.categoryCounts}
                <div class="category-breakdown">
                  {#each Object.entries(timelineStats.categoryCounts) as [category, count]}
                    <div class="category-item" class:has-items={count > 0}>
                      <i
                        class="{getCategoryIcon(
                          category
                        )} category-{getCategoryColor(category)}"
                      ></i>
                      <span class="category-label"
                        >{getCategoryDisplayName(category)}</span
                      >
                      <span class="category-count">{count}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Timeline Summary -->
            {#if orderData.progress}
              <div class="timeline-summary">
                <div class="summary-progress">
                  <div class="summary-progress-bar">
                    <div
                      class="summary-progress-fill"
                      style="width: {orderData.progress.percentage}%"
                    ></div>
                  </div>
                  <div class="summary-status">
                    <i
                      class="fas {orderData.progress.status === 'completed'
                        ? 'fa-check-circle'
                        : 'fa-hourglass-half'}"
                    ></i>
                    <span>
                      {orderData.progress.status === "completed"
                        ? "Pesanan Selesai"
                        : "Sedang Berlangsung"}
                    </span>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Support Section -->
          <div class="support-section">
            <div class="support-card">
              <div class="support-info">
                <h4>Butuh Bantuan?</h4>
                <p>
                  Hubungi customer service kami untuk informasi lebih lanjut
                </p>
              </div>
              <div class="support-actions">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  class="support-btn whatsapp"
                >
                  <i class="fab fa-whatsapp"></i>
                  <span>WhatsApp</span>
                </a>
                <a href="tel:+6281234567890" class="support-btn phone">
                  <i class="fas fa-phone"></i>
                  <span>Telepon</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Clean Professional Navbar */
  .navbar {
    position: fixed;
    top: 0;
    width: 100%;
    padding: 1rem 0;
    z-index: 1000;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .navbar.scrolled {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    padding: 0.8rem 0;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Logo Styles */
  .logo {
    text-decoration: none;
    transition: transform 0.3s ease;
  }

  .logo:hover {
    transform: scale(1.02);
  }

  .logo-wrapper {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .logo-wrapper img {
    height: 45px;
    width: 45px;
    object-fit: cover;
    border-radius: 8px;
    transition: all 0.3s ease;
    /* Optimize for different pixel densities */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  .navbar.scrolled .logo-wrapper img {
    height: 40px;
    width: 40px;
  }

  .logo-text {
    display: flex;
    gap: 0.3rem;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .logo-hay-hill {
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .logo-clothing {
    color: var(--yellow);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .navbar.scrolled .logo-hay-hill {
    color: var(--primary);
    text-shadow: none;
  }

  .navbar.scrolled .logo-clothing {
    color: var(--yellow);
    text-shadow: none;
  }

  /* Navigation Links */
  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
    align-items: center;
  }

  .nav-links a {
    text-decoration: none;
    color: var(--white);
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    padding: 0.5rem 0;
  }

  .navbar.scrolled .nav-links a {
    color: var(--text-dark);
    text-shadow: none;
  }

  .nav-links a::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--yellow);
    transition: width 0.3s ease;
  }

  .nav-links a:hover::after {
    width: 100%;
  }

  .navbar.scrolled .nav-links a::after {
    background: var(--primary);
  }

  /* Order Tracking Button */
  .nav-track-order {
    background: transparent;
    border: 2px solid var(--yellow);
    color: var(--yellow);
    padding: 0.6rem 1.2rem;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .navbar.scrolled .nav-track-order {
    border-color: var(--primary);
    color: var(--primary);
  }

  .nav-track-order:hover {
    background: var(--yellow);
    color: var(--text-dark);
    transform: translateY(-1px);
  }

  .navbar.scrolled .nav-track-order:hover {
    background: var(--primary);
    color: var(--white);
  }

  /* CTA Button */
  .nav-cta {
    padding: 0.6rem 1.5rem !important;
    background: var(--yellow) !important;
    color: var(--text-dark) !important;
    border-radius: 50px;
    transition: all 0.3s ease;
    text-shadow: none !important;
    font-weight: 600 !important;
    display: flex !important;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none !important;
    font-size: 0.9rem;
  }

  .nav-cta:hover {
    background: var(--yellow-dark) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(248, 225, 27, 0.3);
  }

  .nav-cta::after {
    display: none !important;
  }

  /* Mobile Navigation */
  .mobile-nav-toggle {
    display: none;
    background: transparent;
    border: none;
    width: 40px;
    height: 40px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 0;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .mobile-nav-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .navbar.scrolled .mobile-nav-toggle:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .hamburger-line {
    width: 22px;
    height: 2px;
    background: var(--white);
    border-radius: 2px;
    transition: all 0.3s ease;
    transform-origin: center;
  }

  .navbar.scrolled .hamburger-line {
    background: var(--text-dark);
  }

  .mobile-nav-toggle.active .hamburger-line:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }

  .mobile-nav-toggle.active .hamburger-line:nth-child(2) {
    opacity: 0;
    transform: scale(0);
  }

  .mobile-nav-toggle.active .hamburger-line:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }

  /* Tooltip */
  .tooltip-content {
    background: var(--text-dark);
    color: var(--white);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1001;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 1002;
  }

  .order-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: var(--white);
    border-radius: 20px;
    width: 95%;
    max-width: 700px;
    max-height: 95vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    z-index: 1003;
    font-family: inherit;
  }

  .modal-close {
    position: absolute;
    right: 1rem;
    top: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    font-size: 1.2rem;
    color: var(--text-light);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    z-index: 10;
  }

  .modal-close:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    transform: scale(1.1);
  }

  /* Search Section */
  .search-section {
    padding: 2rem;
  }

  .search-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .search-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--primary), #1e40af);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .search-text h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-dark);
  }

  .search-text p {
    margin: 0;
    color: var(--text-light);
    font-size: 1rem;
  }

  .search-form {
    space-y: 1.5rem;
  }

  .input-wrapper {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .order-input {
    flex: 1;
    padding: 1rem 1.2rem;
    border: 2px solid var(--bg-light);
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: var(--white);
  }

  .order-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .order-input.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .search-btn {
    padding: 1rem 1.5rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .search-btn:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }

  .search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .error-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    color: #ef4444;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .search-help {
    background: var(--bg-light);
    padding: 1.5rem;
    border-radius: 12px;
    margin-top: 1rem;
  }

  .search-help p {
    margin: 0 0 1rem 0;
    font-weight: 600;
    color: var(--text-dark);
  }

  .help-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.8rem;
  }

  .help-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem;
    background: white;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .help-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .help-item i {
    color: var(--primary);
    font-size: 1.1rem;
  }

  .help-item span {
    font-size: 0.9rem;
    color: var(--text-dark);
  }

  /* Order Details Section */
  .order-details {
    padding: 2rem;
    animation: slideInUp 0.4s ease;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .order-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .order-code,
  .order-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .order-code {
    font-weight: 700;
    color: var(--text-dark);
  }

  .order-code i {
    color: var(--primary);
  }

  .order-date {
    color: var(--text-light);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: transparent;
    border: 1px solid var(--text-light);
    color: var(--text-dark);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }

  .back-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: rgba(37, 99, 235, 0.05);
  }

  /* Status Card */
  .status-card {
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.05),
      rgba(248, 225, 27, 0.05)
    );
    border: 1px solid rgba(37, 99, 235, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .status-badge.in-progress {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    border: 1px solid rgba(37, 99, 235, 0.2);
  }

  .progress-section {
    margin-top: 1rem;
  }

  .progress-bar {
    width: 100%;
    height: 12px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 0.8rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--yellow));
    border-radius: 6px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .progress-text {
    font-weight: 600;
    color: var(--text-dark);
    font-size: 0.9rem;
  }

  .estimated-date {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--text-light);
    font-size: 0.85rem;
  }

  /* Section Headers */
  .payment-summary h3,
  .production-status h3,
  .invoices-section h3,
  .timeline-section h3,
  .support-section h3 {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-dark);
  }

  .payment-summary h3 i,
  .production-status h3 i,
  .invoices-section h3 i,
  .timeline-section h3 i,
  .support-section h3 i {
    color: var(--primary);
    font-size: 1rem;
  }

  /* Payment Summary */
  .payment-summary {
    margin-bottom: 1.5rem;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 1rem;
    background: var(--bg-light);
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .summary-item .label {
    font-size: 0.85rem;
    color: var(--text-light);
    font-weight: 500;
  }

  .summary-item .value {
    font-size: 1rem;
    color: var(--text-dark);
    font-weight: 600;
  }

  .summary-item .value.success {
    color: #10b981;
  }

  .summary-item .value.warning {
    color: #f59e0b;
  }

  /* Production Status */
  .production-status {
    margin-bottom: 1.5rem;
  }

  .production-card {
    background: linear-gradient(
      135deg,
      rgba(16, 185, 129, 0.05),
      rgba(37, 99, 235, 0.05)
    );
    border: 1px solid rgba(16, 185, 129, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
  }

  .production-main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .production-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.9rem;
    width: fit-content;
  }

  .production-badge.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .production-badge.warning {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .production-badge.primary {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    border: 1px solid rgba(37, 99, 235, 0.2);
  }

  .production-badge.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .production-badge.info {
    background: rgba(14, 165, 233, 0.1);
    color: #0ea5e9;
    border: 1px solid rgba(14, 165, 233, 0.2);
  }

  .production-description {
    color: var(--text-light);
    line-height: 1.6;
    font-size: 0.9rem;
    background: rgba(255, 255, 255, 0.5);
    padding: 1rem;
    border-radius: 10px;
    border-left: 3px solid #10b981;
  }

  .production-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.8rem 1rem;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 8px;
    color: #f59e0b;
    font-size: 0.85rem;
  }

  .production-note i {
    font-size: 0.9rem;
  }

  /* Invoices Section */
  .invoices-section {
    margin-bottom: 1.5rem;
  }

  .invoices-grid {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .invoice-card {
    background: var(--white);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.3s ease;
    animation: slideInLeft 0.4s ease both;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .invoice-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.8rem;
  }

  .invoice-code {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  .invoice-code i {
    color: var(--primary);
  }

  .invoice-status {
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .invoice-status.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .invoice-status.warning {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .invoice-status.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .invoice-status.primary {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
  }

  .invoice-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
  }

  .invoice-type,
  .invoice-amount,
  .invoice-paid {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .invoice-details .label {
    font-size: 0.85rem;
    color: var(--text-light);
  }

  .invoice-details .value {
    font-size: 0.9rem;
    color: var(--text-dark);
    font-weight: 600;
  }

  .invoice-actions {
    display: flex;
    justify-content: flex-end;
  }

  .payment-link-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: var(--primary);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .payment-link-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }

  /* Timeline Section */
  .timeline-section {
    margin-bottom: 1.5rem;
  }

  .timeline-list {
    position: relative;
    padding-left: 1.5rem;
  }

  .timeline-list::before {
    content: "";
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(
      to bottom,
      #10b981,
      #f59e0b,
      var(--primary),
      rgba(37, 99, 235, 0.2)
    );
    border-radius: 2px;
  }

  .timeline-item {
    position: relative;
    margin-bottom: 1.5rem;
    padding-left: 2rem;
    animation: slideInRight 0.4s ease both;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .timeline-marker {
    position: absolute;
    left: -2rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    border: 3px solid;
    background: var(--white);
    position: relative;
  }

  .timeline-type-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    color: white;
    border: 2px solid white;
  }

  .timeline-type-badge.payment {
    background: #10b981;
  }

  .timeline-type-badge.production {
    background: #f59e0b;
  }

  .timeline-item.completed .timeline-marker {
    color: white;
  }

  .timeline-item.pending .timeline-marker {
    background: white;
    color: rgba(0, 0, 0, 0.5);
  }

  .timeline-marker.success {
    background: #10b981;
    border-color: #10b981;
  }

  .timeline-marker.warning {
    background: #f59e0b;
    border-color: #f59e0b;
  }

  .timeline-marker.primary {
    background: var(--primary);
    border-color: var(--primary);
  }

  .timeline-marker.info {
    background: #0ea5e9;
    border-color: #0ea5e9;
  }

  .timeline-marker.danger {
    background: #ef4444;
    border-color: #ef4444;
  }

  .timeline-content {
    background: var(--bg-light);
    padding: 1rem;
    border-radius: 10px;
    border-left: 3px solid;
  }

  .timeline-item.completed .timeline-content {
    border-left-color: var(--primary);
  }

  .timeline-item.pending .timeline-content {
    border-left-color: rgba(37, 99, 235, 0.3);
  }

  .timeline-event {
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 0.3rem;
    font-size: 0.95rem;
  }

  .timeline-description {
    font-size: 0.9rem;
    color: var(--text-light);
    margin-bottom: 0.3rem;
    line-height: 1.4;
  }

  .timeline-date {
    font-size: 0.85rem;
    color: var(--text-light);
  }

  .timeline-category {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.4rem 0.8rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    width: fit-content;
  }

  .timeline-category i {
    font-size: 0.7rem;
    color: var(--primary);
  }

  .timeline-category span {
    color: var(--text-dark);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Timeline content variations */
  .timeline-content.success {
    border-left-color: #10b981;
  }

  .timeline-content.warning {
    border-left-color: #f59e0b;
  }

  .timeline-content.primary {
    border-left-color: var(--primary);
  }

  .timeline-content.info {
    border-left-color: #0ea5e9;
  }

  .timeline-content.danger {
    border-left-color: #ef4444;
  }

  /* Timeline item type styling */
  .timeline-item.payment {
    opacity: 1;
  }

  .timeline-item.production {
    opacity: 1;
  }

  .timeline-item.pending {
    opacity: 0.7;
  }

  /* Enhanced Timeline Styles */
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .timeline-progress-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: rgba(37, 99, 235, 0.05);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid rgba(37, 99, 235, 0.1);
    margin-bottom: 1rem;
  }

  .milestone-counter {
    font-size: 0.85rem;
    color: var(--text-light);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .milestone-counter i {
    color: var(--primary);
  }

  .estimated-note {
    color: #f59e0b;
    font-size: 0.75rem;
    margin-left: 0.5rem;
    font-weight: 500;
  }

  .progress-percentage {
    font-size: 0.9rem;
    color: var(--primary);
    font-weight: 700;
  }

  /* Enhanced Progress Bar */
  .progress-bar-container {
    margin-bottom: 1rem;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), #10b981);
    border-radius: 4px;
    transition: width 0.6s ease-in-out;
    position: relative;
  }

  .progress-fill.shimmer::after {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  /* Category Breakdown */
  .category-breakdown {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .category-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    opacity: 0.6;
  }

  .category-item.has-items {
    opacity: 1;
    border-color: #cbd5e1;
  }

  .category-item i {
    font-size: 0.875rem;
    width: 16px;
    text-align: center;
  }

  .category-item i.category-purple {
    color: #8b5cf6;
  }
  .category-item i.category-green {
    color: #10b981;
  }
  .category-item i.category-blue {
    color: #3b82f6;
  }
  .category-item i.category-orange {
    color: #f59e0b;
  }

  .category-label {
    font-size: 0.75rem;
    color: var(--text-light);
    flex-grow: 1;
  }

  .category-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-dark);
    background: white;
    padding: 0.125rem 0.375rem;
    border-radius: 12px;
    min-width: 20px;
    text-align: center;
  }

  /* Timeline Summary */
  .timeline-summary {
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.05),
      rgba(248, 225, 27, 0.05)
    );
    border: 1px solid rgba(37, 99, 235, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  .summary-progress {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .summary-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 4px;
    overflow: hidden;
  }

  .summary-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), #10b981);
    border-radius: 4px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .summary-progress-fill::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 70%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .summary-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  .summary-status i {
    color: #10b981;
    font-size: 1.1rem;
  }

  /* Notes Section */
  .notes-section {
    margin-bottom: 1.5rem;
  }

  .notes-card {
    background: rgba(248, 225, 27, 0.1);
    border: 1px solid rgba(248, 225, 27, 0.2);
    border-radius: 12px;
    padding: 1.2rem;
  }

  .notes-card p {
    margin: 0;
    color: var(--text-dark);
    line-height: 1.5;
    font-style: italic;
  }

  /* Support Section */
  .support-section {
    margin-top: 1.5rem;
  }

  .support-card {
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.05),
      rgba(16, 185, 129, 0.05)
    );
    border: 1px solid rgba(37, 99, 235, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .support-info h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-dark);
  }

  .support-info p {
    margin: 0;
    color: var(--text-light);
    font-size: 0.9rem;
  }

  .support-actions {
    display: flex;
    gap: 0.8rem;
  }

  .support-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.2rem;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .support-btn.whatsapp {
    background: #25d366;
    color: white;
  }

  .support-btn.whatsapp:hover {
    background: #128c7e;
    transform: translateY(-2px);
  }

  .support-btn.phone {
    background: var(--primary);
    color: white;
  }

  .support-btn.phone:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
  }

  /* Mobile Navigation Styles */
  @media (max-width: 1024px) {
    .mobile-nav-toggle {
      display: flex;
    }

    .nav-links {
      position: fixed;
      top: 0;
      right: 0;
      width: 75%;
      height: 100vh;
      background: var(--white);
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      padding: 5rem 2rem 2rem;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(20px);
      gap: 0;
    }

    .nav-links.active {
      transform: translateX(0);
    }

    .nav-links li {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .nav-links a {
      display: block;
      width: 100%;
      padding: 1rem 1.5rem;
      color: var(--text-dark) !important;
      text-shadow: none !important;
      border-radius: 12px;
      transition: all 0.3s ease;
      font-size: 1rem;
      font-weight: 500;
    }

    .nav-links a:hover {
      background: var(--bg-light);
      color: var(--primary) !important;
    }

    .nav-links a::after {
      display: none;
    }

    .nav-track-order,
    .nav-cta {
      width: 100%;
      justify-content: center;
      padding: 1rem 1.5rem !important;
      margin: 0.5rem 0;
      font-size: 1rem !important;
    }

    .nav-track-order {
      background: transparent !important;
      border: 2px solid var(--primary) !important;
      color: var(--primary) !important;
    }

    .nav-track-order:hover {
      background: var(--primary) !important;
      color: var(--white) !important;
    }

    .nav-cta {
      background: var(--yellow) !important;
      color: var(--text-dark) !important;
      border: 2px solid var(--yellow) !important;
    }

    .nav-cta:hover {
      background: var(--yellow-dark) !important;
    }

    .nav-close {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-dark);
      font-size: 1.2rem;
      transition: all 0.3s ease;
    }

    .nav-close:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      transform: scale(1.1);
    }
  }

  /* Mobile Responsiveness */
  @media (max-width: 768px) {
    .nav-container {
      padding: 0 1rem;
    }

    .nav-links {
      width: 85%;
      padding: 4rem 1.5rem 2rem;
    }

    .order-modal {
      width: 98%;
      max-height: 98vh;
      border-radius: 16px;
    }

    .search-section,
    .order-details {
      padding: 1.5rem;
    }

    .search-header {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .search-icon {
      align-self: center;
    }

    .search-text h2 {
      font-size: 1.5rem;
    }

    .input-wrapper {
      flex-direction: column;
      gap: 0.8rem;
    }

    .search-btn {
      justify-content: center;
    }

    .help-items {
      grid-template-columns: 1fr;
    }

    .order-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .back-btn {
      align-self: stretch;
      justify-content: center;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .invoice-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.8rem;
    }

    .support-card {
      flex-direction: column;
      text-align: center;
    }

    .support-actions {
      width: 100%;
      justify-content: center;
    }

    .support-btn {
      flex: 1;
      justify-content: center;
    }

    .modal-close {
      right: 0.8rem;
      top: 0.8rem;
    }

    /* Enhanced Timeline Mobile */
    .timeline-header {
      flex-direction: column;
      align-items: stretch;
      gap: 0.8rem;
    }

    .timeline-progress-info {
      justify-content: center;
      gap: 0.5rem;
    }

    .timeline-summary {
      padding: 1rem;
    }
  }

  @media (max-width: 480px) {
    .order-modal {
      width: 100%;
      height: 100%;
      max-height: 100vh;
      border-radius: 0;
      top: 0;
      left: 0;
      transform: none;
    }

    .search-section,
    .order-details {
      padding: 1rem;
    }

    .search-text h2 {
      font-size: 1.3rem;
    }

    .support-actions {
      flex-direction: column;
    }
  }

  /* Tablet Styles */
  @media (max-width: 1024px) and (min-width: 769px) {
    .nav-links {
      gap: 1.5rem;
    }

    .nav-container {
      padding: 0 1.5rem;
    }
  }
</style>
