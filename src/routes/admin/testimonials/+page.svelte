<script lang="ts">
  import { fade } from "svelte/transition";
</script>

<div class="page-container">
  <div class="development-notice" transition:fade>
    <div class="notice-icon">
      <i class="fas fa-tools"></i>
    </div>
    <h1>Kelola Testimoni</h1>
    <h2>Masih dalam tahap pengembangan</h2>
    <p>
      Fitur testimoni sedang dalam proses pengembangan dan akan segera tersedia.
    </p>
  </div>
</div>

<style>
  .page-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    padding: 2rem;
  }

  .development-notice {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    max-width: 500px;
    width: 100%;
  }

  .notice-icon {
    margin-bottom: 1.5rem;
  }

  .notice-icon i {
    font-size: 3rem;
    color: #3b82f6;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
  }

  p {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .page-container {
      padding: 1rem;
    }

    .development-notice {
      padding: 2rem 1.5rem;
    }

    .notice-icon i {
      font-size: 2.5rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    h2 {
      font-size: 1.125rem;
    }

    p {
      font-size: 0.875rem;
    }
  }
</style>
