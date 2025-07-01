<script lang="ts">
  import { onMount } from "svelte";

  interface FooterLink {
    text: string;
    url: string;
  }

  interface SocialLink {
    icon: string;
    url: string;
    name: string;
  }

  const footerLinks = [
    { text: "Beranda", url: "#home" },
    { text: "Produk", url: "#products" },
    { text: "Cara Order", url: "#order-process" },
    { text: "Tentang Kami", url: "#about" },
    { text: "Kontak", url: "#contact" },
    { text: "FAQ", url: "#faq" },
  ];

  const socialLinks: SocialLink[] = [
    { icon: "fab fa-instagram", url: "#", name: "Instagram" },
    {
      icon: "fab fa-whatsapp",
      url: "https://wa.me/6287776299650",
      name: "WhatsApp",
    },
    { icon: "fab fa-facebook-f", url: "#", name: "Facebook" },
    { icon: "fab fa-youtube", url: "#", name: "YouTube" },
    { icon: "fab fa-tiktok", url: "#", name: "TikTok" },
  ];

  const quickContacts = [
    {
      icon: "fab fa-whatsapp",
      text: "WhatsApp",
      value: "+62 877-7629-9650",
      link: "https://wa.me/6287776299650",
    },
    {
      icon: "fas fa-envelope",
      text: "Email",
      value: "diffarydzikrik23@gmail.com",
      link: "mailto:diffarydzikrik23@gmail.com",
    },
    {
      icon: "fas fa-map-marker-alt",
      text: "Lokasi",
      value: "Bandung, Jawa Barat, Indonesia",
      link: "#address",
    },
  ];

  let email = "";
  let isSubscribing = false;
  let subscribeMessage = "";
  let currentYear = new Date().getFullYear();

  async function subscribeNewsletter() {
    if (!email) {
      subscribeMessage = "Mohon masukkan email Anda";
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      subscribeMessage = "Format email tidak valid";
      return;
    }

    isSubscribing = true;
    subscribeMessage = "";

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    subscribeMessage = "Berhasil! Terima kasih sudah berlangganan.";
    email = "";
    isSubscribing = false;

    setTimeout(() => {
      subscribeMessage = "";
    }, 4000);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

{@html "<!--Footer.svelte-->"}

<footer class="footer">
  <!-- Main Footer Content -->
  <div class="footer-main">
    <div class="container">
      <div class="footer-content">
        <!-- Brand & Contact Section -->
        <div class="footer-brand">
          <div class="brand-info">
            <div class="logo">
              <img src="images/logo.jpg" alt="Hay Hill Clothing" />
              <div class="logo-text">
                <span class="brand-name">Hay Hill Clothing</span>
                <span class="brand-tagline">Premium Quality Since 2010</span>
              </div>
            </div>

            <p class="brand-description">
              Mitra terpercaya untuk kebutuhan pakaian berkualitas premium.
              Melayani seragam kantor, kaos custom, dan merchandise branded.
            </p>
          </div>

          <!-- Contact Info -->
          <div class="contact-section">
            <h4>Hubungi Kami</h4>
            <div class="contact-grid">
              {#each quickContacts as contact}
                <a href={contact.link} class="contact-item">
                  <i class={contact.icon}></i>
                  <div class="contact-details">
                    <span class="contact-label">{contact.text}</span>
                    <span class="contact-value">{contact.value}</span>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        </div>

        <!-- Navigation & Newsletter -->
        <div class="footer-nav">
          <!-- Quick Links -->
          <div class="nav-section">
            <h4>Menu</h4>
            <div class="nav-links">
              {#each footerLinks as link}
                <a href={link.url}>{link.text}</a>
              {/each}
            </div>
          </div>

          <!-- Newsletter -->
          <div class="newsletter-section">
            <h4>
              <i class="fas fa-bell"></i>
              Update & Promo
            </h4>
            <p>Dapatkan info terbaru dan penawaran eksklusif</p>

            <form
              class="newsletter-form"
              on:submit|preventDefault={subscribeNewsletter}
            >
              <div class="input-group">
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  bind:value={email}
                  disabled={isSubscribing}
                  required
                />
                <button type="submit" disabled={isSubscribing}>
                  {#if isSubscribing}
                    <i class="fas fa-spinner fa-spin"></i>
                  {:else}
                    <i class="fas fa-paper-plane"></i>
                  {/if}
                </button>
              </div>

              {#if subscribeMessage}
                <div
                  class="newsletter-message"
                  class:success={subscribeMessage.includes("Berhasil")}
                  class:error={!subscribeMessage.includes("Berhasil")}
                >
                  {subscribeMessage}
                </div>
              {/if}
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer Bottom -->
  <div class="footer-bottom">
    <div class="container">
      <div class="footer-bottom-content">
        <div class="footer-info">
          <div class="copyright">
            <p>
              &copy; {currentYear} Hay Hill Clothing by Diffarydk. All rights reserved.
            </p>
          </div>

          <div class="footer-stats">
            <div class="stat">
              <span class="stat-number">15+</span>
              <span class="stat-label">Tahun</span>
            </div>
            <div class="stat">
              <span class="stat-number">10K+</span>
              <span class="stat-label">Pelanggan</span>
            </div>
            <div class="stat">
              <span class="stat-number">99.9%</span>
              <span class="stat-label">Puas</span>
            </div>
          </div>
        </div>

        <div class="footer-actions">
          <!-- Social Links -->
          <div class="social-section">
            <span class="social-label">Follow Us:</span>
            <div class="social-links">
              {#each socialLinks as social}
                <a
                  href={social.url}
                  class="social-link"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener"
                >
                  <i class={social.icon}></i>
                </a>
              {/each}
            </div>
          </div>

          <!-- Back to Top -->
          <button
            class="back-to-top"
            on:click={scrollToTop}
            aria-label="Kembali ke atas"
          >
            <i class="fas fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  /* Minimalist Footer Styles */
  .footer {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    color: var(--white);
    position: relative;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  /* Main Footer */
  .footer-main {
    padding: 3rem 0 2rem;
  }

  .footer-content {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 4rem;
    align-items: start;
  }

  /* Brand Section */
  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .brand-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logo img {
    height: 50px;
    width: 50px;
    border-radius: 12px;
    object-fit: cover;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--white);
    line-height: 1;
  }

  .brand-tagline {
    font-size: 0.8rem;
    color: var(--yellow);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .brand-description {
    color: #d1d5db;
    line-height: 1.6;
    font-size: 0.95rem;
    max-width: 400px;
  }

  /* Contact Section */
  .contact-section h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--white);
    margin-bottom: 1rem;
  }

  .contact-grid {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 0;
    color: #d1d5db;
    text-decoration: none;
    transition: all 0.3s ease;
    border-radius: 6px;
  }

  .contact-item:hover {
    color: var(--white);
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(4px);
    padding-left: 0.8rem;
  }

  .contact-item i {
    width: 18px;
    text-align: center;
    color: var(--yellow);
    font-size: 1rem;
    flex-shrink: 0;
  }

  .contact-details {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .contact-label {
    font-size: 0.8rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .contact-value {
    font-size: 0.9rem;
    color: #d1d5db;
    font-weight: 600;
  }

  /* Navigation Section */
  .footer-nav {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .nav-section h4,
  .newsletter-section h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--white);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-section h4::after,
  .newsletter-section h4::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(248, 225, 27, 0.5), transparent);
  }

  .nav-links {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }

  .nav-links a {
    color: #d1d5db;
    text-decoration: none;
    padding: 0.4rem 0;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    border-radius: 4px;
  }

  .nav-links a:hover {
    color: var(--white);
    background: rgba(255, 255, 255, 0.05);
    padding-left: 0.8rem;
  }

  /* Newsletter Section */
  .newsletter-section {
    background: rgba(255, 255, 255, 0.03);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .newsletter-section h4 i {
    color: var(--yellow);
  }

  .newsletter-section p {
    color: #d1d5db;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .newsletter-form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .input-group {
    display: flex;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .input-group:focus-within {
    background: rgba(255, 255, 255, 0.12);
    border-color: var(--yellow);
    box-shadow: 0 0 0 2px rgba(248, 225, 27, 0.2);
  }

  .input-group input {
    flex: 1;
    background: none;
    border: none;
    padding: 0.8rem 1rem;
    color: var(--white);
    font-size: 0.9rem;
    font-family: inherit;
  }

  .input-group input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .input-group input:focus {
    outline: none;
  }

  .input-group button {
    background: var(--yellow);
    border: none;
    padding: 0.8rem 1rem;
    color: var(--text-dark);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
  }

  .input-group button:hover:not(:disabled) {
    background: var(--yellow-dark);
  }

  .input-group button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .newsletter-message {
    font-size: 0.85rem;
    padding: 0.5rem 0;
    text-align: center;
    border-radius: 4px;
  }

  .newsletter-message.success {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    padding: 0.5rem;
  }

  .newsletter-message.error {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 0.5rem;
  }

  /* Footer Bottom */
  .footer-bottom {
    background: rgba(0, 0, 0, 0.3);
    padding: 1.5rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer-bottom-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
  }

  .footer-info {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .copyright p {
    color: #9ca3af;
    font-size: 0.85rem;
    margin: 0;
  }

  .footer-stats {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-number {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--yellow);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  /* Social Section */
  .social-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .social-label {
    font-size: 0.9rem;
    color: #d1d5db;
    font-weight: 500;
  }

  .social-links {
    display: flex;
    gap: 0.8rem;
  }

  .social-link {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    text-decoration: none;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }

  .social-link:hover {
    background: var(--yellow);
    color: var(--text-dark);
    transform: translateY(-2px);
  }

  /* Back to Top */
  .back-to-top {
    width: 44px;
    height: 44px;
    background: var(--primary);
    border: none;
    border-radius: 12px;
    color: var(--white);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .back-to-top:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .footer-content {
      grid-template-columns: 1fr;
      gap: 3rem;
    }

    .footer-nav {
      flex-direction: row;
      gap: 3rem;
    }

    .nav-section,
    .newsletter-section {
      flex: 1;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 1.5rem;
    }

    .footer-main {
      padding: 2.5rem 0 1.5rem;
    }

    .footer-content {
      gap: 2.5rem;
    }

    .footer-nav {
      flex-direction: column;
      gap: 2rem;
    }

    .footer-bottom-content {
      flex-direction: column;
      gap: 1.5rem;
      text-align: center;
    }

    .footer-info {
      flex-direction: column;
      gap: 1rem;
    }

    .footer-stats {
      gap: 2rem;
    }

    .social-section {
      flex-direction: column;
      gap: 0.8rem;
      text-align: center;
    }

    .logo {
      justify-content: center;
    }

    .brand-description {
      text-align: center;
    }

    .contact-grid {
      align-items: center;
    }

    .contact-item {
      justify-content: center;
      text-align: center;
    }

    .nav-links {
      grid-template-columns: 1fr;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .footer-main {
      padding: 2rem 0 1rem;
    }

    .footer-content {
      gap: 2rem;
    }

    .logo {
      flex-direction: column;
      gap: 0.8rem;
    }

    .logo-text {
      text-align: center;
    }

    .footer-stats {
      gap: 1rem;
    }

    .stat-number {
      font-size: 1rem;
    }

    .stat-label {
      font-size: 0.65rem;
    }

    .social-links {
      justify-content: center;
    }

    .input-group {
      flex-direction: column;
    }

    .input-group button {
      padding: 0.8rem;
      border-radius: 0 0 8px 8px;
    }

    .newsletter-section {
      padding: 1.2rem;
    }
  }
</style>
