<!-- Komponen Notifikasi Toast yang Reusable -->
<script lang="ts">
  import { fade } from "svelte/transition";
  import { settingsStore } from "$lib/stores/settings";

  // Subscribe ke notification state dari store yang benar
  let notification = settingsStore.notification;

  function handleClose() {
    settingsStore.hideNotification();
  }

  function getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };
    return icons[type] || "fas fa-info-circle";
  }
</script>

{#if $notification.visible}
  <div
    class="notification {$notification.type}"
    transition:fade={{ duration: 300 }}
  >
    <div class="notification-content">
      <i class={getIcon($notification.type)}></i>
      <span class="notification-message">{$notification.message}</span>
    </div>
    <button
      class="notification-close"
      on:click={handleClose}
      aria-label="Tutup notifikasi"
    >
      <i class="fas fa-times"></i>
    </button>
  </div>
{/if}

<style>
  .notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 9999;
    min-width: 320px;
    max-width: 500px;
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-lg);
    border-left: 4px solid;
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    animation: slideIn 0.3s ease-out;
  }

  .notification.success {
    background: rgba(240, 253, 244, 0.95);
    border-left-color: var(--success-base);
    color: var(--success-dark);
  }

  .notification.error {
    background: rgba(254, 242, 242, 0.95);
    border-left-color: var(--error-base);
    color: var(--error-dark);
  }

  .notification.warning {
    background: rgba(255, 251, 235, 0.95);
    border-left-color: var(--warning-base);
    color: var(--warning-dark);
  }

  .notification.info {
    background: rgba(239, 246, 255, 0.95);
    border-left-color: var(--primary-base);
    color: var(--primary-dark);
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .notification-content i {
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .notification-message {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    padding: 0.25rem;
    border-radius: var(--border-radius-sm);
    margin-left: 1rem;
    flex-shrink: 0;
  }

  .notification-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .notification {
      top: 1rem;
      right: 1rem;
      left: 1rem;
      min-width: auto;
      max-width: none;
    }
  }
</style>
