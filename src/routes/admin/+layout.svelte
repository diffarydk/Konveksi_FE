<!-- src/routes/admin/+layout.svelte -->
<script lang="ts">
  import "$lib/styles/admin.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { sidebar as sidebarStore, theme } from "$lib/stores/ui";
  import { auth } from "$lib/stores/auth";
  import { logout, initAuth } from "$lib/services/auth";

  import Sidebar from "$lib/components/admin/Sidebar.svelte";
  import Header from "$lib/components/admin/Header.svelte";

  // Loading state to prevent flash of login redirect
  let isLoading = true;

  // Check authentication
  onMount(async () => {
    // Initialize authentication - wait for this to complete before checking
    try {
      const isAuthenticated = await initAuth();

      // Only redirect if authentication explicitly failed
      if (!isAuthenticated) {
        goto("/login");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      goto("/login");
    } finally {
      isLoading = false;
    }

    // Initialize CSS variables based on sidebar state
    const isCollapsed = $sidebarStore.collapsed;
    const sidebarWidth = isCollapsed
      ? "var(--sidebar-collapsed-width)"
      : "280px";

    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth);
    document.documentElement.style.setProperty(
      "--header-margin-left",
      sidebarWidth
    );

    // Initialize dark mode if stored in localStorage
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        const themeData = JSON.parse(storedTheme);
        if (themeData.darkMode) {
          document.documentElement.classList.add("dark-mode");
        }
      }
    }
  });

  // React to sidebar collapse changes
  $: if (typeof window !== "undefined") {
    const sidebarWidth = $sidebarStore.collapsed
      ? "var(--sidebar-collapsed-width)"
      : "280px";
    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth);
    document.documentElement.style.setProperty(
      "--header-margin-left",
      sidebarWidth
    );
  }

  // Handle logout
  async function handleLogout() {
    await logout();
    goto("/login");
  }
</script>

<svelte:head>
  <title>Admin Panel - Hay Hill Clothing</title>
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
    rel="stylesheet"
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
</svelte:head>

<div class="admin-panel admin-layout">
  <!-- Sidebar - Expanded by default -->
  <Sidebar active={$page.url.pathname} />

  <!-- Main Content -->
  <main class="main-content">
    <!-- Header - Now adjusts its position based on sidebar state -->
    <Header
      username={$auth.user?.username || "Admin"}
      userRole={$auth.user?.role || "Administrator"}
      {handleLogout}
    />

    <!-- Content Area -->
    <div class="content">
      <slot />
    </div>
  </main>
</div>

<style>
  /* Layout */
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background-color: var(--neutral-100);
    position: relative;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    margin-left: var(--sidebar-width, 280px);
    width: calc(100% - var(--sidebar-width, 280px));
    transition:
      margin-left var(--transition-speed),
      width var(--transition-speed);
  }

  /* Content Area */
  .content {
    padding: 2rem;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .main-content {
      margin-left: 0;
      width: 100%;
    }

    .content {
      padding: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .content {
      padding: 1rem;
    }
  }

  /* Mobile-friendly enhancements */
  @media (max-width: 480px) {
    .content {
      padding: 0.75rem;
    }
  }
</style>
