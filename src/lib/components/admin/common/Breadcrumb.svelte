<!-- src/lib/components/admin/common/Breadcrumb.svelte -->
<script lang="ts">
  interface BreadcrumbItem {
    label: string;
    link?: string;
    active?: boolean;
  }
  
  export let items: BreadcrumbItem[] = [];
</script>

<div class="breadcrumb">
  {#each items as item, index}
    {#if item.active}
      <span>{item.label}</span>
    {:else if item.link}
      <a href={item.link}>{item.label}</a>
    {:else}
      <span>{item.label}</span>
    {/if}
    
    {#if index < items.length - 1}
      <span class="separator">/</span>
    {/if}
  {/each}
</div>

<style>
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--gray-500);
    margin-top: 0.5rem;
  }

  .breadcrumb a {
    color: var(--gray-500);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    color: var(--primary);
  }

  .separator {
    color: var(--gray-400);
  }
</style>