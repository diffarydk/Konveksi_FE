<!-- src/routes/payment-success/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  // Get order code from URL params
  let orderCode = "";
  let invoiceCode = "";

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    orderCode = urlParams.get("order") || "";
    invoiceCode = urlParams.get("invoice") || "";
  });

  // Animation delays
  let pageLoaded = false;
  onMount(() => {
    setTimeout(() => {
      pageLoaded = true;
    }, 100);
  });
</script>

<svelte:head>
  <title>Pembayaran Berhasil - Hay Hill Clothing</title>
  <meta name="description" content="Pembayaran Anda telah berhasil diproses" />
</svelte:head>

<div class="success-page">
  <div class="container">
    <div class="success-content">
      {#if pageLoaded}
        <!-- Success Icon -->
        <div
          class="success-icon"
          in:fly={{ y: 50, delay: 200, duration: 600, easing: cubicOut }}
        >
          <i class="fas fa-check-circle"></i>
        </div>

        <!-- Success Message -->
        <div class="success-message" in:fade={{ delay: 400, duration: 600 }}>
          <h1 class="title">Pembayaran Berhasil!</h1>
          <p class="description">
            Terima kasih! Pembayaran Anda telah berhasil diproses dan pesanan
            Anda sedang dipersiapkan.
          </p>
        </div>

        <!-- Order Information -->
        <div
          class="order-info"
          in:fly={{ y: 20, delay: 600, duration: 400, easing: cubicOut }}
        >
          {#if orderCode}
            <div class="info-item">
              <span class="label">Kode Pesanan:</span>
              <span class="value order-code">{orderCode}</span>
            </div>
          {/if}

          {#if invoiceCode}
            <div class="info-item">
              <span class="label">Kode Invoice:</span>
              <span class="value invoice-code">{invoiceCode}</span>
            </div>
          {/if}

          <div class="info-item">
            <span class="label">Status:</span>
            <span class="value status-paid">Pembayaran Diterima</span>
          </div>

          <div class="info-item">
            <span class="label">Waktu:</span>
            <span class="value"
              >{new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</span
            >
          </div>
        </div>

        <!-- Next Steps -->
        <div
          class="next-steps"
          in:fly={{ y: 20, delay: 800, duration: 400, easing: cubicOut }}
        >
          <h2 class="steps-title">Langkah Selanjutnya</h2>
          <div class="steps-list">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Konfirmasi Pesanan</h3>
                <p>
                  Tim kami akan mengkonfirmasi pesanan dan memulai proses
                  produksi
                </p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Proses Produksi</h3>
                <p>
                  Pesanan Anda akan diproduksi sesuai spesifikasi dan kualitas
                  terbaik
                </p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Pengiriman</h3>
                <p>
                  Setelah selesai, pesanan akan dikirim ke alamat yang telah
                  ditentukan
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="action-buttons"
          in:fly={{ y: 20, delay: 1000, duration: 400, easing: cubicOut }}
        >
          {#if orderCode}
            <a href="/tracking?code={orderCode}" class="btn btn-primary">
              <i class="fas fa-search"></i>
              Lacak Pesanan
            </a>
          {/if}

          <a href="/" class="btn btn-secondary">
            <i class="fas fa-home"></i>
            Kembali ke Beranda
          </a>

          <a href="https://wa.me/6281234567890" class="btn btn-whatsapp">
            <i class="fab fa-whatsapp"></i>
            Hubungi Kami
          </a>
        </div>

        <!-- Additional Information -->
        <div class="additional-info" in:fade={{ delay: 1200, duration: 400 }}>
          <div class="info-card">
            <h3>Informasi Penting</h3>
            <ul>
              <li>Simpan kode pesanan untuk melacak status pesanan Anda</li>
              <li>
                Anda akan menerima notifikasi via WhatsApp/Email untuk update
                status
              </li>
              <li>
                Proses produksi memakan waktu 3-7 hari kerja tergantung jenis
                pesanan
              </li>
              <li>Hubungi customer service jika ada pertanyaan</li>
            </ul>
          </div>

          <div class="info-card">
            <h3>Butuh Bantuan?</h3>
            <p>Tim customer service kami siap membantu Anda:</p>
            <div class="contact-info">
              <div class="contact-item">
                <i class="fab fa-whatsapp"></i>
                <span>WhatsApp: +62 812-3456-7890</span>
              </div>
              <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <span>Email: info@hayhillclothing.com</span>
              </div>
              <div class="contact-item">
                <i class="fas fa-clock"></i>
                <span>Jam Operasional: 08:00 - 17:00 WIB</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .success-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #d1fae5 0%, #eff6ff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .success-content {
    text-align: center;
  }

  .success-icon {
    margin-bottom: 2rem;
  }

  .success-icon i {
    font-size: 5rem;
    color: var(--success);
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .success-message {
    margin-bottom: 3rem;
  }

  .title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-dark);
    margin: 0 0 1rem 0;
  }

  .description {
    font-size: 1.125rem;
    color: var(--text-light);
    margin: 0;
    max-width: 600px;
    margin: 0 auto;
  }

  .order-info {
    background: var(--white);
    border-radius: var(--border-radius-xl);
    padding: 2rem;
    margin-bottom: 3rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid #a7f3d0;
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
    font-size: 0.875rem;
    color: var(--text-light);
    font-weight: 500;
  }

  .value {
    font-size: 0.875rem;
    color: var(--text-dark);
    font-weight: 600;
  }

  .order-code,
  .invoice-code {
    font-family: "Courier New", monospace;
    background: #dbeafe;
    color: #1d4ed8;
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius);
  }

  .status-paid {
    color: var(--success);
  }

  .next-steps {
    text-align: left;
    margin-bottom: 3rem;
  }

  .steps-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .step-item {
    display: flex;
    gap: 1rem;
    background: var(--white);
    padding: 1.5rem;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-sm);
    border-left: 4px solid var(--success);
  }

  .step-number {
    width: 40px;
    height: 40px;
    background: var(--success);
    color: var(--white);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .step-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 0.5rem 0;
  }

  .step-content p {
    font-size: 0.875rem;
    color: var(--text-light);
    margin: 0;
    line-height: 1.5;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 3rem;
  }

  .btn {
    padding: 0.875rem 1.5rem;
    border-radius: var(--border-radius-lg);
    border: none;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    min-width: 150px;
    justify-content: center;
  }

  .btn-primary {
    background: var(--primary);
    color: var(--white);
  }

  .btn-primary:hover {
    background: var(--primary-dark);
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .btn-secondary {
    background: #f3f4f6;
    color: var(--text-light);
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
    transform: translateY(-2px);
  }

  .btn-whatsapp {
    background: #25d366;
    color: var(--white);
  }

  .btn-whatsapp:hover {
    background: #128c7e;
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .additional-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    text-align: left;
  }

  .info-card {
    background: var(--white);
    border-radius: var(--border-radius-lg);
    padding: 2rem;
    box-shadow: var(--shadow-sm);
  }

  .info-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 1rem 0;
  }

  .info-card ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .info-card li {
    margin-bottom: 0.5rem;
    color: var(--text-light);
    line-height: 1.5;
  }

  .info-card p {
    color: var(--text-light);
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-light);
    font-size: 0.875rem;
  }

  .contact-item i {
    width: 20px;
    color: var(--primary);
  }

  @media (max-width: 768px) {
    .title {
      font-size: 2rem;
    }

    .success-icon i {
      font-size: 4rem;
    }

    .order-info {
      padding: 1.5rem;
    }

    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .value {
      text-align: left;
    }

    .step-item {
      flex-direction: column;
      text-align: center;
    }

    .step-content {
      text-align: left;
    }

    .action-buttons {
      flex-direction: column;
      align-items: center;
    }

    .btn {
      width: 100%;
      max-width: 300px;
    }

    .additional-info {
      grid-template-columns: 1fr;
    }
  }
</style>
