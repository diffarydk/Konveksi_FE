<!-- src/lib/components/admin/Dashboard/StatCards.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { StatCard } from '$lib/types/stat-card';
  
  export let data: StatCard[] = [];
  
  // Animation references
  let statElements: HTMLElement[] = [];
  let cardsVisible = false;
  
  // Function to format numbers with commas
  function formatNumber(value: string): string {
    // Extract only the numeric part for formatting
    const numericPart = value.match(/[\d,]+(\.\d+)?/);
    if (!numericPart) return value;
    
    // Get the prefix (currency symbol, etc.)
    const prefix = value.substring(0, value.indexOf(numericPart[0]));
    
    // Get the suffix (if any)
    const suffix = value.substring(value.indexOf(numericPart[0]) + numericPart[0].length);
    
    // Format the number with commas
    const number = parseFloat(numericPart[0].replace(/,/g, ''));
    const formattedNumber = number.toLocaleString('id-ID');
    
    return prefix + formattedNumber + suffix;
  }
  
  // Simple animation for numbers
  function animateValue(element: HTMLElement, startValue: number, endValue: number, duration: number, prefix: string = '', suffix: string = '') {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
      element.textContent = `${prefix}${currentValue.toLocaleString('id-ID')}${suffix}`;
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
  
  // Get icon background class
  function getIconClass(className: string): string {
    switch (className) {
      case 'primary':
        return 'bg-primary-100 text-primary-600';
      case 'success':
        return 'bg-success-light text-success-base';
      case 'warning':
        return 'bg-warning-light text-warning-base';
      case 'danger':
        return 'bg-error-light text-error-base';
      case 'info':
        return 'bg-info-light text-info-base';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  }
  
  // Format change indicator
  function formatChange(change: { value: string, isPositive: boolean, text: string }): string {
    return `${change.isPositive ? '+' : ''}${change.value} ${change.text}`;
  }
  
  onMount(() => {
    // Animate stats becoming visible
    setTimeout(() => {
      cardsVisible = true;
    }, 100);
    
    // Animate each stat card value
    statElements.forEach((element, index) => {
      const statValue = data[index].value;
      
      // Extract numeric part for animation
      const numericMatch = statValue.match(/[\d,]+/);
      if (numericMatch) {
        // Convert to number after removing commas
        const numericValue = parseInt(numericMatch[0].replace(/,/g, ''));
        
        // Extract prefix/suffix correctly
        const prefix = statValue.split(numericMatch[0])[0] || '';
        const suffix = statValue.split(numericMatch[0])[1] || '';
        
        // Animate value from 0 to target
        animateValue(element, 0, numericValue, 1500, prefix, suffix);
      } else {
        // No numeric part found, just set the content directly
        element.textContent = statValue;
      }
    });
  });
</script>

<div class="stats-section">
  <div class="stats-grid">
    {#each data as stat, i}
      {#if cardsVisible}
        <div 
          class="stat-card" 
          in:fly={{ y: 20, delay: i * 75, duration: 400, easing: cubicOut }}
        >
          <div class="stat-content">
            <div class="stat-header">
              <span class="stat-title">{stat.title}</span>
              <div class="stat-icon {getIconClass(stat.iconClass)}">
                <i class={stat.icon}></i>
              </div>
            </div>
            
            <div class="stat-value-wrapper">
              <div class="stat-value" bind:this={statElements[i]}>
                {stat.value}
              </div>
              
              {#if stat.change}
                <div class="stat-change {stat.change.isPositive ? 'positive' : 'negative'}">
                  <i class="fas {stat.change.isPositive ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                  <span>{formatChange(stat.change)}</span>
                </div>
              {/if}
            </div>
          </div>
          
          <div class="stat-footer">
            <div class="stat-actions">
              <button class="stat-action-btn">
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
            
            <!-- Dynamic decorative elements -->
            <div class="decoration-element" style="--rotation: {15 + (i * 10)}deg; --start-color: var(--primary-100); --end-color: var(--primary-50);"></div>
            <div class="decoration-circle" style="--size: {30 + (i * 5)}px; --x-pos: {70 + (i * 5)}%; --y-pos: {20 - (i * 3)}%;"></div>
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  /* Stats Section */
  .stats-section {
    margin-bottom: 2rem;
  }
  
  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  /* Stat Card */
  .stat-card {
    background: white;
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 1;
    background-image: linear-gradient(135deg, white 0%, var(--neutral-50) 100%);
  }

  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
  
  .stat-content {
    position: relative;
    z-index: 2;
  }

  /* Stat Header */
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .stat-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--neutral-600);
  }

  /* Stat Icon */
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: transform 0.3s;
  }
  
  .stat-card:hover .stat-icon {
    transform: scale(1.1);
  }
  
  /* Primary Colors */
  .bg-primary-100 { background-color: var(--primary-100); }
  .text-primary-600 { color: var(--primary-600); }
  
  /* Success Colors */
  .bg-success-light { background-color: var(--success-light); }
  .text-success-base { color: var(--success-base); }
  
  /* Warning Colors */
  .bg-warning-light { background-color: var(--warning-light); }
  .text-warning-base { color: var(--warning-base); }
  
  /* Error Colors */
  .bg-error-light { background-color: var(--error-light); }
  .text-error-base { color: var(--error-base); }
  
  /* Info Colors */
  .bg-info-light { background-color: var(--info-light); }
  .text-info-base { color: var(--info-base); }

  /* Stat Value */
  .stat-value-wrapper {
    margin-bottom: 1rem;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }

  /* Stat Change */
  .stat-change {
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-weight: 500;
  }

  .stat-change.positive {
    color: var(--success-base);
  }

  .stat-change.negative {
    color: var(--error-base);
  }
  
  /* Stat Footer */
  .stat-footer {
    display: flex;
    justify-content: flex-end;
    position: relative;
    z-index: 2;
  }
  
  .stat-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .stat-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: var(--primary-50);
    color: var(--primary-600);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0;
    transform: translateX(10px);
  }
  
  .stat-card:hover .stat-action-btn {
    opacity: 1;
    transform: translateX(0);
  }
  
  .stat-action-btn:hover {
    background: var(--primary-100);
    color: var(--primary-700);
  }
  
  /* Decorative Elements */
  .decoration-element {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 150px;
    height: 150px;
    background: linear-gradient(var(--rotation), var(--start-color), var(--end-color));
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    z-index: 0;
    opacity: 0.4;
    transform: translate(30%, 30%);
    transition: transform 0.5s ease-out;
  }
  
  .stat-card:hover .decoration-element {
    transform: translate(25%, 25%) rotate(10deg);
  }
  
  .decoration-circle {
    position: absolute;
    width: var(--size);
    height: var(--size);
    background: var(--primary-100);
    border-radius: 50%;
    top: var(--y-pos);
    left: var(--x-pos);
    z-index: 0;
    opacity: 0.3;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .stat-card {
      padding: 1.25rem;
    }
    
    .stat-value {
      font-size: 1.5rem;
    }
    
    .stat-icon {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }
  }
</style>