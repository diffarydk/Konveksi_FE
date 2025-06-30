<script lang="ts">
  export let size: "sm" | "md" | "lg" = "md";
  export let color: string = "var(--primary)";
</script>

<div class="loading-spinner {size}" style="color: {color}">
  <div class="spinner"></div>
</div>

<style>
  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-left-color: currentColor;
    border-radius: 50%;
    animation: spin 1s ease infinite;
  }

  .sm .spinner {
    width: 1rem;
    height: 1rem;
    border-width: 2px;
  }

  .lg .spinner {
    width: 3rem;
    height: 3rem;
    border-width: 4px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
