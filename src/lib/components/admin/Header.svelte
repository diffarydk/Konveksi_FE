<!-- src/lib/components/admin/Header.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { sidebar, theme } from "$lib/stores/ui";
  import { fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let username: string = "Admin";
  export let userRole: string = "Administrator";
  export let handleLogout: () => void;

  const dispatch = createEventDispatcher();

  // User dropdown state
  let userDropdownVisible = false;

  // Notifications state
  let notificationsVisible = false;
  let notifications = [
    {
      id: 1,
      title: "New Order",
      message: "PT. Maju Jaya placed a new order",
      time: "10 minutes ago",
      read: false,
      type: "order",
    },
    {
      id: 2,
      title: "Low Stock Alert",
      message: "Corporate Shirt (M) is running low on stock",
      time: "1 hour ago",
      read: false,
      type: "inventory",
    },
    {
      id: 3,
      title: "Payment Received",
      message: "Received payment for Order #ORD-056",
      time: "3 hours ago",
      read: true,
      type: "payment",
    },
  ];

  // Toggle sidebar visibility (untuk mobile)
  function toggleSidebar() {
    sidebar.update((state) => ({ ...state, visible: !state.visible }));
  }

  // Toggle user dropdown
  function toggleUserDropdown(e: Event) {
    e.stopPropagation();
    userDropdownVisible = !userDropdownVisible;

    // Close notifications if open
    if (notificationsVisible) {
      notificationsVisible = false;
    }
  }

  // Toggle notifications dropdown
  function toggleNotifications(e: Event) {
    e.stopPropagation();
    notificationsVisible = !notificationsVisible;

    // Close user dropdown if open
    if (userDropdownVisible) {
      userDropdownVisible = false;
    }
  }

  // Mark notification as read
  function markNotificationAsRead(id: number) {
    notifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    );
  }

  // Mark all notifications as read
  function markAllAsRead() {
    notifications = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
  }

  // Get unread notification count
  $: unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns when clicking outside
  onMount(() => {
    const handleClickOutside = () => {
      userDropdownVisible = false;
      notificationsVisible = false;
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  // Get notification icon by type
  function getNotificationIcon(type: string): string {
    switch (type) {
      case "order":
        return "fas fa-shopping-cart";
      case "inventory":
        return "fas fa-box";
      case "payment":
        return "fas fa-money-bill-wave";
      default:
        return "fas fa-bell";
    }
  }

  // Get notification color by type
  function getNotificationColor(type: string): string {
    switch (type) {
      case "order":
        return "#2563eb";
      case "inventory":
        return "#f59e0b";
      case "payment":
        return "#10b981";
      default:
        return "#64748b";
    }
  }
</script>

<header class="header">
  <div class="header-left">
    <button
      class="toggle-sidebar"
      class:active={$sidebar.visible}
      on:click={toggleSidebar}
      aria-label="Toggle sidebar"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <div class="search-container">
      <div class="search-box">
        <i class="fas fa-search search-icon"></i>
        <input type="text" class="search-input" placeholder="Search..." />
        <div class="search-hotkey">CTRL</div>
      </div>
    </div>
  </div>

  <div class="header-right">
    <div class="header-actions">
      <div class="notification-container">
        <button
          class="header-btn notification-btn"
          aria-label="Notifications"
          on:click={toggleNotifications}
        >
          <i class="fas fa-bell"></i>
          {#if unreadCount > 0}
            <span class="notification-badge">{unreadCount}</span>
          {/if}
        </button>

        {#if notificationsVisible}
          <div
            class="dropdown notification-dropdown"
            transition:fly={{ y: -20, duration: 200, easing: cubicOut }}
          >
            <div class="dropdown-header">
              <h4>Notifications</h4>
              {#if unreadCount > 0}
                <button class="dropdown-action" on:click={markAllAsRead}>
                  Mark all as read
                </button>
              {/if}
            </div>

            <div class="notification-list">
              {#if notifications.length === 0}
                <div class="empty-state">
                  <i class="fas fa-bell-slash"></i>
                  <p>No notifications</p>
                </div>
              {:else}
                {#each notifications as notification}
                  <div
                    class="notification-item"
                    class:unread={!notification.read}
                    on:click={() => markNotificationAsRead(notification.id)}
                  >
                    <div
                      class="notification-icon"
                      style="background-color: {getNotificationColor(
                        notification.type
                      )}20; color: {getNotificationColor(notification.type)};"
                    >
                      <i class={getNotificationIcon(notification.type)}></i>
                    </div>
                    <div class="notification-content">
                      <div class="notification-title">
                        {notification.title}
                        {#if !notification.read}
                          <span class="unread-dot"></span>
                        {/if}
                      </div>
                      <div class="notification-message">
                        {notification.message}
                      </div>
                      <div class="notification-time">{notification.time}</div>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>

            <div class="dropdown-footer">
              <a href="/admin/notifications">View all notifications</a>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="divider"></div>

    <div class="user-menu" on:click={toggleUserDropdown}>
      <div class="user-avatar-container">
        <div class="user-avatar">
          <span class="user-initial">{username.charAt(0)}</span>
        </div>
        <div class="user-status online"></div>
      </div>

      <div class="user-info">
        <span class="user-name">{username}</span>
        <span class="user-role">{userRole}</span>
      </div>

      <button class="dropdown-toggle" aria-label="Toggle user menu">
        <i class="fas fa-chevron-down"></i>
      </button>

      {#if userDropdownVisible}
        <div
          class="dropdown user-dropdown"
          transition:fly={{ y: -20, duration: 200, easing: cubicOut }}
        >
          <div class="dropdown-header user-dropdown-header">
            <div class="user-avatar-large">
              <span class="user-initial-large">{username.charAt(0)}</span>
            </div>
            <div>
              <h4>{username}</h4>
              <p class="user-email">admin@hayhillclothing.id</p>
            </div>
          </div>

          <div class="divider"></div>

          <div class="dropdown-menu">
            <a href="/admin/profile" class="dropdown-item">
              <i class="fas fa-user"></i>
              <span>Profile</span>
            </a>
            <a href="/admin/settings" class="dropdown-item">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </a>
            <a href="/admin/help" class="dropdown-item">
              <i class="fas fa-question-circle"></i>
              <span>Help Center</span>
            </a>
          </div>

          <div class="divider"></div>

          <div class="dropdown-menu">
            <button class="dropdown-item text-danger" on:click={handleLogout}>
              <i class="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  /* Header */
  .header {
    height: var(--header-height);
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 100; /* Higher z-index to ensure hamburger button visible */
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  /* Mobile Responsiveness */
  @media (min-width: 1025px) {
    .toggle-sidebar {
      display: none; /* Sembunyikan hamburger di desktop karena ada collapse button di sidebar */
    }
  }

  @media (max-width: 1024px) {
    .toggle-sidebar {
      display: flex; /* Pastikan hamburger button tampil di mobile */
    }

    .search-container {
      display: none; /* Sembunyikan search di mobile untuk space */
    }
  }

  @media (max-width: 768px) {
    .header {
      padding: 0 1rem;
    }

    .header-left {
      gap: 0.75rem;
    }

    .toggle-sidebar {
      width: 44px;
      height: 44px; /* Larger touch target for mobile */
    }

    .hamburger-line {
      width: 22px;
      height: 2.5px;
    }
  }

  .toggle-sidebar {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--border-radius-md);
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    gap: 4px;
    position: relative;
    z-index: 101; /* Ensure hamburger button is on top */
  }

  .toggle-sidebar:hover {
    background: #f1f5f9;
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background: #64748b;
    border-radius: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  .toggle-sidebar:hover .hamburger-line {
    background: #2563eb;
  }

  .toggle-sidebar.active .hamburger-line:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }

  .toggle-sidebar.active .hamburger-line:nth-child(2) {
    opacity: 0;
  }

  .toggle-sidebar.active .hamburger-line:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }

  .breadcrumb-path {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .breadcrumb-path i {
    color: #2563eb;
  }

  .search-container {
    position: relative;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 350px;
    padding: 0.625rem 2.75rem 0.625rem 2.5rem;
    border: 1px solid #e5e7eb;
    border-radius: var(--border-radius-lg);
    background: #f9fafb;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px #dbeafe;
    background: white;
  }

  .search-input::placeholder {
    color: #94a3b8;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    color: #94a3b8;
    pointer-events: none;
  }

  .search-hotkey {
    position: absolute;
    right: 0.75rem;
    background: #e5e7eb;
    color: #64748b;
    padding: 0.125rem 0.375rem;
    border-radius: var(--border-radius-sm);
    font-size: 0.6875rem;
    font-weight: 500;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-btn {
    background: none;
    border: none;
    font-size: 1rem;
    color: #64748b;
    cursor: pointer;
    position: relative;
    padding: 0.5rem;
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .header-btn:hover {
    background: #f1f5f9;
    color: #2563eb;
  }

  .create-btn {
    background: #eff6ff;
    color: #2563eb;
    padding: 0.5rem 1rem;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .create-btn:hover {
    background: #dbeafe;
  }

  .notification-container {
    position: relative;
  }

  .notification-btn {
    font-size: 1.125rem;
  }

  .notification-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #f59e0b;
    color: white;
    font-size: 0.625rem;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  .divider {
    width: 1px;
    height: 2rem;
    background: #e5e7eb;
  }

  .user-menu {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    position: relative;
    padding: 0.375rem;
    border-radius: var(--border-radius-md);
    transition: all 0.2s;
  }

  .user-menu:hover {
    background: #f1f5f9;
  }

  .user-avatar-container {
    position: relative;
  }

  .user-avatar {
    width: 38px;
    height: 38px;
    border-radius: var(--border-radius-md);
    background: linear-gradient(135deg, #2563eb, #1e40af);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
  }

  .user-initial {
    text-transform: uppercase;
  }

  .user-status {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
  }

  .user-status.online {
    background: #10b981;
  }

  .user-status.away {
    background: #f59e0b;
  }

  .user-status.offline {
    background: #94a3b8;
  }

  .user-info {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: #1e293b;
  }

  .user-role {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .dropdown-toggle {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Dropdowns */
  .dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: white;
    border-radius: var(--border-radius-lg);
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    width: 320px;
    z-index: 100;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }

  .dropdown-header {
    padding: 1rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
  }

  .dropdown-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
  }

  .dropdown-action {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #2563eb;
    cursor: pointer;
    padding: 0;
    font-weight: 500;
  }

  .dropdown-action:hover {
    text-decoration: underline;
  }

  .dropdown-menu {
    padding: 0.5rem 0;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: #64748b;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-size: 0.875rem;
  }

  .dropdown-item:hover {
    background: #f8fafc;
    color: #2563eb;
  }

  .dropdown-item i {
    color: #94a3b8;
    width: 16px;
    text-align: center;
    font-size: 1rem;
  }

  .dropdown-item:hover i {
    color: #2563eb;
  }

  .dropdown-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }

  .dropdown-footer a {
    color: #2563eb;
    font-size: 0.75rem;
    text-decoration: none;
    font-weight: 500;
  }

  .dropdown-footer a:hover {
    text-decoration: underline;
  }

  /* User Profile Dropdown */
  .user-dropdown-header {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-avatar-large {
    width: 48px;
    height: 48px;
    border-radius: var(--border-radius-md);
    background: linear-gradient(135deg, #2563eb, #1e40af);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.25rem;
  }

  .user-initial-large {
    text-transform: uppercase;
  }

  .user-email {
    margin: 0;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  /* Notification Dropdown */
  .notification-list {
    max-height: 320px;
    overflow-y: auto;
  }

  .notification-item {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    border-bottom: 1px solid #f1f5f9;
  }

  .notification-item:hover {
    background: #f8fafc;
  }

  .notification-item.unread {
    background: #f0f9ff;
  }

  .notification-item.unread:hover {
    background: #e0f2fe;
  }

  .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .notification-content {
    flex-grow: 1;
    min-width: 0;
  }

  .notification-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2563eb;
    display: inline-block;
  }

  .notification-message {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.375rem;
    line-height: 1.4;
  }

  .notification-time {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  /* Empty notification state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #94a3b8;
  }

  .empty-state i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .search-input {
      width: 250px;
    }

    .toggle-sidebar {
      display: block;
    }

    .breadcrumb-path {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .header {
      padding: 0 1rem;
    }

    .header-right {
      gap: 0.75rem;
    }

    .search-container {
      display: none;
    }

    .user-info {
      display: none;
    }

    .dropdown {
      width: 280px;
    }
  }
</style>
