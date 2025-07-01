<!-- src/lib/components/admin/Sidebar.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { sidebar as sidebarStore, theme } from "$lib/stores/ui";
  import { slide, fade } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { onMount, afterUpdate } from "svelte";

  // Define the active prop with proper type
  export let active: string = "";

  // Define menu item type
  interface MenuItem {
    id: string;
    icon: string;
    label: string;
    path: string;
    badge?: {
      count: number | string;
      type: "success" | "error" | "warning";
    } | null;
  }

  // Collapsible state for menu sections
  let expandedSections = {
    main: true,
    orders: true,
    website: true,
    business: true,
    settings: true,
  };

  // Toggle collapsed state from store
  $: isCollapsed = $sidebarStore.collapsed;
  let isMobile = false;

  function toggleCollapse() {
    sidebarStore.toggleCollapse();
  }

  // Toggle section
  function toggleSection(section: keyof typeof expandedSections) {
    expandedSections[section] = !expandedSections[section];
  }

  // Menu sections with nested items
  const mainMenu: MenuItem[] = [
    {
      id: "dashboard",
      icon: "fas fa-tachometer-alt",
      label: "Dashboard",
      path: "/admin",
      badge: null,
    },
  ];

  const ordersMenu: MenuItem[] = [
    {
      id: "orders-create",
      icon: "fas fa-plus-circle",
      label: "Buat Pesanan",
      path: "/admin/orders/create",
      badge: null,
    },
    {
      id: "orders-all",
      icon: "fas fa-shopping-cart",
      label: "Semua Pesanan",
      path: "/admin/orders",
      badge: null,
    },
    {
      id: "orders-pending",
      icon: "fas fa-hourglass-half",
      label: "Menunggu Pembayaran",
      path: "/admin/orders/pending",
      badge: {
        count: 5,
        type: "error",
      },
    },
    {
      id: "orders-production",
      icon: "fas fa-industry",
      label: "Dalam Produksi",
      path: "/admin/orders/production",
      badge: {
        count: 8,
        type: "warning",
      },
    },
    {
      id: "orders-completed",
      icon: "fas fa-check-circle",
      label: "Selesai",
      path: "/admin/orders/completed",
      badge: null,
    },
  ];

  const websiteMenu: MenuItem[] = [
    {
      id: "products",
      icon: "fas fa-tshirt",
      label: "Katalog Produk",
      path: "/admin/products",
      badge: null,
    },

    {
      id: "testimonials",
      icon: "fas fa-comment-dots",
      label: "Testimoni",
      path: "/admin/testimonials",
    },
  ];

  const businessMenu: MenuItem[] = [
    {
      id: "invoices",
      icon: "fas fa-file-invoice",
      label: "Invoice",
      path: "/admin/invoices",
      badge: null,
    },
    {
      id: "analytics",
      icon: "fas fa-chart-line",
      label: "Analitik",
      path: "/admin/analytics",
      badge: null,
    },
    {
      id: "whatsapp",
      icon: "fab fa-whatsapp",
      label: "Template WhatsApp",
      path: "/admin/whatsapp-templates",
    },
  ];

  // Settings menu
  const settingsMenu: MenuItem[] = [
    {
      id: "settings",
      icon: "fas fa-cog",
      label: "Pengaturan Sistem",
      path: "/admin/settings",
      badge: null,
    },
  ];

  // Close sidebar on mobile when navigating
  function handleNavigation() {
    if (isMobile) {
      sidebarStore.update((state) => ({ ...state, visible: false }));
    }
  }

  // Swipe gesture support for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwipeGesture = false;

  function handleTouchStart(event: TouchEvent) {
    if (!isMobile || !$sidebarStore.visible) return;

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isSwipeGesture = false;
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isMobile || !$sidebarStore.visible) return;

    const touchCurrentX = event.touches[0].clientX;
    const touchCurrentY = event.touches[0].clientY;
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    // Check if it's a horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      isSwipeGesture = true;

      // Swipe left to close sidebar
      if (deltaX < -100) {
        sidebarStore.update((state) => ({ ...state, visible: false }));
      }
    }
  }

  function handleTouchEnd() {
    touchStartX = 0;
    touchStartY = 0;
    isSwipeGesture = false;
  }

  // Keyboard navigation support
  function handleKeydown(event: KeyboardEvent) {
    if (isMobile && $sidebarStore.visible) {
      if (event.key === "Escape") {
        event.preventDefault();
        sidebarStore.update((state) => ({ ...state, visible: false }));
      }
    }
  }

  onMount(() => {
    // Add keyboard event listener
    if (browser) {
      window.addEventListener("keydown", handleKeydown);
    }

    return () => {
      if (browser) {
        window.removeEventListener("keydown", handleKeydown);
      }
    };
  });

  // Improved isActive function with exact path matching
  function isActive(path: string): boolean {
    // Use prop active if set, if not use $page.url.pathname
    const currentPath = active || $page.url.pathname;

    // Exact match for dashboard
    if (path === "/admin" && currentPath === "/admin") {
      return true;
    }

    // Exact match for specific pages to avoid conflicts
    if (path === currentPath) {
      return true;
    }

    // Special handling for orders submenu to prevent conflicts
    if (path === "/admin/orders" && currentPath === "/admin/orders") {
      return true; // Only exact match for orders list
    }

    // For other paths that are not exact matches, use startsWith but with restrictions
    if (path !== "/admin" && path !== "/admin/orders") {
      return currentPath.startsWith(path);
    }

    return false;
  }

  // Detect screen size and set isMobile
  function checkScreenSize() {
    isMobile = window.innerWidth < 1024;
    if (isMobile && isCollapsed) {
      sidebarStore.update((state) => ({ ...state, collapsed: false }));
    }
  }

  onMount(() => {
    // Check initial screen size
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Initialize CSS variables based on store state
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "var(--sidebar-collapsed-width)" : "280px"
    );
    document.documentElement.style.setProperty(
      "--header-margin-left",
      isCollapsed ? "var(--sidebar-collapsed-width)" : "280px"
    );

    // Clean up
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  });
</script>

<aside
  class="sidebar"
  class:active={$sidebarStore.visible}
  class:collapsed={isCollapsed}
  class:mobile={isMobile}
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
>
  <div
    class="sidebar-header"
    class:collapsed={isCollapsed}
    class:mobile={isMobile}
  >
    <a href="/admin" class="logo" on:click={handleNavigation}>
      {#if !isCollapsed}
        <div class="logo-content">
          <span class="logo-text">Hay Hill Clothing</span>
          <span class="logo-subtitle">Admin Panel</span>
        </div>
      {:else}
        <span class="logo-icon">H</span>
      {/if}
    </a>

    <!-- Close button for mobile -->
    {#if isMobile}
      <button
        class="mobile-close-btn"
        on:click={() =>
          sidebarStore.update((state) => ({ ...state, visible: false }))}
        aria-label="Tutup menu"
        title="Tutup menu"
      >
        <i class="fas fa-times"></i>
      </button>
    {:else}
      <!-- Collapse button for desktop -->
      <button
        class="collapse-toggle"
        on:click={toggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <i class={isCollapsed ? "fas fa-angle-right" : "fas fa-angle-left"}></i>
      </button>
    {/if}
  </div>

  <nav class="sidebar-menu">
    <!-- Main Menu Section -->
    <div class="menu-section">
      <div
        class="menu-header"
        on:click={() => !isCollapsed && toggleSection("main")}
        class:clickable={!isCollapsed}
      >
        {#if !isCollapsed}
          <span class="menu-title">Menu Utama</span>
          <i
            class={`fas fa-chevron-${expandedSections.main ? "down" : "right"}`}
          ></i>
        {:else}
          <div class="section-divider"></div>
        {/if}
      </div>

      {#if expandedSections.main || isCollapsed}
        <div class="menu-items" class:collapsed={isCollapsed}>
          {#each mainMenu as item}
            <a
              href={item.path}
              class="menu-item"
              class:active={isActive(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
              title={isCollapsed ? item.label : null}
              on:click={handleNavigation}
            >
              <div class="menu-icon">
                <i class={item.icon}></i>
              </div>

              {#if !isCollapsed}
                <div class="menu-content">
                  <span class="menu-label">{item.label}</span>
                </div>

                {#if item.badge}
                  <span class="menu-badge {item.badge.type}">
                    {item.badge.count}
                  </span>
                {/if}
              {:else if item.badge}
                <span
                  class="menu-badge-collapsed {item.badge.type}"
                  title={`${item.badge.count}`}
                ></span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Orders Section -->
    <div class="menu-section">
      <div
        class="menu-header"
        on:click={() => !isCollapsed && toggleSection("orders")}
        class:clickable={!isCollapsed}
      >
        {#if !isCollapsed}
          <span class="menu-title">Manajemen Pesanan</span>
          <i
            class={`fas fa-chevron-${expandedSections.orders ? "down" : "right"}`}
          ></i>
        {:else}
          <div class="section-divider"></div>
        {/if}
      </div>

      {#if expandedSections.orders || isCollapsed}
        <div class="menu-items" class:collapsed={isCollapsed}>
          {#each ordersMenu as item}
            <a
              href={item.path}
              class="menu-item"
              class:active={isActive(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
              title={isCollapsed ? item.label : null}
              on:click={handleNavigation}
            >
              <div class="menu-icon">
                <i class={item.icon}></i>
              </div>

              {#if !isCollapsed}
                <div class="menu-content">
                  <span class="menu-label">{item.label}</span>
                </div>

                {#if item.badge}
                  <span class="menu-badge {item.badge.type}">
                    {item.badge.count}
                  </span>
                {/if}
              {:else if item.badge}
                <span
                  class="menu-badge-collapsed {item.badge.type}"
                  title={`${item.badge.count}`}
                ></span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Website Content Section -->
    <div class="menu-section">
      <div
        class="menu-header"
        on:click={() => !isCollapsed && toggleSection("website")}
        class:clickable={!isCollapsed}
      >
        {#if !isCollapsed}
          <span class="menu-title">Konten Website</span>
          <i
            class={`fas fa-chevron-${expandedSections.website ? "down" : "right"}`}
          ></i>
        {:else}
          <div class="section-divider"></div>
        {/if}
      </div>

      {#if expandedSections.website || isCollapsed}
        <div class="menu-items" class:collapsed={isCollapsed}>
          {#each websiteMenu as item}
            <a
              href={item.path}
              class="menu-item"
              class:active={isActive(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
              title={isCollapsed ? item.label : null}
              on:click={handleNavigation}
            >
              <div class="menu-icon">
                <i class={item.icon}></i>
              </div>

              {#if !isCollapsed}
                <div class="menu-content">
                  <span class="menu-label">{item.label}</span>
                </div>

                {#if item.badge}
                  <span class="menu-badge {item.badge.type}">
                    {item.badge.count}
                  </span>
                {/if}
              {:else if item.badge}
                <span
                  class="menu-badge-collapsed {item.badge.type}"
                  title={`${item.badge.count}`}
                ></span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Business Section -->
    <div class="menu-section">
      <div
        class="menu-header"
        on:click={() => !isCollapsed && toggleSection("business")}
        class:clickable={!isCollapsed}
      >
        {#if !isCollapsed}
          <span class="menu-title">Manajemen Bisnis</span>
          <i
            class={`fas fa-chevron-${expandedSections.business ? "down" : "right"}`}
          ></i>
        {:else}
          <div class="section-divider"></div>
        {/if}
      </div>

      {#if expandedSections.business || isCollapsed}
        <div class="menu-items" class:collapsed={isCollapsed}>
          {#each businessMenu as item}
            <a
              href={item.path}
              class="menu-item"
              class:active={isActive(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
              title={isCollapsed ? item.label : null}
              on:click={handleNavigation}
            >
              <div class="menu-icon">
                <i class={item.icon}></i>
              </div>

              {#if !isCollapsed}
                <div class="menu-content">
                  <span class="menu-label">{item.label}</span>
                </div>

                {#if item.badge}
                  <span class="menu-badge {item.badge.type}">
                    {item.badge.count}
                  </span>
                {/if}
              {:else if item.badge}
                <span
                  class="menu-badge-collapsed {item.badge.type}"
                  title={`${item.badge.count}`}
                ></span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Settings Section -->
    <div class="menu-section">
      <div
        class="menu-header"
        on:click={() => !isCollapsed && toggleSection("settings")}
        class:clickable={!isCollapsed}
      >
        {#if !isCollapsed}
          <span class="menu-title">Pengaturan</span>
          <i
            class={`fas fa-chevron-${expandedSections.settings ? "down" : "right"}`}
          ></i>
        {:else}
          <div class="section-divider"></div>
        {/if}
      </div>

      {#if expandedSections.settings || isCollapsed}
        <div class="menu-items" class:collapsed={isCollapsed}>
          {#each settingsMenu as item}
            <a
              href={item.path}
              class="menu-item"
              class:active={isActive(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
              title={isCollapsed ? item.label : null}
              on:click={handleNavigation}
            >
              <div class="menu-icon">
                <i class={item.icon}></i>
              </div>

              {#if !isCollapsed}
                <div class="menu-content">
                  <span class="menu-label">{item.label}</span>
                </div>

                {#if item.badge}
                  <span class="menu-badge {item.badge.type}">
                    {item.badge.count}
                  </span>
                {/if}
              {:else if item.badge}
                <span
                  class="menu-badge-collapsed {item.badge.type}"
                  title={`${item.badge.count}`}
                ></span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </nav>

  <!-- Mobile Overlay with improved transitions -->
  {#if $sidebarStore.visible && isMobile}
    <div
      class="sidebar-overlay"
      on:click={() =>
        sidebarStore.update((state) => ({ ...state, visible: false }))}
      on:touchstart={() =>
        sidebarStore.update((state) => ({ ...state, visible: false }))}
      transition:fade={{ duration: 200 }}
      role="button"
      tabindex="0"
      aria-label="Tutup menu"
    ></div>
  {/if}
</aside>

<style>
  /* Sidebar */
  .sidebar {
    width: var(--sidebar-width, 280px);
    background: white;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 100;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 2px 0 15px -3px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    color: #1e293b;
    border-right: 1px solid #e5e7eb;
    will-change: transform;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width, 80px);
  }

  .sidebar.mobile {
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .sidebar.mobile.active {
    transform: translateX(0);
    box-shadow: 4px 0 25px -5px rgba(0, 0, 0, 0.3);
  }

  /* Prevent body scroll when sidebar is open on mobile */
  .sidebar.mobile.active ~ :global(body) {
    overflow: hidden;
    position: fixed;
    width: 100%;
  }

  .sidebar-header {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #2563eb, #1e40af);
    color: white;
    min-height: 70px; /* Match header height */
    transition: padding 0.3s ease;
  }

  .sidebar-header.collapsed {
    padding: 1.5rem 1rem;
    justify-content: center;
  }

  .logo {
    text-decoration: none;
    color: white;
    font-weight: 700;
    transition: all 0.3s;
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .logo-content {
    display: flex;
    flex-direction: column;
  }

  .logo-text {
    font-size: 1.5rem;
    letter-spacing: -0.05em;
    font-weight: 800;
    line-height: 1;
  }

  .logo-subtitle {
    font-size: 0.75rem;
    color: #bfdbfe;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin-top: 2px;
  }

  .logo-icon {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    color: #2563eb;
    border-radius: 12px;
    font-size: 1.5rem;
    font-weight: 800;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .collapse-toggle {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    z-index: 1;
    margin-left: 1rem;
    flex-shrink: 0;
  }

  .collapse-toggle:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  .sidebar-menu {
    flex-grow: 1;
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
  }

  .menu-section {
    margin-bottom: 0.5rem;
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .menu-header.clickable {
    cursor: pointer;
    transition: color 0.2s;
    border-radius: 8px;
  }

  .menu-header.clickable:hover {
    color: #2563eb;
    background: #f1f5f9;
  }

  .section-divider {
    height: 2px;
    background: linear-gradient(to right, #e5e7eb, transparent);
    width: 100%;
    margin: 0.75rem 0;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    transition: max-height 0.3s ease;
  }

  .menu-items.collapsed {
    align-items: center;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    color: #64748b;
    text-decoration: none;
    border-radius: 10px;
    transition: all 0.2s;
    margin-bottom: 0.125rem;
    position: relative;
    overflow: hidden;
  }

  .menu-item::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: #f8e11b;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    opacity: 0;
  }

  .menu-item:hover {
    background: #f1f5f9;
    color: #2563eb;
  }

  .menu-item.active {
    background: linear-gradient(135deg, #f1f9fe, #e0f2fe);
    color: #2563eb;
    font-weight: 600;
  }

  .menu-item.active::before {
    transform: translateX(0);
    opacity: 1;
  }

  .menu-icon {
    width: 20px;
    margin-right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.3s;
  }

  .sidebar.collapsed .menu-icon {
    margin-right: 0;
    font-size: 1.25rem;
  }

  .menu-content {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-badge {
    margin-left: auto;
    padding: 0.125rem 0.375rem;
    font-size: 0.625rem;
    border-radius: 999px;
    font-weight: 600;
    text-align: center;
    min-width: 18px;
    line-height: 1.2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .menu-badge.success {
    background: #d1fae5;
    color: #065f46;
  }

  .menu-badge.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .menu-badge.error {
    background: #fee2e2;
    color: #991b1b;
  }

  .menu-badge-collapsed {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    top: 6px;
    right: 6px;
    box-shadow: 0 0 0 2px white;
  }

  .menu-badge-collapsed.success {
    background: #10b981;
  }

  .menu-badge-collapsed.warning {
    background: #f59e0b;
  }

  .menu-badge-collapsed.error {
    background: #ef4444;
  }

  /* Mobile Sidebar Overlay */
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    cursor: pointer;
    touch-action: manipulation;
    /* Removed blur for better mobile performance */
  }

  @media (max-width: 768px) {
    .sidebar-overlay {
      background: rgba(0, 0, 0, 0.6);
      /* Removed backdrop-filter blur for optimal mobile performance */
    }
  }

  /* Mobile Close Button */
  .mobile-close-btn {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .mobile-close-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .sidebar {
      transform: translateX(-100%);
      z-index: 1001;
      width: 280px !important; /* Force full width on mobile */
    }

    .sidebar.active {
      transform: translateX(0);
    }

    /* Always expanded on mobile */
    .sidebar.collapsed {
      width: 280px !important;
    }

    .sidebar.mobile .sidebar-header.collapsed {
      padding: 1.5rem;
      justify-content: space-between;
    }

    .sidebar.mobile .menu-items.collapsed {
      align-items: stretch;
    }

    .sidebar.mobile .menu-icon {
      margin-right: 0.75rem;
      font-size: 1rem;
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 100vw !important;
      max-width: 320px;
    }

    .sidebar-header {
      padding: 1.25rem 1.5rem;
      min-height: 80px;
    }

    .sidebar-header.mobile {
      padding: 1rem 1.25rem;
    }

    .logo-text {
      font-size: 1.25rem;
    }

    .logo-subtitle {
      font-size: 0.7rem;
    }

    .sidebar-menu {
      padding: 1rem;
    }

    .menu-section {
      margin-bottom: 1rem;
    }

    .menu-header {
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      border-radius: 8px;
      background: #f8fafc;
      margin-bottom: 0.5rem;
    }

    .menu-items {
      gap: 0.5rem;
    }

    .menu-item {
      padding: 1rem 1.25rem;
      border-radius: 12px;
      min-height: 56px; /* Better touch target */
      font-size: 0.95rem;
      font-weight: 500;
    }

    .menu-item:hover {
      background: #f1f5f9;
      transform: translateX(4px);
    }

    .menu-item.active {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      color: white;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .menu-item.active::before {
      display: none;
    }

    .menu-icon {
      width: 24px;
      margin-right: 1rem;
      font-size: 1.125rem;
    }

    .menu-label {
      font-size: 0.95rem;
      font-weight: 500;
    }

    .menu-badge {
      padding: 0.25rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
    }

    /* Section dividers on mobile */
    .section-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.5rem 0;
    }

    /* Scrollbar for mobile */
    .sidebar-menu::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-menu::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .sidebar-menu::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .sidebar-menu::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  }

  @media (max-width: 480px) {
    .sidebar {
      width: 100vw !important;
      max-width: 100vw;
    }

    .sidebar-header {
      padding: 1rem;
      min-height: 70px;
    }

    .logo-text {
      font-size: 1.125rem;
    }

    .logo-subtitle {
      font-size: 0.65rem;
    }

    .sidebar-menu {
      padding: 0.75rem;
    }

    .menu-header {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .menu-item {
      padding: 0.875rem 1rem;
      min-height: 50px;
      font-size: 0.9rem;
    }

    .menu-icon {
      width: 20px;
      margin-right: 0.875rem;
      font-size: 1rem;
    }

    .mobile-close-btn {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }
  }

  /* Touch improvements */
  @media (hover: none) and (pointer: coarse) {
    .menu-item {
      min-height: 48px;
      padding: 0.875rem 1rem;
    }

    .menu-item:active {
      background: #e2e8f0;
      transform: scale(0.98);
    }

    .menu-header.clickable:active {
      background: #e2e8f0;
      transform: scale(0.98);
    }

    .mobile-close-btn:active {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0.95);
    }
  }

  /* Safe area for iPhone notch */
  @supports (env(safe-area-inset-top)) {
    @media (max-width: 768px) {
      .sidebar {
        padding-top: env(safe-area-inset-top);
      }

      .sidebar-header {
        padding-top: calc(1.25rem + env(safe-area-inset-top));
      }
    }
  }

  /* Performance optimizations */
  .sidebar,
  .sidebar-overlay {
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }

  /* Prevent text selection during swipe */
  .sidebar.mobile {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Focus styles for accessibility */
  .menu-item:focus,
  .mobile-close-btn:focus,
  .collapse-toggle:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Reduce motion for users who prefer it */
  @media (prefers-reduced-motion: reduce) {
    .sidebar,
    .sidebar-overlay,
    .menu-item,
    .mobile-close-btn,
    .collapse-toggle {
      transition: none;
    }
  }
</style>
