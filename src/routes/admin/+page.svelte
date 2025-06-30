<!-- src/routes/admin/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  // Import components
  import StatCards from "$lib/components/admin/Dashboard/StatCards.svelte";
  import RevenueChart from "$lib/components/admin/Dashboard/RevenueChart.svelte";
  import RecentOrders from "$lib/components/admin/Dashboard/RecentOrders.svelte";
  import Breadcrumb from "$lib/components/admin/common/Breadcrumb.svelte";

  import type { StatCard } from "$lib/types/stat-card";
  import type { ChartData } from "$lib/types/chart";
  import type { Order } from "$lib/types/order";

  // Page title and breadcrumbs
  const pageTitle = "Dashboard";
  const breadcrumbs = [
    { label: "Home", link: "/admin" },
    { label: "Dashboard", active: true },
  ];

  // Stats data
  const statsData: StatCard[] = [
    {
      title: "Keseluruhan Pendapatan",
      value: "Rp 45.2M",
      icon: "fas fa-coins",
      iconClass: "primary",
      change: { value: "12.5%", isPositive: true, text: "from last month" },
    },
    {
      title: "Semua Pesanan",
      value: "1,352",
      icon: "fas fa-shopping-bag",
      iconClass: "success",
      change: { value: "8.2%", isPositive: true, text: "from last month" },
    },
    {
      title: "Pesanan Tertunda",
      value: "23",
      icon: "fas fa-clock",
      iconClass: "danger",
      change: { value: "5", isPositive: true, text: "new today" },
    },
  ];

  // Revenue data for chart
  const revenueData: ChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Penjualan",
        data: [
          12000000, 15000000, 13000000, 17000000, 14000000, 18000000, 16000000,
        ],
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Recent orders data
  const recentOrdersData: Order[] = [
    {
      id: "ORD-001",
      order_code: "ORD-001",
      customer_name: "PT. Maju Jaya",
      product_name: "Corporate Shirt (50 pcs)",
      quantity: 50,
      total_price: "7500000",
      payment_type: "dp",
      dp_percent: "60",
      contact_information: "contact@majujaya.com",
      notification_channel: "email",
      design_notes: "Logo perusahaan di dada kiri",
      paid_amount: "7500000",
      is_fully_paid: true,
      status_order: "lunas",
      production_status: "selesai",
      created_at: "2024-01-15",
      updated_at: "2024-01-15",
    },
    {
      id: "ORD-002",
      order_code: "ORD-002",
      customer_name: "CV. Sejahtera",
      product_name: "Uniform Set (100 pcs)",
      quantity: 100,
      total_price: "12000000",
      payment_type: "dp",
      dp_percent: "50",
      contact_information: "sejahtera@gmail.com",
      notification_channel: "email",
      design_notes: "Seragam standar dengan emblem",
      paid_amount: "6000000",
      is_fully_paid: false,
      status_order: "dp_dibayar",
      production_status: "diproses",
      created_at: "2024-01-14",
      updated_at: "2024-01-14",
    },
    {
      id: "ORD-003",
      order_code: "ORD-003",
      customer_name: "Restoran Padang",
      product_name: "Staff Uniform (25 pcs)",
      quantity: 25,
      total_price: "3750000",
      payment_type: "full",
      contact_information: "081234567890",
      notification_channel: "whatsapp",
      design_notes: "Seragam kitchen staff warna putih",
      paid_amount: "3750000",
      is_fully_paid: true,
      status_order: "lunas",
      production_status: "selesai",
      created_at: "2024-01-12",
      updated_at: "2024-01-12",
    },
    {
      id: "ORD-004",
      order_code: "ORD-004",
      customer_name: "Hotel Nyaman",
      product_name: "Hotel Staff Uniforms (80 pcs)",
      quantity: 80,
      total_price: "16000000",
      payment_type: "dp",
      dp_percent: "50",
      contact_information: "hotel@nyaman.co.id",
      notification_channel: "both",
      design_notes: "Seragam front office dan housekeeping",
      paid_amount: "0",
      is_fully_paid: false,
      status_order: "menunggu_link",
      production_status: "menunggu",
      created_at: "2024-01-10",
      updated_at: "2024-01-10",
    },
    {
      id: "ORD-005",
      order_code: "ORD-005",
      customer_name: "PT. Bahagia",
      product_name: "Event T-Shirts (150 pcs)",
      quantity: 150,
      total_price: "9000000",
      payment_type: "dp",
      dp_percent: "50",
      contact_information: "event@bahagia.com",
      notification_channel: "email",
      design_notes: "T-shirt event company gathering",
      paid_amount: "0",
      is_fully_paid: false,
      status_order: "dibatalkan",
      production_status: "menunggu",
      created_at: "2024-01-08",
      updated_at: "2024-01-08",
    },
  ];

  // Quick action items
  const quickActions = [
    {
      icon: "fas fa-plus",
      label: "Buat Pesanan Baru",
      color: "primary",
      link: "/admin/orders/new",
    },
    {
      icon: "fas fa-box",
      label: "Tambah Produk",
      color: "success",
      link: "/admin/products",
    },
    {
      icon: "fas fa-chart-bar",
      label: "Lihat Laporan",
      color: "info",
      link: "/admin/reports",
    },
  ];

  // Recent activity items
  const recentActivities = [
    {
      icon: "fas fa-shopping-cart",
      title: "Order Terbaru",
      description: "Order #ORD-006 from PT. Sentosa",
      time: "10 minutes ago",
      color: "primary",
    },
    {
      icon: "fas fa-money-bill-wave",
      title: "Pembayaran Diterima",
      description: "Payment for Order #ORD-001 has been received",
      time: "30 minutes ago",
      color: "success",
    },
    {
      icon: "fas fa-check-circle",
      title: "Order completed",
      description: "Order #ORD-003 production has been completed",
      time: "2 hours ago",
      color: "success",
    },
    {
      icon: "fas fa-box-open",
      title: "Low stock alert",
      description: "Corporate Shirt (M) is running low on stock",
      time: "3 hours ago",
      color: "warning",
    },
    {
      icon: "fas fa-user-plus",
      title: "New customer registered",
      description: "PT. Bersama has registered as a new customer",
      time: "5 hours ago",
      color: "secondary",
    },
  ];

  // Chart period state
  let chartPeriod = "mingguan";

  // Page sections visibility for animation
  let pageLoaded = false;

  // Update chart period
  function updateChartPeriod(period: string) {
    chartPeriod = period;
    // Here you would typically fetch new data based on the period
  }

  // Animate page load
  onMount(() => {
    setTimeout(() => {
      pageLoaded = true;
    }, 100);
  });
</script>

<svelte:head>
  <title>Dashboard - Hay Hill Clothing Admin</title>
</svelte:head>

<div class="dashboard-page">
  <!-- Page Header -->
  <div class="page-header" in:fade={{ duration: 400, delay: 200 }}>
    <div class="page-header-content">
      <div>
        <h1 class="page-title">{pageTitle}</h1>
        <Breadcrumb items={breadcrumbs} />
      </div>

      <div class="welcome-message">
        <div class="greeting">
          <span class="day-greeting">Selamat Siang,</span>
          <span class="user-name">Admin</span>
        </div>
        <span class="date">Minggu, 5 Mai 2025</span>
      </div>
    </div>

    <div class="quick-actions">
      {#each quickActions as action, i}
        {#if pageLoaded}
          <a
            href={action.link}
            class="quick-action-btn {action.color}"
            in:fly={{
              y: 20,
              delay: 200 + i * 75,
              duration: 400,
              easing: cubicOut,
            }}
          >
            <i class={action.icon}></i>
            <span>{action.label}</span>
          </a>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Stats Section -->
  {#if pageLoaded}
    <StatCards data={statsData} />
  {/if}

  <!-- Main Dashboard Content -->
  <div class="dashboard-content">
    <div class="main-column">
      <!-- Revenue Chart Section -->
      {#if pageLoaded}
        <RevenueChart data={revenueData} period={chartPeriod} />
      {/if}

      <!-- Recent Orders Section -->
      {#if pageLoaded}
        <RecentOrders orders={recentOrdersData} />
      {/if}
    </div>

    <div class="side-column">
      {#if pageLoaded}
        <!-- Recent Activity Card -->
        <div
          class="card activity-card"
          in:fly={{ x: 20, delay: 400, duration: 400, easing: cubicOut }}
        >
          <div class="card-header">
            <h3 class="card-title">Recent Activity</h3>
            <button class="btn btn-text btn-sm">View All</button>
          </div>

          <div class="activity-list">
            {#each recentActivities as activity, i}
              <div
                class="activity-item"
                in:fly={{
                  y: 10,
                  delay: 500 + i * 100,
                  duration: 300,
                  easing: cubicOut,
                }}
              >
                <div class="activity-icon {activity.color}">
                  <i class={activity.icon}></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">{activity.title}</div>
                  <div class="activity-description">{activity.description}</div>
                  <div class="activity-time">{activity.time}</div>
                </div>
              </div>
            {/each}
          </div>

          <div class="card-footer">
            <button class="btn btn-secondary btn-sm btn-block">
              <i class="fas fa-history"></i>
              <span>Load More Activity</span>
            </button>
          </div>
        </div>

        <!-- Quick Stats Card -->
        <div
          class="card stats-summary-card"
          in:fly={{ x: 20, delay: 500, duration: 400, easing: cubicOut }}
        >
          <div class="card-header">
            <h3 class="card-title">Business Summary</h3>
            <span class="period-badge">This Month</span>
          </div>

          <div class="quick-stats">
            <div class="quick-stat-item">
              <div class="quick-stat-icon success">
                <i class="fas fa-arrow-up"></i>
              </div>
              <div class="quick-stat-content">
                <div class="quick-stat-value">Rp 125.4M</div>
                <div class="quick-stat-label">Total Sales</div>
                <div class="quick-stat-change positive">
                  +15.2% from last month
                </div>
              </div>
            </div>

            <div class="quick-stat-item">
              <div class="quick-stat-icon primary">
                <i class="fas fa-shopping-cart"></i>
              </div>
              <div class="quick-stat-content">
                <div class="quick-stat-value">324</div>
                <div class="quick-stat-label">Orders</div>
                <div class="quick-stat-change positive">
                  +8.5% from last month
                </div>
              </div>
            </div>

            <div class="quick-stat-item">
              <div class="quick-stat-icon warning">
                <i class="fas fa-users"></i>
              </div>
              <div class="quick-stat-content">
                <div class="quick-stat-value">48</div>
                <div class="quick-stat-label">New Customers</div>
                <div class="quick-stat-change positive">
                  +12.3% from last month
                </div>
              </div>
            </div>

            <div class="quick-stat-item">
              <div class="quick-stat-icon danger">
                <i class="fas fa-undo-alt"></i>
              </div>
              <div class="quick-stat-content">
                <div class="quick-stat-value">2.3%</div>
                <div class="quick-stat-label">Return Rate</div>
                <div class="quick-stat-change negative">
                  +0.5% from last month
                </div>
              </div>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-header">
              <h4>Monthly Target</h4>
              <span class="progress-percentage">78%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 78%"></div>
            </div>
            <div class="progress-info">
              <span>Rp 125.4M / Rp 160M</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Dashboard Page */
  .dashboard-page {
    padding: 0.5rem 0;
  }

  /* Page Header */
  .page-header {
    margin-bottom: 2rem;
  }

  .page-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin: 0 0 0.375rem 0;
  }

  .welcome-message {
    text-align: right;
  }

  .greeting {
    display: flex;
    flex-direction: column;
  }

  .day-greeting {
    font-size: 0.875rem;
    color: var(--neutral-600);
  }

  .user-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--neutral-900);
  }

  .date {
    font-size: 0.75rem;
    color: var(--neutral-500);
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    gap: 0.875rem;
    flex-wrap: wrap;
  }

  .quick-action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: var(--border-radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .quick-action-btn.primary {
    background: var(--primary-50);
    color: var(--primary-700);
    border: 1px solid var(--primary-200);
  }

  .quick-action-btn.primary:hover {
    background: var(--primary-100);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .quick-action-btn.success {
    background: var(--success-light);
    color: var(--success-dark);
    border: 1px solid var(--success-base);
  }

  .quick-action-btn.success:hover {
    background: var(--success-light);
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .quick-action-btn.warning {
    background: var(--warning-light);
    color: var(--warning-dark);
    border: 1px solid var(--warning-base);
  }

  .quick-action-btn.warning:hover {
    background: var(--warning-light);
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .quick-action-btn.info {
    background: var(--info-light);
    color: var(--info-dark);
    border: 1px solid var(--info-base);
  }

  .quick-action-btn.info:hover {
    background: var(--info-light);
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  /* Dashboard Content */
  .dashboard-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }

  /* Activity Card */
  .activity-card {
    margin-bottom: 1.5rem;
  }

  .activity-list {
    max-height: 450px;
    overflow-y: auto;
  }

  .activity-item {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--neutral-100);
    transition: background 0.2s;
  }

  .activity-item:hover {
    background: var(--neutral-50);
  }

  .activity-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .activity-icon.primary {
    background: var(--primary-100);
    color: var(--primary-600);
  }

  .activity-icon.success {
    background: var(--success-light);
    color: var(--success-base);
  }

  .activity-icon.warning {
    background: var(--warning-light);
    color: var(--warning-base);
  }

  .activity-icon.danger {
    background: var(--error-light);
    color: var(--error-base);
  }

  .activity-icon.info {
    background: var(--info-light);
    color: var(--info-base);
  }

  .activity-icon.secondary {
    background: var(--neutral-100);
    color: var(--neutral-600);
  }

  .activity-content {
    flex-grow: 1;
    min-width: 0;
  }

  .activity-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    color: var(--neutral-900);
  }

  .activity-description {
    font-size: 0.8125rem;
    color: var(--neutral-600);
    margin-bottom: 0.375rem;
    line-height: 1.4;
  }

  .activity-time {
    font-size: 0.75rem;
    color: var(--neutral-500);
  }

  .btn-block {
    width: 100%;
    justify-content: center;
  }

  /* Quick Stats Card */
  .stats-summary-card {
    margin-bottom: 1.5rem;
  }

  .period-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-md);
    background: var(--primary-50);
    color: var(--primary-600);
    font-weight: 500;
  }

  .quick-stats {
    padding: 0 1.5rem;
  }

  .quick-stat-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--neutral-100);
  }

  .quick-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .quick-stat-icon.primary {
    background: var(--primary-100);
    color: var(--primary-600);
  }

  .quick-stat-icon.success {
    background: var(--success-light);
    color: var(--success-base);
  }

  .quick-stat-icon.warning {
    background: var(--warning-light);
    color: var(--warning-base);
  }

  .quick-stat-icon.danger {
    background: var(--error-light);
    color: var(--error-base);
  }

  .quick-stat-content {
    flex-grow: 1;
    min-width: 0;
  }

  .quick-stat-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin-bottom: 0.25rem;
  }

  .quick-stat-label {
    font-size: 0.75rem;
    color: var(--neutral-500);
    margin-bottom: 0.5rem;
  }

  .quick-stat-change {
    font-size: 0.75rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .quick-stat-change.positive {
    color: var(--success-base);
  }

  .quick-stat-change.negative {
    color: var(--error-base);
  }

  /* Progress Section */
  .progress-section {
    padding: 1.5rem;
    border-top: 1px solid var(--neutral-100);
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .progress-header h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin: 0;
  }

  .progress-percentage {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--primary-600);
  }

  .progress-bar {
    height: 10px;
    background: var(--neutral-100);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-400), var(--primary-600));
    border-radius: 999px;
    transition: width 1s ease-in-out;
  }

  .progress-info {
    font-size: 0.75rem;
    color: var(--neutral-500);
    text-align: right;
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .dashboard-content {
      grid-template-columns: 1fr;
    }

    .side-column {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .activity-card,
    .stats-summary-card {
      margin-bottom: 0;
    }
  }

  @media (max-width: 768px) {
    .page-header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .welcome-message {
      text-align: left;
    }

    .quick-actions {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .side-column {
      grid-template-columns: 1fr;
    }
  }
</style>
