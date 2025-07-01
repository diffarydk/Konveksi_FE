<!-- Enhanced Interactive Features -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fly, fade, scale, slide } from "svelte/transition";
  import { elasticOut, cubicOut } from "svelte/easing";

  interface Feature {
    icon: string;
    title: string;
    description: string;
    stats: string;
    delay: number;
    benefits: string[];
    detailTitle: string;
    detailDescription: string;
  }

  const features: Feature[] = [
    {
      icon: "💎",
      title: "Kualitas Premium",
      description:
        "Standar internasional dengan kontrol kualitas berlapis untuk hasil sempurna.",
      stats: "99.9%",
      delay: 0,
      benefits: [
        "Bahan import berkualitas",
        "Quality control 3 tahap",
        "Sertifikat ISO 9001",
        "Garansi produk",
      ],
      detailTitle: "Jaminan Kualitas Terdepan",
      detailDescription:
        "Setiap produk melalui pemeriksaan ketat dengan standar internasional. Kami menggunakan bahan premium dan teknologi produksi terdepan untuk memastikan hasil yang sempurna.",
    },
    {
      icon: "⚡",
      title: "Produksi Efisien",
      description:
        "Teknologi modern memastikan proses cepat tanpa mengurangi kualitas.",
      stats: "48h",
      delay: 100,
      benefits: [
        "Mesin produksi canggih",
        "Tim berpengalaman 15+ tahun",
        "Proses otomatis",
        "Pengiriman express",
      ],
      detailTitle: "Efisiensi Maksimal",
      detailDescription:
        "Dengan sistem produksi terintegrasi dan tim profesional, kami mampu menyelesaikan pesanan dalam waktu record tanpa mengorbankan kualitas.",
    },
    {
      icon: "🎨",
      title: "Desain Kustom",
      description: "Tim kreatif berpengalaman mewujudkan visi unik brand Anda.",
      stats: "500+",
      delay: 200,
      benefits: [
        "Konsultasi desain gratis",
        "Revisi unlimited",
        "Portfolio 500+ klien",
        "3D mockup preview",
      ],
      detailTitle: "Kreativitas Tanpa Batas",
      detailDescription:
        "Tim desainer profesional kami siap mewujudkan ide kreatif Anda menjadi karya nyata yang mencerminkan identitas brand dengan sempurna.",
    },
    {
      icon: "🛡️",
      title: "Garansi Kualitas",
      description:
        "Jaminan kepuasan dengan komitmen perbaikan tanpa biaya tambahan.",
      stats: "100%",
      delay: 300,
      benefits: [
        "Garansi seumur hidup",
        "Retur mudah",
        "Perbaikan gratis",
        "Kepuasan terjamin",
      ],
      detailTitle: "Komitmen Kepuasan",
      detailDescription:
        "Kami berkomitmen penuh terhadap kepuasan pelanggan dengan garansi komprehensif dan layanan purna jual terbaik di industri.",
    },
    {
      icon: "🌱",
      title: "Eco-Conscious",
      description:
        "Proses ramah lingkungan dengan material sustainable berkualitas.",
      stats: "Green",
      delay: 400,
      benefits: [
        "Bahan eco-friendly",
        "Proses zero waste",
        "Kemasan ramah lingkungan",
        "Sertifikat green",
      ],
      detailTitle: "Tanggung Jawab Lingkungan",
      detailDescription:
        "Kami peduli lingkungan dengan menggunakan material sustainable dan proses produksi yang meminimalisir dampak terhadap alam.",
    },
    {
      icon: "🚀",
      title: "Inovasi Berkelanjutan",
      description:
        "Selalu mengadopsi teknologi terbaru untuk hasil yang lebih baik.",
      stats: "24/7",
      delay: 500,
      benefits: [
        "Teknologi terdepan",
        "R&D berkelanjutan",
        "Update sistem berkala",
        "Support 24/7",
      ],
      detailTitle: "Masa Depan Fashion",
      detailDescription:
        "Dengan investasi berkelanjutan dalam teknologi dan riset, kami selalu berada di garis depan inovasi industri fashion.",
    },
  ];

  let activeFeature: number | null = null;
  let expandedFeature: number | null = null;
  let isVisible = false;
  let isMobile = false;
  let showComparison = false;

  // Animated counters for stats
  let animatedStats = features.map(() => ({ value: 0, isAnimating: false }));

  onMount(() => {
    isMobile = window.innerWidth <= 768;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible = true;
            // Start counter animations
            setTimeout(() => {
              animateCounters();
            }, 800);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.querySelector(".features-enhanced");
    if (section) observer.observe(section);

    const handleResize = () => {
      isMobile = window.innerWidth <= 768;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  });

  function animateCounters() {
    features.forEach((feature, index) => {
      if (feature.stats.includes("%")) {
        const targetValue = parseInt(feature.stats);
        animateCounter(index, targetValue, "%");
      } else if (feature.stats.includes("h")) {
        const targetValue = parseInt(feature.stats);
        animateCounter(index, targetValue, "h");
      } else if (feature.stats.includes("+")) {
        const targetValue = parseInt(feature.stats);
        animateCounter(index, targetValue, "+");
      }
    });
  }

  function animateCounter(index: number, target: number, suffix: string) {
    if (isNaN(target)) return;

    animatedStats[index].isAnimating = true;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(interval);
        animatedStats[index].isAnimating = false;
      }
      animatedStats[index].value = Math.floor(current);
    }, duration / steps);
  }

  function toggleFeature(index: number) {
    activeFeature = activeFeature === index ? null : index;
  }

  function expandFeature(index: number) {
    expandedFeature = expandedFeature === index ? null : index;
  }

  function toggleComparison() {
    showComparison = !showComparison;
  }

  // Touch handling for mobile
  let touchStartY = 0;
  let touchCurrentY = 0;

  function handleTouchStart(e: TouchEvent) {
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e: TouchEvent) {
    touchCurrentY = e.touches[0].clientY;
  }
</script>

{@html "<!--Features.svelte-->"}

<section class="features-enhanced" id="features">
  <!-- Enhanced background elements -->
  <div class="bg-elements">
    <div class="floating-dot dot-1"></div>
    <div class="floating-dot dot-2"></div>
    <div class="floating-dot dot-3"></div>
    <div class="gradient-mesh"></div>
  </div>

  <div class="features-container">
    <!-- Enhanced section header -->
    <div
      class="section-header-enhanced"
      in:fly={{ y: 30, duration: 800, delay: 200 }}
    >
      <div class="header-badge">
        <span>Keunggulan Kami</span>
      </div>
      <h2 class="section-title-enhanced">
        Mengapa Kami
        <span class="title-accent">Berbeda?</span>
      </h2>
      <p class="section-desc-enhanced">
        Kombinasi sempurna antara keahlian, teknologi, dan dedikasi untuk
        menghadirkan hasil terbaik.
      </p>

      <!-- Comparison toggle -->
      <div class="header-actions" in:fade={{ delay: 600, duration: 600 }}>
        <button
          class="comparison-toggle"
          class:active={showComparison}
          on:click={toggleComparison}
        >
          <i class="fas fa-chart-bar"></i>
          <span>{showComparison ? "Sembunyikan" : "Lihat"} Perbandingan</span>
        </button>
      </div>
    </div>

    <!-- Comparison table -->
    {#if showComparison}
      <div
        class="comparison-table"
        transition:slide={{ duration: 500, easing: cubicOut }}
      >
        <div class="table-header">
          <h3>Perbandingan Layanan</h3>
          <div class="table-grid-header">
            <div class="feature-name">Fitur</div>
            <div class="competitor">Konveksi Lain</div>
            <div class="our-service">Hay Hill Clothing</div>
          </div>
        </div>
        <div class="table-body">
          {#each features.slice(0, 4) as feature, i}
            <div
              class="table-row"
              in:fly={{ x: -20, delay: i * 100, duration: 500 }}
            >
              <div class="feature-name">
                <span class="feature-icon-small">{feature.icon}</span>
                {feature.title}
              </div>
              <div class="competitor">
                <i class="fas fa-times text-red"></i>
                <span>Standar</span>
              </div>
              <div class="our-service">
                <i class="fas fa-check text-green"></i>
                <span>{feature.stats}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Enhanced features layout -->
    <div class="features-layout-enhanced">
      <!-- Primary features with enhanced interaction -->
      <div class="features-primary-enhanced">
        {#each features.slice(0, 3) as feature, index}
          <div
            class="feature-card-enhanced"
            class:active={activeFeature === index}
            class:expanded={expandedFeature === index}
            style="--delay: {feature.delay}ms;"
            in:fly={{
              x: -30,
              duration: 800,
              delay: 400 + feature.delay,
              easing: cubicOut,
            }}
            on:click={() => toggleFeature(index)}
            on:keypress={(e) => e.key === "Enter" && toggleFeature(index)}
            on:touchstart={handleTouchStart}
            on:touchmove={handleTouchMove}
            role="button"
            tabindex="0"
          >
            <div class="card-content-enhanced">
              <div class="feature-header-enhanced">
                <div class="feature-icon-enhanced">{feature.icon}</div>
                <div class="feature-stats-enhanced">
                  {#if feature.stats.includes("%") || feature.stats.includes("h") || feature.stats.includes("+")}
                    <span class="animated-stat">
                      {animatedStats[index]?.value || 0}{feature.stats.replace(
                        /\d+/,
                        ""
                      )}
                    </span>
                  {:else}
                    <span>{feature.stats}</span>
                  {/if}
                </div>
              </div>

              <h3 class="feature-title-enhanced">{feature.title}</h3>
              <p class="feature-desc-enhanced">{feature.description}</p>

              <!-- Benefits list -->
              <div class="benefits-preview">
                {#each feature.benefits.slice(0, 2) as benefit}
                  <div class="benefit-item">
                    <i class="fas fa-check benefit-check"></i>
                    <span>{benefit}</span>
                  </div>
                {/each}
              </div>

              <!-- Expand button -->
              <button
                class="expand-btn"
                on:click|stopPropagation={() => expandFeature(index)}
              >
                <span>{expandedFeature === index ? "Tutup" : "Detail"}</span>
                <i
                  class="fas fa-chevron-down"
                  class:rotated={expandedFeature === index}
                ></i>
              </button>
            </div>

            <!-- Expanded content -->
            {#if expandedFeature === index}
              <div
                class="expanded-content"
                transition:slide={{ duration: 400, easing: cubicOut }}
              >
                <div class="expanded-header">
                  <h4>{feature.detailTitle}</h4>
                  <p>{feature.detailDescription}</p>
                </div>
                <div class="all-benefits">
                  {#each feature.benefits as benefit}
                    <div class="benefit-item-expanded">
                      <i class="fas fa-star benefit-star"></i>
                      <span>{benefit}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Interactive overlay -->
            <div class="card-overlay-enhanced">
              <div class="overlay-pattern"></div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Secondary features enhanced -->
      <div class="features-secondary-enhanced">
        {#each features.slice(3) as feature, index}
          <div
            class="feature-card-compact-enhanced"
            style="--delay: {feature.delay}ms;"
            in:scale={{
              duration: 600,
              delay: 600 + feature.delay,
              easing: elasticOut,
            }}
            on:click={() => toggleFeature(index + 3)}
            on:keypress={(e) => e.key === "Enter" && toggleFeature(index + 3)}
            role="button"
            tabindex="0"
          >
            <div class="compact-icon-enhanced">{feature.icon}</div>
            <div class="compact-content-enhanced">
              <h4 class="compact-title-enhanced">{feature.title}</h4>
              <div class="compact-stats-enhanced">
                {#if feature.stats.includes("%") || feature.stats.includes("h") || feature.stats.includes("+")}
                  <span class="animated-stat">
                    {animatedStats[index + 3]?.value ||
                      0}{feature.stats.replace(/\d+/, "")}
                  </span>
                {:else}
                  <span>{feature.stats}</span>
                {/if}
              </div>
              <p class="compact-desc">{feature.description}</p>
            </div>
            <div class="compact-expand-enhanced">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        {/each}

        <!-- Enhanced CTA card -->
        <div class="cta-card-enhanced" in:fade={{ delay: 1200, duration: 800 }}>
          <div class="cta-content-enhanced">
            <div class="cta-icon">🤝</div>
            <h3>Mulai Proyek Anda</h3>
            <p>Diskusikan kebutuhan Anda dengan ahli kami</p>
            <div class="cta-buttons">
              <a
                href="https://wa.me/62087776299650?text=Halo%2C%20saya%20tertarik%20untuk%20berdiskusi%20tentang%20project%20konveksi"
                class="cta-btn-primary"
                target="_blank"
              >
                <i class="fab fa-whatsapp"></i>
                <span>Konsultasi Gratis</span>
              </a>
              <button
                class="cta-btn-secondary"
                on:click={() => (showComparison = true)}
              >
                <i class="fas fa-chart-line"></i>
                <span>Lihat Keunggulan</span>
              </button>
            </div>
          </div>
          <div class="cta-decoration">
            <div class="decoration-circle"></div>
            <div class="decoration-dots"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile swipe indicator enhanced -->
  {#if isMobile}
    <div
      class="swipe-indicator-enhanced"
      in:fade={{ delay: 1500, duration: 600 }}
    >
      <div class="swipe-dots-enhanced">
        <div class="dot active"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <span>Tap untuk detail, swipe untuk navigasi</span>
    </div>
  {/if}
</section>

<style>
  .features-enhanced {
    padding: 6rem 2rem;
    background: var(--white);
    position: relative;
    overflow: hidden;
  }

  /* Enhanced background elements */
  .bg-elements {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .gradient-mesh {
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background: radial-gradient(
      circle at 80% 20%,
      rgba(37, 99, 235, 0.03) 0%,
      transparent 50%
    );
  }

  .floating-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--yellow);
    border-radius: 50%;
    opacity: 0.4;
  }

  .dot-1 {
    top: 20%;
    right: 10%;
    animation: float 8s ease-in-out infinite;
  }

  .dot-2 {
    bottom: 30%;
    left: 15%;
    animation: float 10s ease-in-out infinite reverse;
  }

  .dot-3 {
    top: 60%;
    right: 25%;
    animation: float 12s ease-in-out infinite;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(180deg);
    }
  }

  /* Enhanced container */
  .features-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Enhanced section header */
  .section-header-enhanced {
    text-align: center;
    margin-bottom: 4rem;
  }

  .header-badge {
    display: inline-block;
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    padding: 0.5rem 1.2rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    letter-spacing: 0.5px;
  }

  .section-title-enhanced {
    font-size: clamp(2rem, 6vw, 3rem);
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--text-dark);
  }

  .title-accent {
    color: var(--primary);
    position: relative;
  }

  .title-accent::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--yellow);
    border-radius: 2px;
  }

  .section-desc-enhanced {
    color: var(--text-light);
    max-width: 500px;
    margin: 0 auto 2rem;
    font-size: 1rem;
    line-height: 1.6;
  }

  /* Header actions */
  .header-actions {
    margin-top: 1.5rem;
  }

  .comparison-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 2px solid var(--primary);
    color: var(--primary);
    padding: 0.75rem 1.5rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .comparison-toggle:hover,
  .comparison-toggle.active {
    background: var(--primary);
    color: white;
    transform: translateY(-2px);
  }

  /* Comparison table */
  .comparison-table {
    background: var(--bg-light);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 3rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .table-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--text-dark);
    text-align: center;
  }

  .table-grid-header,
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    border-radius: 8px;
  }

  .table-grid-header {
    background: var(--primary);
    color: white;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .table-row {
    background: white;
    margin-bottom: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .feature-icon-small {
    font-size: 1.2rem;
    margin-right: 0.5rem;
  }

  .text-red {
    color: #ef4444;
  }
  .text-green {
    color: var(--success);
  }

  /* Enhanced layout */
  .features-layout-enhanced {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 3rem;
    align-items: start;
  }

  /* Tablet Styles */
  @media (max-width: 1024px) {
    .features-layout-enhanced {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .section-title-enhanced {
      font-size: 2.5rem;
    }

    .feature-card-enhanced {
      padding: 2rem;
    }

    .table-grid-header,
    .table-row {
      grid-template-columns: 2fr 1fr 1fr;
      gap: 0.5rem;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .features-enhanced {
      padding: 3rem 1rem;
    }

    .section-header-enhanced {
      margin-bottom: 2rem;
    }

    .section-title-enhanced {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    .section-desc-enhanced {
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }

    .features-layout-enhanced {
      gap: 1.5rem;
    }

    .feature-card-enhanced {
      padding: 1.5rem;
      border-radius: 16px;
    }

    .feature-header-enhanced {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .feature-icon-enhanced {
      font-size: 2rem;
      width: 50px;
      height: 50px;
    }

    .feature-stats-enhanced {
      font-size: 1rem;
      padding: 0.4rem 0.8rem;
    }

    .feature-title-enhanced {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
    }

    .feature-desc-enhanced {
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    /* Comparison table mobile optimization */
    .comparison-table {
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .table-grid-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      padding: 1rem;
      text-align: center;
    }

    .table-grid-header {
      background: var(--primary);
      color: white;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .table-row {
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      margin-bottom: 0.75rem;
      display: block;
      padding: 1rem;
    }

    .table-row > div {
      margin-bottom: 0.5rem;
      padding: 0.25rem 0;
    }

    .table-row > div:first-child {
      font-weight: 600;
      color: var(--text-dark);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
    }

    /* Secondary features mobile */
    .features-secondary-enhanced {
      gap: 1rem;
    }

    .feature-card-compact-enhanced {
      padding: 1.25rem;
      border-radius: 12px;
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }

    .compact-icon-enhanced {
      font-size: 1.5rem;
      width: 45px;
      height: 45px;
      align-self: center;
    }

    .compact-expand-enhanced {
      display: none; /* Hide expand arrow on mobile */
    }

    /* CTA card mobile */
    .cta-card-enhanced {
      padding: 1.5rem;
      border-radius: 16px;
      text-align: center;
    }

    .cta-buttons {
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .cta-btn-primary,
    .cta-btn-secondary {
      width: 100%;
      justify-content: center;
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }

  /* Small Mobile Styles */
  @media (max-width: 480px) {
    .features-enhanced {
      padding: 2rem 0.75rem;
    }

    .section-title-enhanced {
      font-size: 1.75rem;
    }

    .feature-card-enhanced {
      padding: 1.25rem;
    }

    .feature-title-enhanced {
      font-size: 1.125rem;
    }

    .comparison-table {
      padding: 0.75rem;
    }

    .table-row {
      padding: 0.75rem;
    }

    .cta-card-enhanced {
      padding: 1.25rem;
    }

    .header-badge {
      font-size: 0.8rem;
      padding: 0.4rem 1rem;
    }
  }

  /* Enhanced primary features */
  .features-primary-enhanced {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .feature-card-enhanced {
    background: var(--white);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 20px;
    padding: 2.5rem;
    position: relative;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .feature-card-enhanced:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    border-color: var(--primary);
  }

  .feature-card-enhanced.active {
    background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
    color: white;
  }

  .feature-header-enhanced {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .feature-icon-enhanced {
    font-size: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 16px;
  }

  .feature-card-enhanced.active .feature-icon-enhanced {
    background: rgba(255, 255, 255, 0.2);
  }

  .feature-stats-enhanced {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--primary);
    background: rgba(37, 99, 235, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 12px;
  }

  .feature-card-enhanced.active .feature-stats-enhanced {
    color: var(--yellow);
    background: rgba(248, 225, 27, 0.2);
  }

  .animated-stat {
    display: inline-block;
    transition: transform 0.3s ease;
  }

  .feature-title-enhanced {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-dark);
  }

  .feature-card-enhanced.active .feature-title-enhanced {
    color: white;
  }

  .feature-desc-enhanced {
    color: var(--text-light);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .feature-card-enhanced.active .feature-desc-enhanced {
    color: rgba(255, 255, 255, 0.9);
  }

  /* Benefits preview */
  .benefits-preview {
    margin-bottom: 1.5rem;
  }

  .benefit-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .benefit-check {
    color: var(--success);
    font-size: 0.8rem;
  }

  .feature-card-enhanced.active .benefit-check {
    color: var(--yellow);
  }

  /* Expand button */
  .expand-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(37, 99, 235, 0.1);
    border: none;
    color: var(--primary);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .feature-card-enhanced.active .expand-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .expand-btn i.rotated {
    transform: rotate(180deg);
  }

  /* Expanded content */
  .expanded-content {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .expanded-header h4 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .expanded-header p {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-bottom: 1rem;
  }

  .all-benefits {
    display: grid;
    gap: 0.5rem;
  }

  .benefit-item-expanded {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .benefit-star {
    color: var(--yellow);
    font-size: 0.7rem;
  }

  /* Enhanced secondary features */
  .features-secondary-enhanced {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .feature-card-compact-enhanced {
    background: var(--bg-light);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .feature-card-compact-enhanced:hover {
    background: var(--white);
    transform: translateX(5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  }

  .compact-icon-enhanced {
    font-size: 1.8rem;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--white);
    border-radius: 12px;
    flex-shrink: 0;
  }

  .compact-content-enhanced {
    flex: 1;
  }

  .compact-title-enhanced {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 0.25rem;
  }

  .compact-stats-enhanced {
    font-size: 0.85rem;
    color: var(--primary);
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .compact-desc {
    font-size: 0.8rem;
    color: var(--text-light);
    line-height: 1.4;
  }

  .compact-expand-enhanced {
    width: 24px;
    height: 24px;
    background: var(--primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: transform 0.3s ease;
    align-self: center;
  }

  .feature-card-compact-enhanced:hover .compact-expand-enhanced {
    transform: translateX(5px);
  }

  /* Enhanced CTA Card */
  .cta-card-enhanced {
    background: linear-gradient(
      135deg,
      var(--yellow) 0%,
      var(--yellow-dark) 100%
    );
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    margin-top: 1rem;
    position: relative;
    overflow: hidden;
  }

  .cta-content-enhanced {
    position: relative;
    z-index: 2;
  }

  .cta-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .cta-content-enhanced h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--text-dark);
  }

  .cta-content-enhanced p {
    color: var(--text-dark);
    opacity: 0.8;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .cta-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .cta-btn-primary,
  .cta-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }

  .cta-btn-primary {
    background: var(--white);
    color: var(--text-dark);
  }

  .cta-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .cta-btn-secondary {
    background: transparent;
    color: var(--text-dark);
    border: 1px solid rgba(0, 0, 0, 0.2);
  }

  .cta-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .cta-decoration {
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    pointer-events: none;
  }

  .decoration-circle {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  /* Mobile swipe indicator enhanced */
  .swipe-indicator-enhanced {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-top: 3rem;
    color: var(--text-light);
    font-size: 0.8rem;
  }

  .swipe-dots-enhanced {
    display: flex;
    gap: 0.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-light);
    opacity: 0.3;
    transition: all 0.3s ease;
  }

  .dot.active {
    background: var(--primary);
    opacity: 1;
    transform: scale(1.2);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .features-layout-enhanced {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .features-primary-enhanced {
      order: 1;
    }

    .features-secondary-enhanced {
      order: 2;
    }

    .feature-card-enhanced {
      padding: 2rem;
    }

    .feature-header-enhanced {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .feature-stats-enhanced {
      align-self: flex-end;
    }

    .comparison-table {
      padding: 1rem;
    }

    .table-grid-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      text-align: center;
    }

    .cta-buttons {
      flex-direction: column;
    }

    /* Touch gestures */
    .feature-card-enhanced {
      touch-action: manipulation;
    }

    /* Swipe animations */
    .features-secondary-enhanced {
      overflow-x: auto;
      flex-direction: row;
      gap: 1rem;
      padding-bottom: 1rem;
      scroll-snap-type: x mandatory;
    }

    .feature-card-compact-enhanced,
    .cta-card-enhanced {
      min-width: 250px;
      scroll-snap-align: start;
    }
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Focus states */
  .feature-card-enhanced:focus,
  .feature-card-compact-enhanced:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
</style>
