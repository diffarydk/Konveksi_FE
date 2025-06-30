<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { ordersService } from "$lib/services/orders";
  import type { Order } from "$lib/types/order";

  export let orders: Order[] = [];
  export let isLoading = false;

  // Stats calculations
  let stats = {
    total: 0,
    pendingPayment: 0,
    inProduction: 0,
    completed: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completionRate: 0,
    todayOrders: 0,
  };

  // Chart data for mini charts
  let statusDistribution: {
    label: string;
    value: number;
    color: string;
    percentage: number;
  }[] = [];
  let productionDistribution: {
    label: string;
    value: number;
    color: string;
    percentage: number;
  }[] = [];

  // Performance metrics
  let performanceMetrics = {
    growthRate: 0,
    conversionRate: 0,
    averageCompletionTime: 0,
  };

  // Reactive calculations
  $: if (orders.length > 0) {
    calculateStats();
    calculateDistributions();
    calculatePerformanceMetrics();
  }

  function calculateStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    stats.total = orders.length;
    stats.pendingPayment = orders.filter((o) =>
      ["menunggu_link", "link_dibuat"].includes(o.status_order)
    ).length;
    stats.inProduction = orders.filter(
      (o) =>
        ["dp_dibayar", "pengerjaan_selesai"].includes(o.status_order) &&
        ["diproses"].includes(o.production_status || "menunggu")
    ).length;
    stats.completed = orders.filter((o) => o.status_order === "lunas").length;

    stats.totalRevenue = orders.reduce(
      (sum, order) => sum + parseFloat(order.paid_amount || "0"),
      0
    );

    stats.averageOrderValue =
      stats.total > 0
        ? orders.reduce(
            (sum, order) => sum + parseFloat(order.total_price),
            0
          ) / stats.total
        : 0;

    stats.completionRate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    stats.todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= today;
    }).length;
  }

  function calculateDistributions() {
    const statusCounts = orders.reduce(
      (acc, order) => {
        acc[order.status_order] = (acc[order.status_order] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusLabels: Record<string, { label: string; color: string }> = {
      menunggu_link: { label: "Menunggu Link", color: "#f59e0b" },
      link_dibuat: { label: "Link Dibuat", color: "#3b82f6" },
      dp_dibayar: { label: "DP Dibayar", color: "#10b981" },
      pengerjaan_selesai: { label: "Pengerjaan Selesai", color: "#6366f1" },
      menunggu_pelunasan: { label: "Menunggu Pelunasan", color: "#f97316" },
      lunas: { label: "Lunas", color: "#059669" },
      dibatalkan: { label: "Dibatalkan", color: "#ef4444" },
    };

    statusDistribution = Object.entries(statusCounts)
      .map(([status, count]) => ({
        label: statusLabels[status]?.label || status,
        value: count,
        color: statusLabels[status]?.color || "#6b7280",
        percentage: (count / stats.total) * 100,
      }))
      .sort((a, b) => b.value - a.value);

    // Production distribution
    const productionCounts = orders.reduce(
      (acc, order) => {
        const status = order.production_status || "menunggu";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const productionLabels: Record<string, { label: string; color: string }> = {
      menunggu: { label: "Menunggu", color: "#f59e0b" },
      diproses: { label: "Diproses", color: "#3b82f6" },
      selesai: { label: "Selesai", color: "#10b981" },
      dikirim: { label: "Dikirim", color: "#6366f1" },
      dibatalkan: { label: "Dibatalkan", color: "#ef4444" },
    };

    productionDistribution = Object.entries(productionCounts)
      .map(([status, count]) => ({
        label: productionLabels[status]?.label || status,
        value: count,
        color: productionLabels[status]?.color || "#6b7280",
        percentage: (count / stats.total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }

  function calculatePerformanceMetrics() {
    // Growth rate (comparing this month vs last month)
    const now = new Date();
    const thisMonth = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const lastMonth = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return (
        orderDate.getMonth() === lastMonthDate.getMonth() &&
        orderDate.getFullYear() === lastMonthDate.getFullYear()
      );
    }).length;

    performanceMetrics.growthRate =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Conversion rate (completed vs total)
    performanceMetrics.conversionRate = stats.completionRate;

    // Average completion time (in days)
    const completedOrders = orders.filter((o) => o.status_order === "lunas");
    if (completedOrders.length > 0) {
      const totalDays = completedOrders.reduce((sum, order) => {
        const created = new Date(order.created_at);
        const updated = new Date(order.updated_at);
        const days = Math.ceil(
          (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      performanceMetrics.averageCompletionTime =
        totalDays / completedOrders.length;
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat("id-ID").format(num);
  }
</script>

<div class="order-stats">
  {#if isLoading}
    <div class="stats-loading">
      <div class="loading-spinner">
        <i class="fas fa-chart-line fa-spin"></i>
      </div>
      <span>Menghitung statistik...</span>
    </div>
  {:else}
    <!-- Main Stats Cards -->
    <div class="stats-grid" transition:fade>
      <div class="stat-card primary">
        <div class="stat-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{formatNumber(stats.total)}</div>
          <div class="stat-label">Total Pesanan</div>
          <div class="stat-change positive">
            <i class="fas fa-arrow-up"></i>
            {stats.todayOrders} hari ini
          </div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div class="stat-label">Total Pendapatan</div>
          <div class="stat-change">
            <i class="fas fa-calculator"></i>
            Rata-rata: {formatCurrency(stats.averageOrderValue)}
          </div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{formatNumber(stats.pendingPayment)}</div>
          <div class="stat-label">Menunggu Pembayaran</div>
          <div class="stat-change">
            <i class="fas fa-percentage"></i>
            {((stats.pendingPayment / stats.total) * 100).toFixed(1)}% dari
            total
          </div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon">
          <i class="fas fa-cog"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{formatNumber(stats.inProduction)}</div>
          <div class="stat-label">Dalam Produksi</div>
          <div class="stat-change">
            <i class="fas fa-chart-line"></i>
            {((stats.inProduction / stats.total) * 100).toFixed(1)}% aktif
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="performance-section" transition:slide>
      <h3 class="section-title">📊 Metrik Performa</h3>
      <div class="performance-grid">
        <div class="performance-item">
          <div class="performance-icon success">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="performance-content">
            <div class="performance-value">
              {performanceMetrics.conversionRate.toFixed(1)}%
            </div>
            <div class="performance-label">Tingkat Penyelesaian</div>
          </div>
        </div>

        <div class="performance-item">
          <div
            class="performance-icon {performanceMetrics.growthRate >= 0
              ? 'success'
              : 'danger'}"
          >
            <i
              class="fas fa-trending-{performanceMetrics.growthRate >= 0
                ? 'up'
                : 'down'}"
            ></i>
          </div>
          <div class="performance-content">
            <div class="performance-value">
              {performanceMetrics.growthRate >= 0
                ? "+"
                : ""}{performanceMetrics.growthRate.toFixed(1)}%
            </div>
            <div class="performance-label">Pertumbuhan Bulanan</div>
          </div>
        </div>

        <div class="performance-item">
          <div class="performance-icon info">
            <i class="fas fa-stopwatch"></i>
          </div>
          <div class="performance-content">
            <div class="performance-value">
              {performanceMetrics.averageCompletionTime.toFixed(0)} hari
            </div>
            <div class="performance-label">Rata-rata Penyelesaian</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Distribution Charts -->
    <div class="charts-section" transition:slide>
      <div class="chart-container">
        <h4 class="chart-title">📈 Distribusi Status Pembayaran</h4>
        <div class="chart-content">
          {#each statusDistribution as item}
            <div class="chart-item">
              <div class="chart-bar">
                <div
                  class="chart-fill"
                  style="width: {item.percentage}%; background-color: {item.color};"
                ></div>
              </div>
              <div class="chart-label">
                <span class="chart-name">{item.label}</span>
                <span class="chart-value"
                  >{item.value} ({item.percentage.toFixed(1)}%)</span
                >
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="chart-container">
        <h4 class="chart-title">🏭 Distribusi Status Produksi</h4>
        <div class="chart-content">
          {#each productionDistribution as item}
            <div class="chart-item">
              <div class="chart-bar">
                <div
                  class="chart-fill"
                  style="width: {item.percentage}%; background-color: {item.color};"
                ></div>
              </div>
              <div class="chart-label">
                <span class="chart-name">{item.label}</span>
                <span class="chart-value"
                  >{item.value} ({item.percentage.toFixed(1)}%)</span
                >
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .order-stats {
    margin-bottom: 2rem;
  }

  .stats-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem;
    background: white;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    color: var(--neutral-600);
  }

  .loading-spinner {
    font-size: 1.5rem;
    color: var(--primary-500);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    border-radius: var(--border-radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--accent-color);
  }

  .stat-card.primary {
    --accent-color: var(--primary-500);
  }

  .stat-card.success {
    --accent-color: var(--success-base);
  }

  .stat-card.warning {
    --accent-color: var(--warning-base);
  }

  .stat-card.info {
    --accent-color: var(--info-base);
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: white;
    background: var(--accent-color);
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--neutral-600);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .stat-change {
    font-size: 0.75rem;
    color: var(--neutral-500);
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-change.positive {
    color: var(--success-base);
  }

  .performance-section {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin-bottom: 1rem;
  }

  .performance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .performance-item {
    background: white;
    border-radius: var(--border-radius-md);
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s ease;
  }

  .performance-item:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .performance-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: white;
    flex-shrink: 0;
  }

  .performance-icon.success {
    background: var(--success-base);
  }

  .performance-icon.danger {
    background: var(--error-base);
  }

  .performance-icon.info {
    background: var(--info-base);
  }

  .performance-content {
    flex: 1;
  }

  .performance-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin-bottom: 0.25rem;
  }

  .performance-label {
    font-size: 0.8125rem;
    color: var(--neutral-600);
    font-weight: 500;
  }

  .charts-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }

  .chart-container {
    background: white;
    border-radius: var(--border-radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
  }

  .chart-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin-bottom: 1.5rem;
  }

  .chart-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .chart-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .chart-bar {
    width: 100%;
    height: 8px;
    background: var(--neutral-200);
    border-radius: 4px;
    overflow: hidden;
  }

  .chart-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .chart-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chart-name {
    font-size: 0.875rem;
    color: var(--neutral-700);
    font-weight: 500;
  }

  .chart-value {
    font-size: 0.8125rem;
    color: var(--neutral-600);
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .performance-grid {
      grid-template-columns: 1fr;
    }

    .charts-section {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 1.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
    }
  }
</style>
