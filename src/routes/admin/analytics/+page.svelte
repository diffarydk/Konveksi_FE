<!-- src/routes/admin/analytics/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  // Mock data untuk demonstrasi
  interface StatCard {
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative";
    icon: string;
  }

  interface ChartData {
    label: string;
    value: number;
    color?: string;
  }

  interface RecentOrder {
    id: string;
    order_code: string;
    customer_name: string;
    total_price: string;
    status: string;
    created_at: string;
  }

  // Date range options
  let selectedDateRange = "30";
  const dateRangeOptions = [
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "This Quarter" },
    { value: "365", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  // Stat cards data
  let statCards: StatCard[] = [
    {
      title: "Total Pendapatan",
      value: "Rp 45.750.000",
      change: "+12.5%",
      changeType: "positive",
      icon: "fas fa-chart-line",
    },
    {
      title: "Pesanan Baru",
      value: "127",
      change: "+8.2%",
      changeType: "positive",
      icon: "fas fa-shopping-cart",
    },
    {
      title: "Pesanan Selesai",
      value: "89",
      change: "+15.3%",
      changeType: "positive",
      icon: "fas fa-check-circle",
    },
    {
      title: "Nilai Order Rata-rata",
      value: "Rp 360.000",
      change: "-3.1%",
      changeType: "negative",
      icon: "fas fa-calculator",
    },
  ];

  // Monthly revenue data for bar chart
  let monthlyRevenue: ChartData[] = [
    { label: "Agu", value: 28500000 },
    { label: "Sep", value: 32100000 },
    { label: "Okt", value: 29800000 },
    { label: "Nov", value: 41200000 },
    { label: "Des", value: 38900000 },
    { label: "Jan", value: 45750000 },
  ];

  // Order status composition for donut chart
  let orderComposition: ChartData[] = [
    { label: "Selesai", value: 60, color: "#10b981" },
    { label: "Produksi", value: 30, color: "#f59e0b" },
    { label: "Pending", value: 10, color: "#ef4444" },
  ];

  // Recent orders
  let recentOrders: RecentOrder[] = [
    {
      id: "1",
      order_code: "ORD-2025-045",
      customer_name: "Ahmad Rizki",
      total_price: "750000",
      status: "paid",
      created_at: "2025-01-20T14:30:00Z",
    },
    {
      id: "2",
      order_code: "ORD-2025-044",
      customer_name: "PT. Example Co",
      total_price: "1200000",
      status: "production",
      created_at: "2025-01-20T10:15:00Z",
    },
    {
      id: "3",
      order_code: "ORD-2025-043",
      customer_name: "Sari Boutique",
      total_price: "850000",
      status: "pending",
      created_at: "2025-01-19T16:45:00Z",
    },
    {
      id: "4",
      order_code: "ORD-2025-042",
      customer_name: "Fashion Store",
      total_price: "2100000",
      status: "paid",
      created_at: "2025-01-19T11:20:00Z",
    },
    {
      id: "5",
      order_code: "ORD-2025-041",
      customer_name: "Tim Futsal",
      total_price: "950000",
      status: "production",
      created_at: "2025-01-18T15:30:00Z",
    },
  ];

  let isLoading = false;

  // Helper functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      paid: "Lunas",
      pending: "Menunggu",
      production: "Produksi",
    };
    return statusMap[status] || status;
  }

  function getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      paid: "success",
      pending: "warning",
      production: "info",
    };
    return statusMap[status] || "secondary";
  }

  function handleDateRangeChange() {
    console.log("Date range changed to:", selectedDateRange);
    // In real implementation, fetch new data based on date range
  }

  // Get max value for bar chart scaling
  $: maxRevenue = Math.max(...monthlyRevenue.map((item) => item.value));

  onMount(() => {
    // Load analytics data here in real implementation
  });
</script>

<div class="analytics-container">
  <!-- Header -->
  <div class="analytics-header">
    <div class="header-content">
      <div class="header-text">
        <h1>Dashboard Analitik (MOCKUP)</h1>
        <p>
          Monitor performa bisnis dan insight penjualan dalam satu dashboard
        </p>
      </div>
      <div class="header-controls">
        <select
          bind:value={selectedDateRange}
          on:change={handleDateRangeChange}
          class="date-range-picker"
        >
          {#each dateRangeOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <div class="analytics-content">
    <!-- Stat Cards -->
    <div class="stat-cards-grid">
      {#each statCards as card (card.title)}
        <div class="stat-card" transition:fade={{ delay: 100 }}>
          <div class="stat-icon">
            <i class={card.icon}></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">{card.title}</h3>
            <div class="stat-value">{card.value}</div>
            <div class="stat-change {card.changeType}">
              <i
                class={card.changeType === "positive"
                  ? "fas fa-arrow-up"
                  : "fas fa-arrow-down"}
              ></i>
              {card.change} vs bulan lalu
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="charts-grid">
        <!-- Bar Chart - Monthly Revenue -->
        <div class="chart-card">
          <div class="chart-header">
            <h2>Pendapatan Bulanan</h2>
            <p>6 bulan terakhir</p>
          </div>
          <div class="bar-chart">
            {#each monthlyRevenue as item (item.label)}
              <div class="bar-item">
                <div
                  class="bar-fill"
                  style="height: {(item.value / maxRevenue) * 100}%"
                  title="Rp {item.value.toLocaleString('id-ID')}"
                ></div>
                <span class="bar-label">{item.label}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Donut Chart - Order Status -->
        <div class="chart-card">
          <div class="chart-header">
            <h2>Komposisi Status Order</h2>
            <p>Distribusi status pesanan aktif</p>
          </div>
          <div class="donut-chart">
            <div class="donut-visual">
              <svg viewBox="0 0 100 100" class="donut-svg">
                {#each orderComposition as item, index}
                  {@const circumference = 2 * Math.PI * 30}
                  {@const strokeDasharray = `${(item.value / 100) * circumference} ${circumference}`}
                  {@const strokeDashoffset =
                    -index *
                    ((circumference *
                      (orderComposition[index - 1]?.value || 0)) /
                      100)}
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke={item.color}
                    stroke-width="8"
                    stroke-dasharray={strokeDasharray}
                    stroke-dashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                  />
                {/each}
              </svg>
              <div class="donut-center">
                <span class="donut-total">100%</span>
                <span class="donut-label">Total</span>
              </div>
            </div>
            <div class="donut-legend">
              {#each orderComposition as item}
                <div class="legend-item">
                  <div
                    class="legend-color"
                    style="background-color: {item.color}"
                  ></div>
                  <span class="legend-text">{item.label}</span>
                  <span class="legend-value">{item.value}%</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity">
      <div class="activity-card">
        <div class="activity-header">
          <h2>5 Pesanan Terakhir</h2>
          <p>Aktivitas pesanan terbaru untuk referensi cepat</p>
        </div>
        <div class="activity-table-container">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Kode Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {#each recentOrders as order (order.id)}
                <tr>
                  <td>
                    <span class="order-code">{order.order_code}</span>
                  </td>
                  <td>
                    <span class="customer-name">{order.customer_name}</span>
                  </td>
                  <td>
                    <span class="order-total"
                      >Rp {parseInt(order.total_price).toLocaleString(
                        "id-ID"
                      )}</span
                    >
                  </td>
                  <td>
                    <span class="status-badge {getStatusClass(order.status)}">
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td>
                    <span class="order-time"
                      >{formatDate(order.created_at)}</span
                    >
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .analytics-container {
    min-height: 100vh;
    background: #f9fafb;
  }

  .analytics-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header-text h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .header-text p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
  }

  .date-range-picker {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    min-width: 140px;
  }

  .date-range-picker:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .analytics-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Stat Cards */
  .stat-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    display: flex;
    gap: 1rem;
    transition: all 0.2s;
  }

  .stat-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon i {
    font-size: 1.25rem;
    color: #3b82f6;
  }

  .stat-content {
    flex: 1;
  }

  .stat-title {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .stat-change {
    font-size: 0.75rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-change.positive {
    color: #10b981;
  }

  .stat-change.negative {
    color: #ef4444;
  }

  /* Charts */
  .charts-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }

  .chart-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .chart-header {
    margin-bottom: 1.5rem;
  }

  .chart-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .chart-header p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  /* Bar Chart */
  .bar-chart {
    display: flex;
    align-items: end;
    gap: 1rem;
    height: 200px;
    padding: 1rem 0;
  }

  .bar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .bar-fill {
    width: 100%;
    max-width: 40px;
    background: #3b82f6;
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .bar-fill:hover {
    background: #2563eb;
  }

  .bar-label {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* Donut Chart */
  .donut-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .donut-visual {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .donut-svg {
    width: 100%;
    height: 100%;
  }

  .donut-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .donut-total {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
  }

  .donut-label {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .donut-legend {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .legend-text {
    flex: 1;
    font-size: 0.875rem;
    color: #374151;
  }

  .legend-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
  }

  /* Recent Activity */
  .activity-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .activity-header {
    margin-bottom: 1.5rem;
  }

  .activity-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .activity-header p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .activity-table-container {
    overflow-x: auto;
  }

  .activity-table {
    width: 100%;
    border-collapse: collapse;
  }

  .activity-table th {
    background: #f9fafb;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e5e7eb;
  }

  .activity-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.875rem;
  }

  .activity-table tr:hover {
    background: #fafafa;
  }

  .order-code {
    font-family: "Courier New", monospace;
    font-weight: 600;
    color: #111827;
  }

  .customer-name {
    color: #111827;
    font-weight: 500;
  }

  .order-total {
    font-weight: 600;
    color: #111827;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge.success {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.info {
    background: #dbeafe;
    color: #1e40af;
  }

  .order-time {
    color: #6b7280;
    font-size: 0.75rem;
  }

  @media (max-width: 1024px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }

    .stat-cards-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .analytics-content {
      padding: 1rem;
    }

    .stat-cards-grid {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 1rem;
    }

    .chart-card {
      padding: 1rem;
    }

    .bar-chart {
      height: 150px;
    }

    .activity-table th,
    .activity-table td {
      padding: 0.5rem;
    }
  }
</style>
