<!-- src/routes/payment-failed/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  // Get error info from URL params or localStorage
  let orderCode = "";
  let invoiceCode = "";
  let errorReason = "";
  let errorData: any = null;

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    orderCode = urlParams.get("order") || "";
    invoiceCode = urlParams.get("invoice") || "";
    errorReason = urlParams.get("reason") || "";

    // Check for stored error data
    const storedError = localStorage.getItem("orderError");
    if (storedError) {
      try {
        errorData = JSON.parse(storedError);
        localStorage.removeItem("orderError"); // Clean up
      } catch (e) {
        console.error("Failed to parse stored error:", e);
      }
    }

    // Auto-detect session errors from various sources
    if (!errorReason) {
      // Check if came from unauthorized access
      const referrer = document.referrer;
      if (referrer.includes("/admin") && !errorData) {
        errorReason = "session_expired";
      }

      // Check for auth-related errors in errorData
      if (
        errorData &&
        ["401", "403", "UNAUTHORIZED", "FORBIDDEN"].includes(errorData.status)
      ) {
        errorReason = "unauthorized";
      }
    }

    // Check if session tokens exist
    const hasSessionData =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("auth_token") ||
      document.cookie.includes("sessionid");

    if (
      !hasSessionData &&
      window.location.pathname.includes("payment-failed")
    ) {
      console.log("🔐 No session data found, likely a session timeout");
    }
  });

  // Animation delays
  let pageLoaded = false;
  onMount(() => {
    setTimeout(() => {
      pageLoaded = true;
    }, 100);
  });

  function goBackToAdmin() {
    goto("/admin/orders");
  }

  function goToDashboard() {
    goto("/admin");
  }

  function retryOperation() {
    // Clear any stored errors and go back
    localStorage.removeItem("orderError");
    goto("/admin/orders");
  }

  function getErrorTitle() {
    switch (errorReason) {
      case "order_creation_failed":
        return "Gagal Membuat Pesanan";
      case "payment_processing_failed":
        return "Gagal Memproses Pembayaran";
      case "server_error":
        return "Error Server";
      case "connection_failed":
        return "Koneksi Gagal";
      case "session_expired":
      case "unauthorized":
      case "logout":
        return "Sesi Login Berakhir";
      default:
        return "Operasi Gagal";
    }
  }

  function getErrorDescription() {
    switch (errorReason) {
      case "order_creation_failed":
        return "Terjadi kesalahan saat membuat pesanan. Data mungkin tidak tersimpan dengan benar.";
      case "payment_processing_failed":
        return "Link pembayaran tidak dapat dibuat atau ada masalah dengan gateway pembayaran.";
      case "server_error":
        return "Server mengalami gangguan. Tim IT telah diberitahu secara otomatis.";
      case "connection_failed":
        return "Tidak dapat terhubung ke server backend. Periksa status server.";
      case "session_expired":
      case "unauthorized":
      case "logout":
        return "Sesi login Anda telah berakhir atau Anda telah logout. Silakan login kembali untuk melanjutkan.";
      default:
        return "Operasi tidak dapat diselesaikan. Periksa log untuk detail lebih lanjut.";
    }
  }

  function isSessionError() {
    return (
      ["session_expired", "unauthorized", "logout"].includes(errorReason) ||
      (errorData && ["UNAUTHORIZED", "401"].includes(errorData.status))
    );
  }

  function goToLogin() {
    // Clear any stored session data
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies if any
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    goto("/login");
  }
</script>

<svelte:head>
  <title>Error Admin - Hay Hill Clothing</title>
  <meta name="description" content="Admin error page" />
</svelte:head>

<div class="admin-error-page">
  <div class="container">
    <div class="error-content">
      {#if pageLoaded}
        <!-- Error Icon -->
        <div
          class="error-icon"
          class:session-error={isSessionError()}
          in:fly={{ y: 50, delay: 200, duration: 600, easing: cubicOut }}
        >
          {#if isSessionError()}
            <i class="fas fa-user-times"></i>
          {:else}
            <i class="fas fa-exclamation-triangle"></i>
          {/if}
        </div>

        <!-- Error Message -->
        <div class="error-message" in:fade={{ delay: 400, duration: 600 }}>
          <h1 class="title">{getErrorTitle()}</h1>
          <p class="description">
            {getErrorDescription()}
          </p>
        </div>

        <!-- System Information -->
        <div
          class="system-info"
          in:fly={{ y: 20, delay: 600, duration: 400, easing: cubicOut }}
        >
          <div class="info-section">
            <h3><i class="fas fa-info-circle"></i> Informasi Error</h3>

            {#if errorData}
              <div class="info-item">
                <span class="label">Status Code:</span>
                <span class="value status-code"
                  >{errorData.status || "Unknown"}</span
                >
              </div>
              <div class="info-item">
                <span class="label">Pesan Error:</span>
                <span class="value error-msg">{errorData.message || "-"}</span>
              </div>
              <div class="info-item">
                <span class="label">Timestamp:</span>
                <span class="value"
                  >{new Date(errorData.timestamp).toLocaleString("id-ID")}</span
                >
              </div>
            {:else}
              <div class="info-item">
                <span class="label">Error Reason:</span>
                <span class="value">{errorReason || "Unknown"}</span>
              </div>
              <div class="info-item">
                <span class="label">Waktu:</span>
                <span class="value">{new Date().toLocaleString("id-ID")}</span>
              </div>
            {/if}

            {#if orderCode}
              <div class="info-item">
                <span class="label">Order Code:</span>
                <span class="value order-code">{orderCode}</span>
              </div>
            {/if}

            {#if invoiceCode}
              <div class="info-item">
                <span class="label">Invoice Code:</span>
                <span class="value invoice-code">{invoiceCode}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Admin Actions -->
        <div
          class="admin-actions"
          in:fly={{ y: 20, delay: 800, duration: 400, easing: cubicOut }}
        >
          <h3>
            {#if isSessionError()}
              <i class="fas fa-sign-in-alt"></i> Login Diperlukan
            {:else}
              <i class="fas fa-tools"></i> Tindakan Admin
            {/if}
          </h3>
          <div class="action-grid">
            {#if isSessionError()}
              <!-- Session Error Actions -->
              <button class="action-card login-primary" on:click={goToLogin}>
                <i class="fas fa-sign-in-alt"></i>
                <span>Login Kembali</span>
                <small>Login untuk melanjutkan akses admin</small>
              </button>

              <a href="/" class="action-card secondary">
                <i class="fas fa-home"></i>
                <span>Beranda</span>
                <small>Kembali ke halaman utama</small>
              </a>

              <button
                class="action-card accent"
                on:click={() => window.location.reload()}
              >
                <i class="fas fa-refresh"></i>
                <span>Refresh Halaman</span>
                <small>Muat ulang halaman</small>
              </button>
            {:else}
              <!-- Normal Error Actions -->
              <button class="action-card primary" on:click={retryOperation}>
                <i class="fas fa-redo"></i>
                <span>Coba Lagi</span>
                <small>Kembali ke form dan coba ulang</small>
              </button>

              <button class="action-card secondary" on:click={goBackToAdmin}>
                <i class="fas fa-arrow-left"></i>
                <span>Kembali ke Orders</span>
                <small>Lihat daftar pesanan</small>
              </button>

              <button class="action-card accent" on:click={goToDashboard}>
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
                <small>Ke halaman dashboard admin</small>
              </button>

              <a href="/admin/products" class="action-card neutral">
                <i class="fas fa-box"></i>
                <span>Kelola Produk</span>
                <small>Manajemen produk</small>
              </a>
            {/if}
          </div>
        </div>

        <!-- Troubleshooting -->
        <div
          class="troubleshooting"
          in:fly={{ y: 20, delay: 1000, duration: 400, easing: cubicOut }}
        >
          <h3>
            {#if isSessionError()}
              <i class="fas fa-user-cog"></i> Panduan Login
            {:else}
              <i class="fas fa-bug"></i> Troubleshooting
            {/if}
          </h3>
          <div class="troubleshooting-grid">
            {#if isSessionError()}
              <!-- Session Error Troubleshooting -->
              <div class="trouble-card session-card">
                <div class="trouble-header">
                  <i class="fas fa-clock"></i>
                  <h4>Session Expired</h4>
                </div>
                <ul>
                  <li>Login session telah berakhir otomatis</li>
                  <li>Biasanya terjadi setelah periode tidak aktif</li>
                  <li>Klik "Login Kembali" untuk melanjutkan</li>
                </ul>
              </div>

              <div class="trouble-card session-card">
                <div class="trouble-header">
                  <i class="fas fa-shield-alt"></i>
                  <h4>Security Features</h4>
                </div>
                <ul>
                  <li>Auto-logout setelah inaktif (keamanan)</li>
                  <li>Multiple browser tabs dapat conflict</li>
                  <li>Private browsing mode mempengaruhi session</li>
                </ul>
              </div>

              <div class="trouble-card session-card">
                <div class="trouble-header">
                  <i class="fas fa-key"></i>
                  <h4>Login Tips</h4>
                </div>
                <ul>
                  <li>Gunakan kredensial admin yang valid</li>
                  <li>Pastikan caps lock tidak aktif</li>
                  <li>Clear browser cache jika ada masalah</li>
                </ul>
              </div>
            {:else}
              <!-- Normal Troubleshooting -->
              <div class="trouble-card">
                <div class="trouble-header">
                  <i class="fas fa-server"></i>
                  <h4>Server Issues</h4>
                </div>
                <ul>
                  <li>Periksa status backend server</li>
                  <li>Cek log server untuk error details</li>
                  <li>Restart service jika diperlukan</li>
                </ul>
              </div>

              <div class="trouble-card">
                <div class="trouble-header">
                  <i class="fas fa-database"></i>
                  <h4>Database Issues</h4>
                </div>
                <ul>
                  <li>Verifikasi koneksi database</li>
                  <li>Cek kapasitas storage</li>
                  <li>Review database logs</li>
                </ul>
              </div>

              <div class="trouble-card">
                <div class="trouble-header">
                  <i class="fas fa-credit-card"></i>
                  <h4>Payment Gateway</h4>
                </div>
                <ul>
                  <li>Cek status Xendit API</li>
                  <li>Verifikasi API credentials</li>
                  <li>Test payment gateway connection</li>
                </ul>
              </div>

              <div class="trouble-card">
                <div class="trouble-header">
                  <i class="fas fa-wifi"></i>
                  <h4>Network Issues</h4>
                </div>
                <ul>
                  <li>Test koneksi internet</li>
                  <li>Ping backend server</li>
                  <li>Cek firewall settings</li>
                </ul>
              </div>
            {/if}
          </div>
        </div>

        <!-- System Status -->
        <div class="system-status" in:fade={{ delay: 1200, duration: 400 }}>
          <div class="status-grid">
            <div class="status-card">
              <h4><i class="fas fa-chart-line"></i> System Health</h4>
              <div class="status-indicators">
                <div class="status-item">
                  <span class="indicator green"></span>
                  <span>Frontend: Online</span>
                </div>
                <div class="status-item">
                  <span class="indicator unknown"></span>
                  <span>Backend: Unknown</span>
                </div>
                <div class="status-item">
                  <span class="indicator unknown"></span>
                  <span>Database: Unknown</span>
                </div>
                <div class="status-item">
                  <span class="indicator unknown"></span>
                  <span>Payment Gateway: Unknown</span>
                </div>
                <div class="status-item">
                  <span class="indicator {isSessionError() ? 'red' : 'unknown'}"
                  ></span>
                  <span
                    >Admin Session: {isSessionError()
                      ? "Expired"
                      : "Unknown"}</span
                  >
                </div>
              </div>
            </div>

            <div class="status-card">
              <h4><i class="fas fa-clock"></i> Quick Info</h4>
              <div class="quick-info">
                <div class="info-row">
                  <span>Environment:</span>
                  <span>Development</span>
                </div>
                <div class="info-row">
                  <span>User Agent:</span>
                  <span>{navigator.userAgent.split(" ")[0]}</span>
                </div>
                <div class="info-row">
                  <span>Session Status:</span>
                  <span class:session-expired={isSessionError()}>
                    {isSessionError() ? "Expired/Logout" : "Unknown"}
                  </span>
                </div>
                {#if isSessionError()}
                  <div class="info-row">
                    <span>Last Activity:</span>
                    <span>{new Date().toLocaleTimeString("id-ID")}</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .admin-error-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 2rem 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .error-content {
    text-align: center;
  }

  .error-icon {
    margin-bottom: 2rem;
  }

  .error-icon i {
    font-size: 4rem;
    color: #f59e0b;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .error-icon.session-error i {
    color: #dc2626;
  }

  .error-message {
    margin-bottom: 3rem;
  }

  .title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 1rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .description {
    font-size: 1.125rem;
    color: #374151;
    margin: 0;
    max-width: 700px;
    margin: 0 auto;
    line-height: 1.6;
    font-weight: 500;
  }

  .system-info {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 3rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    text-align: left;
  }

  .info-section h3 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-section h3 i {
    color: #2563eb;
    font-weight: 600;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 0.9rem;
    color: #4b5563;
    font-weight: 600;
  }

  .value {
    font-size: 0.9rem;
    color: #111827;
    font-weight: 700;
  }

  .status-code {
    background: #fee2e2;
    color: #991b1b;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    font-family: "Courier New", monospace;
    font-weight: 700;
    border: 1px solid #fca5a5;
  }

  .error-msg {
    background: #fef3c7;
    color: #92400e;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    max-width: 300px;
    text-align: right;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid #f59e0b;
  }

  .order-code,
  .invoice-code {
    font-family: "Courier New", monospace;
    background: #dbeafe;
    color: #1d4ed8;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .admin-actions {
    margin-bottom: 3rem;
    text-align: left;
  }

  .admin-actions h3 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.5rem 0;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .admin-actions h3 i {
    color: #7c3aed;
    font-weight: 600;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .action-card {
    background: white;
    border: none;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .action-card i {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .action-card span {
    font-weight: 600;
    font-size: 1rem;
  }

  .action-card small {
    color: #4b5563;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .action-card.primary {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    color: white;
    border: 1px solid #3b82f6;
  }

  .action-card.primary small {
    color: rgba(255, 255, 255, 0.9);
  }

  .action-card.secondary {
    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    color: white;
    border: 1px solid #6b7280;
  }

  .action-card.secondary small {
    color: rgba(255, 255, 255, 0.9);
  }

  .action-card.accent {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: white;
    border: 1px solid #8b5cf6;
  }

  .action-card.accent small {
    color: rgba(255, 255, 255, 0.9);
  }

  .action-card.neutral {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    border: 1px solid #10b981;
  }

  .action-card.neutral small {
    color: rgba(255, 255, 255, 0.9);
  }

  .action-card.login-primary {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: white;
    border: 2px solid #ef4444;
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  }

  .action-card.login-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(220, 38, 38, 0.4);
  }

  .action-card.login-primary small {
    color: rgba(255, 255, 255, 0.95);
  }

  .troubleshooting {
    margin-bottom: 3rem;
    text-align: left;
  }

  .troubleshooting h3 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.5rem 0;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .troubleshooting h3 i {
    color: #dc2626;
    font-weight: 600;
  }

  .troubleshooting-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .trouble-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #f59e0b;
    border: 1px solid #e5e7eb;
  }

  .trouble-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .trouble-header i {
    color: #d97706;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .trouble-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
  }

  .trouble-card ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .trouble-card li {
    color: #374151;
    margin-bottom: 0.5rem;
    line-height: 1.6;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .session-card {
    border-left: 4px solid #dc2626;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  }

  .session-card .trouble-header i {
    color: #b91c1c;
  }

  .session-card .trouble-header h4 {
    color: #7f1d1d;
  }

  .session-card li {
    color: #7f1d1d;
  }

  .system-status {
    text-align: left;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .status-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .status-card h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-card h4 i {
    color: #2563eb;
    font-weight: 600;
  }

  .status-indicators {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: #1f2937;
    font-weight: 500;
  }

  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .indicator.green {
    background: #10b981;
  }

  .indicator.red {
    background: #ef4444;
  }

  .indicator.yellow {
    background: #f59e0b;
  }

  .indicator.unknown {
    background: #6b7280;
  }

  .quick-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .info-row span:first-child {
    color: #4b5563;
    font-weight: 500;
  }

  .info-row span:last-child {
    color: #111827;
    font-weight: 600;
    font-family: "Courier New", monospace;
  }

  .info-row span.session-expired {
    color: #dc2626;
    font-weight: 700;
    font-family: inherit;
  }

  @media (max-width: 768px) {
    .admin-error-page {
      padding: 1rem 0;
    }

    .title {
      font-size: 2rem;
    }

    .description {
      font-size: 1rem;
    }

    .error-icon i {
      font-size: 3rem;
    }

    .system-info {
      padding: 1.5rem;
    }

    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 1rem 0;
    }

    .value {
      text-align: left;
    }

    .action-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .action-card {
      padding: 1.25rem;
    }

    .troubleshooting-grid {
      grid-template-columns: 1fr;
    }

    .trouble-card {
      padding: 1.25rem;
    }

    .status-grid {
      grid-template-columns: 1fr;
    }

    .status-card {
      padding: 1.25rem;
    }
  }
</style>
