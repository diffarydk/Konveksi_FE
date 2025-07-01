<script lang="ts">
  interface ContactItem {
    icon: string;
    label: string;
    value: string;
  }

  interface SocialMedia {
    icon: string;
    name: string;
    url: string;
    color: string;
  }

  const contactDetails: ContactItem[] = [
    {
      icon: "fas fa-map-marker-alt",
      label: "Alamat",
      value: "Telkom Bandung",
    },
    {
      icon: "fas fa-phone-alt",
      label: "Telepon",
      value: "+62 087776299650",
    },
    {
      icon: "fas fa-envelope",
      label: "Email",
      value: "diffarydzikrik23@gmail.com",
    },
    {
      icon: "fas fa-clock",
      label: "Jam Operasional",
      value: "Senin - Sabtu: 08:00 - 17:00",
    },
  ];

  const socialMedia: SocialMedia[] = [
    {
      icon: "fab fa-instagram",
      name: "Instagram",
      url: "https://instagram.com/hayhillclothing",
      color: "#E1306C",
    },
    {
      icon: "fab fa-facebook-f",
      name: "Facebook",
      url: "https://facebook.com/hayhillclothing",
      color: "#1877F2",
    },
    {
      icon: "fab fa-tiktok",
      name: "TikTok",
      url: "https://tiktok.com/@hayhillclothing",
      color: "#000000",
    },
    {
      icon: "fab fa-youtube",
      name: "YouTube",
      url: "https://youtube.com/hayhillclothing",
      color: "#FF0000",
    },
  ];

  function handleSubmit(event: Event) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Here you would typically send the data to your server
    console.log(Object.fromEntries(formData));

    // Show success message
    alert(
      "Terima kasih! Pesan Anda telah terkirim. Kami akan segera menghubungi Anda."
    );

    // Reset form
    form.reset();
  }
</script>

{@html "<!--Contact.svelte-->"}

<section class="contact" id="contact">
  <div class="contact-grid">
    <div class="contact-info">
      <h2 class="contact-title">Mari Bekerja Sama</h2>
      <p class="contact-description">
        Hubungi kami untuk konsultasi gratis dan temukan solusi konveksi terbaik
        untuk kebutuhan Anda.
      </p>

      <div class="contact-details">
        {#each contactDetails as item}
          <div class="contact-item">
            <div class="contact-icon">
              <i class={item.icon}></i>
            </div>
            <div class="contact-text">
              <span class="contact-label">{item.label}</span>
              <span class="contact-value">{item.value}</span>
            </div>
          </div>
        {/each}
      </div>

      <a
        href="https://wa.me/628123456789?text=Halo%20Premium%20Konveksi,%20saya%20ingin%20konsultasi%20untuk%20pesanan"
        target="_blank"
        rel="noopener noreferrer"
        class="whatsapp-button"
        aria-label="Konsultasi via WhatsApp"
      >
        <i class="fab fa-whatsapp"></i> Konsultasi via WhatsApp
      </a>

      <!-- Social Media Section -->
      <div class="social-media-section">
        <h3 class="social-title">Ikuti Kami</h3>
        <div class="social-icons">
          {#each socialMedia as social}
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              class="social-icon"
              aria-label={social.name}
              style="--hover-color: {social.color}"
            >
              <i class={social.icon}></i>
            </a>
          {/each}
        </div>
      </div>
    </div>

    <div class="contact-form">
      <form id="contact-form" on:submit={handleSubmit}>
        <div class="form-group">
          <label for="name">Nama Lengkap</label>
          <input
            type="text"
            id="name"
            name="name"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="phone">Nomor Telepon</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label for="message">Pesan</label>
          <textarea id="message" name="message" class="form-control" required
          ></textarea>
        </div>

        <button type="submit" class="submit-btn">Kirim Pesan</button>
      </form>
    </div>
  </div>
</section>

<style>
  .contact {
    padding: 7rem 2rem;
    background: var(--white);
  }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .contact-info {
    padding: 2rem;
  }

  .contact-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-dark);
  }

  .contact-description {
    color: var(--text-light);
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .contact-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .contact-icon {
    width: 50px;
    height: 50px;
    background: var(--yellow-light);
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 1.3rem;
  }

  .contact-text {
    display: flex;
    flex-direction: column;
  }

  .contact-label {
    font-size: 0.9rem;
    color: var(--text-light);
  }

  .contact-value {
    font-weight: 600;
    color: var(--text-dark);
  }

  /* Social Media Section */
  .social-media-section {
    margin-top: 2rem;
  }

  .social-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 1rem;
  }

  .social-icons {
    display: flex;
    gap: 1rem;
  }

  .social-icon {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background: var(--bg-light);
    color: var(--text-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }

  .social-icon:hover {
    transform: translateY(-5px);
    color: var(--white);
    background: var(--hover-color);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .whatsapp-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #25d366;
    color: var(--white);
    padding: 1rem 2rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 1rem;
    transition: all 0.3s ease;
  }

  .whatsapp-button:hover {
    background: #128c7e;
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  .whatsapp-button i {
    font-size: 1.5rem;
  }

  /* Form styling */
  .contact-form {
    background: var(--bg-light);
    padding: 3rem;
    border-radius: 20px;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  .form-control {
    width: 100%;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-family: inherit;
    font-size: 1rem;
  }

  .form-control:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  textarea.form-control {
    height: 150px;
    resize: vertical;
  }

  .submit-btn {
    background: var(--yellow);
    color: var(--text-dark);
    border: none;
    padding: 1rem 2rem;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .submit-btn:hover {
    background: var(--yellow-dark);
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  /* Tablet Styles */
  @media (max-width: 1024px) {
    .contact {
      padding: 5rem 1.5rem;
    }

    .contact-grid {
      gap: 3rem;
    }

    .contact-form {
      padding: 2.5rem;
    }
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .contact {
      padding: 3rem 1rem;
    }

    .contact-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .contact-info {
      padding: 1rem 0;
      text-align: center;
    }

    .contact-title {
      font-size: 1.75rem;
      margin-bottom: 0.75rem;
    }

    .contact-description {
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }

    .contact-details {
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .contact-item {
      justify-content: center;
      text-align: left;
      max-width: 300px;
      margin: 0 auto;
    }

    .contact-icon {
      width: 45px;
      height: 45px;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .whatsapp-button {
      padding: 1rem 1.5rem;
      font-size: 1rem;
      justify-content: center;
      width: 100%;
      max-width: 300px;
      margin: 1.5rem auto 0;
      display: flex;
    }

    .social-media-section {
      text-align: center;
      margin-top: 1.5rem;
    }

    .social-title {
      font-size: 1.1rem;
      margin-bottom: 0.75rem;
    }

    .social-icons {
      justify-content: center;
      gap: 0.75rem;
    }

    .social-icon {
      width: 40px;
      height: 40px;
      font-size: 1.1rem;
    }

    .contact-form {
      padding: 2rem;
      border-radius: 16px;
    }

    .form-control {
      padding: 0.875rem;
      font-size: 16px; /* Prevents zoom on iOS */
      border-radius: 8px;
    }

    textarea.form-control {
      height: 120px;
    }

    .submit-btn {
      width: 100%;
      justify-content: center;
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }

  /* Small Mobile Styles */
  @media (max-width: 480px) {
    .contact {
      padding: 2rem 0.75rem;
    }

    .contact-title {
      font-size: 1.5rem;
    }

    .contact-description {
      font-size: 0.9rem;
    }

    .contact-item {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }

    .contact-text {
      align-items: center;
    }

    .contact-form {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .whatsapp-button {
      padding: 0.875rem 1.25rem;
      font-size: 0.95rem;
    }

    .social-icons {
      gap: 0.5rem;
    }

    .social-icon {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }
  }
</style>
