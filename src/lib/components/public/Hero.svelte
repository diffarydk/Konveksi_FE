<!-- Minimalist Asymmetrical Hero -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly, scale } from "svelte/transition";
  import { elasticOut } from "svelte/easing";

  let isLoaded = false;
  let mousePosition = { x: 0, y: 0 };
  let isMobile = false;

  // Dynamic word animation
  let dynamicWords = ["Premium", "Inovasi", "Kualitas", "Kepercayaan"];
  let currentWordIndex = 0;
  let wordVisible = true;

  // Minimal stats for impact
  let stats = [
    { number: 0, target: 15, suffix: "+", label: "Tahun", icon: "⏰" },
    { number: 0, target: 5000, suffix: "+", label: "Klien", icon: "👥" },
    { number: 0, target: 99, suffix: "%", label: "Puas", icon: "⭐" },
  ];

  onMount(() => {
    isLoaded = true;
    isMobile = window.innerWidth <= 768;

    // Word rotation
    const wordInterval = setInterval(() => {
      wordVisible = false;
      setTimeout(() => {
        currentWordIndex = (currentWordIndex + 1) % dynamicWords.length;
        wordVisible = true;
      }, 200);
    }, 2500);

    // Mouse parallax effect (desktop only)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) {
        mousePosition = {
          x: (e.clientX / window.innerWidth - 0.5) * 20,
          y: (e.clientY / window.innerHeight - 0.5) * 20,
        };
      }
    };

    // Stats animation
    setTimeout(() => {
      stats.forEach((stat, index) => {
        const duration = 2000;
        const steps = 50;
        const increment = stat.target / steps;
        let current = 0;

        const interval = setInterval(() => {
          current += increment;
          if (current >= stat.target) {
            current = stat.target;
            clearInterval(interval);
          }
          stats[index].number = Math.floor(current);
        }, duration / steps);
      });
    }, 1000);

    // Resize handler
    const handleResize = () => {
      isMobile = window.innerWidth <= 768;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(wordInterval);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  });
</script>

<section class="hero-minimal" id="home">
  <!-- Floating geometric shapes -->
  <div class="geometric-bg">
    <div
      class="shape-1"
      style="transform: translate({mousePosition.x * 0.5}px, {mousePosition.y *
        0.5}px)"
    ></div>
    <div
      class="shape-2"
      style="transform: translate({mousePosition.x * -0.3}px, {mousePosition.y *
        -0.3}px)"
    ></div>
    <div
      class="shape-3"
      style="transform: translate({mousePosition.x * 0.2}px, {mousePosition.y *
        0.4}px)"
    ></div>
  </div>

  <div class="hero-container">
    <!-- Left side - Main content (asymmetrical) -->
    <div class="hero-main" in:fly={{ x: -50, duration: 1000, delay: 300 }}>
      <div
        class="badge-minimal"
        in:scale={{ duration: 600, delay: 500, easing: elasticOut }}
      >
        <span>EST. 2010</span>
      </div>

      <h1 class="hero-title-minimal">
        <span
          class="title-line-1"
          in:fly={{ x: -30, duration: 800, delay: 600 }}
        >
          Wujudkan Pakaian
        </span>
        <span
          class="title-line-2"
          in:fly={{ x: -30, duration: 800, delay: 800 }}
        >
          Impian dengan
        </span>
        <span
          class="title-dynamic"
          in:fly={{ x: -30, duration: 800, delay: 1000 }}
        >
          {#if wordVisible}
            <span
              class="dynamic-text"
              in:scale={{ duration: 300, easing: elasticOut }}
            >
              {dynamicWords[currentWordIndex]}
            </span>
          {/if}
        </span>
      </h1>

      <p class="hero-desc-minimal" in:fade={{ delay: 1200, duration: 600 }}>
        Hay Hill Clothing yang menghadirkan <strong>kualitas terbaik</strong>
        untuk setiap helai pakaian yang kami buat.
      </p>

      <!-- Minimal CTA -->
      <div class="cta-minimal" in:fly={{ y: 30, duration: 600, delay: 1400 }}>
        <a
          href="https://wa.me/62087776299650?text=Halo%20Hay%20Hill%20Clothing%2C%20saya%20tertarik%20untuk%20konsultasi%20tentang%20pembuatan%20pakaian%20premium"
          class="btn-minimal primary"
          target="_blank"
        >
          <span>Mulai Konsultasi</span>
          <div class="btn-icon">
            <i class="fab fa-whatsapp"></i>
          </div>
        </a>

        <a href="#products" class="btn-minimal secondary">
          <span>Lihat Karya</span>
          <div class="btn-arrow">→</div>
        </a>
      </div>
    </div>

    <!-- Right side - Stats floating card -->
    <div class="hero-stats-card" in:fly={{ x: 50, duration: 1000, delay: 800 }}>
      <div class="stats-header">
        <h3>Pencapaian Kami</h3>
        <div class="stats-line"></div>
      </div>

      <div class="stats-grid">
        {#each stats as stat, i}
          <div
            class="stat-minimal"
            in:fly={{ y: 20, duration: 500, delay: 1000 + i * 100 }}
          >
            <div class="stat-icon">{stat.icon}</div>
            <div class="stat-number">{stat.number}{stat.suffix}</div>
            <div class="stat-label">{stat.label}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Minimal scroll indicator -->
  <div class="scroll-minimal" in:fade={{ delay: 1800, duration: 600 }}>
    <div class="scroll-text">Scroll ke bawah</div>
    <div class="scroll-line-animated"></div>
  </div>
</section>

<style>
  .hero-minimal {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 2rem;
    /* Tambahan padding top untuk mengcompensate fixed navbar */
    padding-top: calc(2rem + 80px);
  }

  /* Geometric background shapes */
  .geometric-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .shape-1,
  .shape-2,
  .shape-3 {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.03);
    transition: transform 0.1s ease-out;
  }

  .shape-1 {
    width: 300px;
    height: 300px;
    top: 10%;
    right: 15%;
    background: radial-gradient(
      circle,
      rgba(248, 225, 27, 0.1) 0%,
      transparent 70%
    );
  }

  .shape-2 {
    width: 200px;
    height: 200px;
    bottom: 20%;
    left: 10%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 70%
    );
  }

  .shape-3 {
    width: 150px;
    height: 150px;
    top: 50%;
    left: 5%;
    background: radial-gradient(
      circle,
      rgba(248, 225, 27, 0.08) 0%,
      transparent 70%
    );
  }

  /* Main container - asymmetrical grid */
  .hero-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 4rem;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  /* Left side content */
  .hero-main {
    color: white;
  }

  .badge-minimal {
    display: inline-block;
    background: rgba(248, 225, 27, 0.2);
    backdrop-filter: blur(10px);
    padding: 0.5rem 1.2rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 2rem;
    border: 1px solid rgba(248, 225, 27, 0.3);
  }

  .hero-title-minimal {
    font-size: clamp(2.5rem, 8vw, 4.5rem);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
  }

  .title-line-1,
  .title-line-2 {
    display: block;
    margin-bottom: 0.2rem;
  }

  .title-dynamic {
    display: block;
    margin-top: 0.5rem;
  }

  .dynamic-text {
    color: var(--yellow);
    display: inline-block;
  }

  .hero-desc-minimal {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 3rem;
    opacity: 0.9;
    max-width: 400px;
  }

  /* Minimal CTA buttons */
  .cta-minimal {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .btn-minimal {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 1.5rem;
    border-radius: 30px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .btn-minimal.primary {
    background: var(--yellow);
    color: var(--text-dark);
  }

  .btn-minimal.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(248, 225, 27, 0.4);
  }

  .btn-minimal.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .btn-minimal.secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .btn-icon,
  .btn-arrow {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }

  /* Right side - floating stats card */
  .hero-stats-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    padding: 2rem;
    color: white;
    transform: translateY(-20px);
  }

  .stats-header h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .stats-line {
    width: 40px;
    height: 3px;
    background: var(--yellow);
    border-radius: 2px;
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    display: grid;
    gap: 1.5rem;
  }

  .stat-minimal {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat-icon {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
  }

  .stat-number {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--yellow);
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  /* Minimal scroll indicator */
  .scroll-minimal {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .scroll-text {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .scroll-line-animated {
    width: 2px;
    height: 30px;
    background: rgba(255, 255, 255, 0.3);
    position: relative;
    overflow: hidden;
  }

  .scroll-line-animated::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: var(--yellow);
    animation: scrollDown 2s infinite ease-in-out;
  }

  @keyframes scrollDown {
    0%,
    20% {
      transform: translateY(-100%);
    }
    80%,
    100% {
      transform: translateY(200%);
    }
  }

  /* Tablet Styles */
  @media (max-width: 1024px) {
    .hero-minimal {
      padding: 1.5rem;
      /* Adjust padding top untuk tablet */
      padding-top: calc(1.5rem + 75px);
    }

    .hero-container {
      gap: 3rem;
      max-width: 100%;
    }

    .hero-title-minimal {
      font-size: clamp(2rem, 7vw, 3.5rem);
    }

    .hero-desc-minimal {
      font-size: 1rem;
      max-width: 100%;
    }

    .hero-stats-card {
      padding: 1.75rem;
    }
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .hero-minimal {
      padding: 1rem;
      min-height: 100vh;
      /* Padding top yang cukup untuk mobile navbar */
      padding-top: calc(1rem + 70px);
    }

    .hero-container {
      grid-template-columns: 1fr;
      gap: 2rem;
      text-align: center;
    }

    .hero-main {
      order: 1;
    }

    .hero-stats-card {
      order: 2;
      transform: none;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .hero-title-minimal {
      font-size: clamp(2rem, 8vw, 2.5rem);
      margin-bottom: 1rem;
    }

    .hero-desc-minimal {
      font-size: 0.95rem;
      margin-bottom: 2rem;
      max-width: 100%;
      opacity: 0.95;
    }

    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .stat-minimal {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }

    .stat-icon {
      font-size: 1.2rem;
    }

    .stat-number {
      font-size: 1.4rem;
    }

    .stat-label {
      font-size: 0.8rem;
    }

    .cta-minimal {
      justify-content: center;
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-minimal {
      width: 100%;
      justify-content: center;
      min-height: 48px;
      padding: 1rem 2rem;
      font-size: 1rem;
    }

    .btn-icon,
    .btn-arrow {
      width: 28px;
      height: 28px;
      font-size: 0.8rem;
    }

    .badge-minimal {
      font-size: 0.8rem;
      padding: 0.4rem 1rem;
      margin-bottom: 1.5rem;
    }

    /* Geometric shapes mobile optimization */
    .shape-1 {
      width: 200px;
      height: 200px;
      top: 5%;
      right: 5%;
    }

    .shape-2 {
      width: 150px;
      height: 150px;
      bottom: 15%;
      left: 5%;
    }

    .shape-3 {
      width: 100px;
      height: 100px;
      top: 40%;
      left: 2%;
    }

    /* Remove swipe hint for cleaner look */
    .hero-minimal::after {
      display: none;
    }
  }

  /* Small Mobile Styles */
  @media (max-width: 480px) {
    .hero-minimal {
      padding: 0.75rem;
      /* Padding top untuk small mobile */
      padding-top: calc(0.75rem + 65px);
    }

    .hero-container {
      gap: 1.5rem;
    }

    .hero-title-minimal {
      font-size: clamp(1.75rem, 9vw, 2rem);
      margin-bottom: 0.75rem;
    }

    .hero-desc-minimal {
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .hero-stats-card {
      padding: 1.25rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .stat-minimal {
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }

    .stat-number {
      font-size: 1.25rem;
    }

    .stat-label {
      font-size: 0.85rem;
    }

    .btn-minimal {
      padding: 1.125rem 1.5rem;
      font-size: 0.95rem;
    }

    .badge-minimal {
      font-size: 0.75rem;
      padding: 0.35rem 0.9rem;
    }

    /* Hide some geometric shapes for performance */
    .shape-2,
    .shape-3 {
      display: none;
    }

    .shape-1 {
      width: 150px;
      height: 150px;
      opacity: 0.5;
    }
  }

  /* Hover effects for desktop */
  @media (hover: hover) {
    .hero-stats-card:hover {
      transform: translateY(-25px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .stat-minimal:hover .stat-number {
      transform: scale(1.1);
    }
  }
</style>
