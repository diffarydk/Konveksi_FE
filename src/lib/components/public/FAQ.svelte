<script lang="ts">
  interface FAQItem {
    question: string;
    answer: string;
    icon: string;
  }

  const faqs: FAQItem[] = [
    {
      question: "Berapa jumlah minimum pemesanan?",
      answer:
        "Jumlah minimal pemesanan <strong>24 pcs/desain</strong> dengan batasan 1 warna per desain. Anda dapat memilih 4 ukuran (S, M, L, XL) dalam 24 pcs tersebut.",
      icon: "📦",
    },
    {
      question: "Berapa lama waktu produksi?",
      answer:
        "Waktu produksi standar <strong>10-14 hari kerja</strong> setelah pembayaran DP dan desain final disetujui.",
      icon: "⏰",
    },
    {
      question: "Apakah bisa custom design?",
      answer:
        "Ya, kami menerima <strong>desain kustom</strong> sesuai kebutuhan Anda. Tim desainer kami siap membantu mewujudkan ide Anda.",
      icon: "🎨",
    },
    {
      question: "Bagaimana sistem pembayaran?",
      answer:
        "Kami menerima <strong>transfer bank, e-wallet, dan QRIS</strong>. Sistem pembayaran: DP 50% untuk mulai produksi, pelunasan 50% sebelum pengiriman.",
      icon: "💳",
    },
    {
      question: "Apakah ada layanan pengiriman?",
      answer:
        "Ya, kami kirim ke <strong>seluruh Indonesia</strong> via JNE, TIKI, Sicepat, dan ekspedisi terpercaya lainnya.",
      icon: "🚚",
    },
    {
      question: "Bagaimana jika produk cacat?",
      answer:
        "Kami berikan <strong>garansi kualitas</strong>. Jika ada cacat produksi, hubungi kami dalam 3 hari setelah terima barang.",
      icon: "🛡️",
    },
  ];

  let openIndex: number | null = null;

  function toggle(index: number) {
    openIndex = openIndex === index ? null : index;
  }
</script>

<section class="faq">
  <div class="container">
    <div class="header">
      <div class="badge">💬 FAQ</div>
      <h2>Pertanyaan Umum</h2>
      <p>
        Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang layanan
        kami
      </p>
    </div>

    <div class="faq-grid">
      {#each faqs as faq, index}
        <div class="faq-card" class:open={openIndex === index}>
          <button class="question" on:click={() => toggle(index)} type="button">
            <div class="question-content">
              <div class="question-icon">{faq.icon}</div>
              <span class="question-text">{faq.question}</span>
            </div>
            <div class="expand-icon" class:rotated={openIndex === index}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </button>

          <div class="answer" class:expanded={openIndex === index}>
            <div class="answer-content">
              <p>{@html faq.answer}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="cta-section">
      <div class="cta-content">
        <div class="cta-icon">💬</div>
        <h3>Masih ada pertanyaan lain?</h3>
        <p>Tim customer service kami siap membantu Anda kapan saja!</p>
        <a
          href="https://wa.me/628123456789?text=Hai%20Hay%20Hill%20Clothing,%20saya%20ada%20pertanyaan"
          class="wa-btn"
          target="_blank"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
            />
          </svg>
          <span>Chat WhatsApp</span>
          <div class="btn-shine"></div>
        </a>
      </div>
    </div>
  </div>
</section>

<style>
  /* Font consistency fix */
  .faq {
    padding: 4rem 1rem;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    position: relative;
    font-family: "Poppins", sans-serif;
  }

  /* Ensure all FAQ elements inherit the correct font */
  .faq *,
  .faq h1,
  .faq h2,
  .faq h3,
  .faq h4,
  .faq h5,
  .faq h6,
  .faq p,
  .faq span,
  .faq div,
  .faq button {
    font-family: inherit;
  }

  /* Force specific elements to use Poppins (not inherit from Font Awesome) */
  .faq .question-text,
  .faq .question-text span,
  .faq .header h2,
  .faq .header p,
  .faq .answer-content p,
  .faq .cta-content h3,
  .faq .cta-content p,
  .faq .wa-btn span {
    font-family: "Poppins", sans-serif !important;
  }

  .faq::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 20% 80%,
        rgba(37, 99, 235, 0.03) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(248, 225, 27, 0.03) 0%,
        transparent 50%
      );
    pointer-events: none;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .badge {
    display: inline-block;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    padding: 0.5rem 1.2rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 1rem;
    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.2);
  }

  .header h2 {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-dark);
    margin-bottom: 0.8rem;
    background: linear-gradient(135deg, var(--text-dark), var(--primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: "Poppins", sans-serif;
    letter-spacing: -0.02em;
  }

  .header p {
    color: var(--text-light);
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
    font-family: "Poppins", sans-serif;
    font-weight: 400;
  }

  .faq-grid {
    display: grid;
    gap: 1rem;
    margin-bottom: 4rem;
  }

  .faq-card {
    background: white;
    border-radius: 16px;
    border: 1px solid rgba(37, 99, 235, 0.08);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  .faq-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--yellow));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .faq-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    border-color: rgba(37, 99, 235, 0.15);
  }

  .faq-card.open {
    border-color: var(--primary);
    box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.15);
  }

  .faq-card.open::before {
    opacity: 1;
  }

  .question {
    width: 100%;
    padding: 1.5rem;
    background: none;
    border: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .question:hover {
    background: rgba(37, 99, 235, 0.02);
  }

  .question-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .question-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(
      135deg,
      var(--yellow-light),
      rgba(248, 225, 27, 0.3)
    );
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .faq-card.open .question-icon {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    transform: scale(1.05);
  }

  .question-text {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--text-dark);
    text-align: left;
    line-height: 1.5;
    font-family: "Poppins", sans-serif;
    letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .expand-icon {
    width: 32px;
    height: 32px;
    background: var(--bg-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-light);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .expand-icon:hover {
    background: var(--primary);
    color: white;
  }

  .expand-icon.rotated {
    transform: rotate(180deg);
    background: var(--primary);
    color: white;
  }

  .expand-icon svg {
    width: 16px;
    height: 16px;
  }

  .answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .faq-card.open .answer {
    max-height: 250px;
  }

  .answer-content {
    padding: 0 1.5rem 1.5rem;
    border-top: 1px solid rgba(37, 99, 235, 0.08);
    margin-top: 0.5rem;
  }

  .answer-content p {
    margin: 1rem 0 0;
    color: var(--text-light);
    line-height: 1.6;
    font-size: 0.95rem;
    font-family: "Poppins", sans-serif;
    font-weight: 400;
  }

  .answer-content strong {
    color: var(--primary);
    font-weight: 600;
  }

  .cta-section {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-radius: 24px;
    padding: 3rem 2rem;
    text-align: center;
    color: white;
    position: relative;
    overflow: hidden;
  }

  .cta-section::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 20% 80%,
        rgba(248, 225, 27, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      );
    pointer-events: none;
  }

  .cta-content {
    position: relative;
    z-index: 1;
  }

  .cta-icon {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin: 0 auto 1.5rem;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .cta-content h3 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    font-family: "Poppins", sans-serif;
  }

  .cta-content p {
    font-size: 1rem;
    opacity: 0.9;
    margin-bottom: 2rem;
    line-height: 1.6;
    font-family: "Poppins", sans-serif;
    font-weight: 400;
  }

  .wa-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: #25d366;
    color: white;
    padding: 1rem 2rem;
    border-radius: 30px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1rem;
    font-family: "Poppins", sans-serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(37, 211, 102, 0.3);
  }

  .wa-btn:hover {
    background: #128c7e;
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(37, 211, 102, 0.4);
  }

  .wa-btn svg {
    width: 20px;
    height: 20px;
  }

  .btn-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  .wa-btn:hover .btn-shine {
    left: 100%;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .faq {
      padding: 2.5rem 0.75rem;
    }

    .header h2 {
      font-size: 2rem;
    }

    .header p {
      font-size: 1rem;
    }

    .question {
      padding: 1.25rem;
    }

    .question-content {
      gap: 0.75rem;
    }

    .question-icon {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }

    .question-text {
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: -0.01em;
    }

    .answer-content {
      padding: 0 1.25rem 1.25rem;
    }

    .answer-content p {
      font-size: 0.9rem;
    }

    .cta-section {
      padding: 2rem 1.5rem;
    }

    .cta-content h3 {
      font-size: 1.5rem;
    }

    .wa-btn {
      padding: 0.875rem 1.75rem;
      font-size: 0.95rem;
    }

    /* Better touch targets */
    .question {
      min-height: 48px;
    }

    .wa-btn {
      min-height: 44px;
    }
  }

  @media (max-width: 480px) {
    .faq {
      padding: 2rem 0.5rem;
    }

    .header h2 {
      font-size: 1.75rem;
    }

    .question {
      padding: 1rem;
    }

    .question-content {
      gap: 0.5rem;
    }

    .question-icon {
      width: 32px;
      height: 32px;
      font-size: 0.9rem;
    }

    .question-text {
      font-size: 0.95rem;
      font-weight: 500;
      letter-spacing: -0.01em;
    }

    .answer-content p {
      font-size: 0.85rem;
    }

    .cta-section {
      padding: 1.5rem 1rem;
    }
  }
</style>
