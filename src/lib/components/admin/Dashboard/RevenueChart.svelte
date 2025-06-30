<!-- src/lib/components/admin/Dashboard/RevenueChart.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Chart from "chart.js/auto";
  import { scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import type { ChartData } from "$lib/types/chart";

  export let data: ChartData;
  export let period: string = "week";

  // Chart options and configuration
  let chartCanvas: HTMLCanvasElement;
  let chartInstance: Chart | null = null;
  let chartVisible = false;

  // Format currency function
  function formatCurrency(value: number): string {
    if (value >= 1000000) {
      return "Rp " + (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      return "Rp " + (value / 1000).toFixed(0) + "K";
    }
    return "Rp " + value.toLocaleString("id-ID");
  }

  // Initialize and update chart
  function initChart() {
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;

    console.log("Initializing chart with data:", data);

    // Destroy existing chart if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Create new chart
    chartInstance = new Chart(ctx, {
      type: "line",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "white",
            titleColor: "#171717",
            bodyColor: "#404040",
            borderColor: "#e5e5e5",
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: function (context: any) {
                return "Revenue: " + formatCurrency(context.parsed.y);
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value: any) {
                return formatCurrency(Number(value));
              },
            },
          },
        },
      },
    });

    // Make chart visible after initialization
    chartVisible = true;
  }

  // Change data based on period
  function updateChartPeriod(newPeriod: string) {
    period = newPeriod;

    // In a real app, you would fetch data from API here
    // For now just simulate by updating the chart if it exists
    if (chartInstance) {
      console.log(`Updating chart for ${newPeriod} period`);
      chartInstance.update();
    }
  }

  // Calculate total and average revenue
  $: totalRevenue =
    data?.datasets?.[0]?.data?.reduce((sum, value) => sum + value, 0) || 0;
  $: averageRevenue = totalRevenue / (data?.datasets?.[0]?.data?.length || 1);

  // Initialize chart on mount with a slight delay
  onMount(() => {
    console.log("Component mounted");
    setTimeout(() => {
      initChart();
    }, 100);
  });

  // Clean up on component destruction
  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  });
</script>

<div class="chart-container card">
  <div class="chart-header">
    <div>
      <h3 class="chart-title">Revenue Overview</h3>
      <p class="chart-subtitle">Summary of revenue performance</p>
    </div>

    <div class="chart-options">
      <button
        class="chart-option"
        class:active={period === "week"}
        on:click={() => updateChartPeriod("week")}
      >
        Week
      </button>
      <button
        class="chart-option"
        class:active={period === "month"}
        on:click={() => updateChartPeriod("month")}
      >
        Month
      </button>
      <button
        class="chart-option"
        class:active={period === "year"}
        on:click={() => updateChartPeriod("year")}
      >
        Year
      </button>
    </div>
  </div>

  <div class="stats-summary">
    <div class="summary-item">
      <div class="summary-label">Total Revenue</div>
      <div class="summary-value">{formatCurrency(totalRevenue)}</div>
    </div>
    <div class="divider"></div>
    <div class="summary-item">
      <div class="summary-label">Average Revenue</div>
      <div class="summary-value">{formatCurrency(averageRevenue)}</div>
    </div>
    <div class="divider"></div>
    <div class="summary-item">
      <div class="summary-label">Highest Day</div>
      <div class="summary-value">
        {#if data?.datasets?.[0]?.data?.length}
          {formatCurrency(Math.max(...data.datasets[0].data))}
        {:else}
          Rp 0
        {/if}
      </div>
    </div>
  </div>

  <div class="chart-wrapper">
    <!-- Debug indicator to see if the chart canvas is rendered -->
    {#if !chartVisible}
      <div class="loading-indicator">Initializing chart...</div>
    {/if}

    <div
      class="chart-inner"
      transition:scale={{
        duration: 400,
        opacity: 0.5,
        start: 0.95,
        easing: quintOut,
      }}
    >
      <canvas bind:this={chartCanvas}></canvas>
    </div>
  </div>
</div>

<style>
  /* Chart Container */
  .chart-container {
    background: white;
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    margin-bottom: 2rem;
    box-shadow: var(--shadow-md);
  }

  /* Chart Header */
  .chart-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--neutral-100);
  }

  .chart-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin: 0;
    margin-bottom: 0.25rem;
  }

  .chart-subtitle {
    font-size: 0.875rem;
    color: var(--neutral-500);
    margin: 0;
  }

  /* Chart Options */
  .chart-options {
    display: flex;
    gap: 0.5rem;
  }

  .chart-option {
    padding: 0.5rem 0.875rem;
    border-radius: var(--border-radius-md);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--neutral-200);
    background: white;
    color: var(--neutral-600);
    transition: all 0.2s ease;
  }

  .chart-option:hover {
    background: var(--neutral-50);
    color: var(--primary-600);
    border-color: var(--primary-200);
  }

  .chart-option.active {
    background: var(--primary-50);
    color: var(--primary-700);
    border-color: var(--primary-200);
  }

  /* Stats Summary */
  .stats-summary {
    display: flex;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--neutral-100);
    background: var(--neutral-50);
  }

  .summary-item {
    flex: 1;
    min-width: 0;
  }

  .summary-label {
    font-size: 0.75rem;
    color: var(--neutral-500);
    margin-bottom: 0.25rem;
  }

  .summary-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--neutral-900);
  }

  .divider {
    width: 1px;
    background: var(--neutral-200);
    margin: 0 1.5rem;
  }

  /* Chart Wrapper */
  .chart-wrapper {
    padding: 1.5rem;
    height: 350px;
    position: relative;
  }

  .chart-inner {
    height: 100%;
    width: 100%;
    position: relative;
  }

  .loading-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--neutral-500);
    font-size: 0.875rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .chart-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .stats-summary {
      flex-direction: column;
      gap: 1rem;
    }

    .divider {
      width: 100%;
      height: 1px;
      margin: 0;
    }

    .chart-wrapper {
      height: 250px;
    }
  }
</style>
