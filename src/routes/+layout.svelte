<!-- src/routes/+layout.svelte -->
<script>
  import "../app.css";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  // Initialize WebSocket store sync (listener only) on app startup
  onMount(async () => {
    if (browser) {
      try {
        const { initializeWebSocketStoreSync } = await import(
          "$lib/stores/websocketStore"
        );
        await initializeWebSocketStoreSync();
        console.log(
          "🚀 App initialized with WebSocket store sync (listener mode)"
        );
      } catch (error) {
        console.error("❌ Failed to initialize WebSocket store sync:", error);
      }
    }
  });
</script>

<!-- PENTING: Slot ini diperlukan untuk merender konten halaman -->
<slot />

<style>
  /* Global layout styles jika diperlukan */
  :global(html, body) {
    height: 100%;
  }
</style>
