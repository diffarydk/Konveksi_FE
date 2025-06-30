{@html '<!--Statistics.svelte-->'}
<!-- Enhanced Statistics.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  interface Stat {
    value: number;
    label: string;
    unit: string;
    icon: string;
    color: string;
    delay: number;
  }

  const stats: Stat[] = [
    {
      value: 15,
      label: 'Tahun Pengalaman',
      unit: '+',
      icon: 'fas fa-award',
      color: '#2563eb',
      delay: 0
    },
    {
      value: 5000,
      label: 'Perusahaan Telah Bekerja Sama',
      unit: '+',
      icon: 'fas fa-building',
      color: '#22c55e',
      delay: 200
    },
    {
      value: 1000000,
      label: 'Produk Diproduksi',
      unit: '+',
      icon: 'fas fa-tshirt',
      color: '#f59e0b',
      delay: 400
    }
  ];

  let counters = stats.map(() => 0);
  let isVisible = false;
  let progressWidth = 0;

  function animateCounter(index: number, target: number, duration: number = 2000) {
    const startTime = Date.now();
    const startValue = counters[index];
    
    function update() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      counters[index] = Math.floor(startValue + (target - startValue) * easeOutQuart);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counters[index] = target;
      }
    }
    
    update();
  }

  function animateProgress() {
    const duration = 2000;
    const startTime = Date.now();
    
    function update() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      progressWidth = progress * 100;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    update();
  }

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isVisible) {
          isVisible = true;
          animateProgress();
          
          // Animate counters with delays
          stats.forEach((stat, index) => {
            setTimeout(() => {
              animateCounter(index, stat.value);
            }, stat.delay);
          });
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const section = document.querySelector('.statistics');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });
</script>

<section class="statistics" id="statistics">
  <!-- Background Animation -->
  <div class="stats-background">
    <div class="animated-grid"></div>
    <div class="gradient-overlay"></div>
    <div class="floating-shapes">
      {#each Array(10) as _, i}
        <div 
          class="shape shape-{i % 3}"
          style="
            left: {Math.random() * 100}%;
            animation-delay: {Math.random() * 5}s;
            animation-duration: {10 + Math.random() * 10}s;
          "
        ></div>
      {/each}
    </div>
  </div>

  <div class="stats-container">
    <!-- Section Header -->
    <div class="section-header" in:fly={{ y: 50, duration: 800, delay: 200 }}>
      <span class="section-label">PENCAPAIAN KAMI</span>
      <h2 class="section-title">
        Dipercaya oleh <span class="highlight">Ribuan Perusahaan</span>
      </h2>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          style="width: {progressWidth}%"
        ></div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      {#each stats as stat, index}
        <div
          class="stat-card"
          style="--stat-color: {stat.color}"
          in:fly={{ 
            y: 50, 
            duration: 800, 
            delay: 600 + stat.delay,
            easing: cubicOut
          }}
        >
          <!-- Icon Circle -->
          <div class="icon-circle">
            <div class="icon-inner">
              <i class={stat.icon}></i>
            </div>
            <div class="circle-progress">
              <svg viewBox="0 0 100 100">
                <circle
                  class="progress-bg"
                  cx="50"
                  cy="50"
                  r="45"
                />
                <circle
                  class="progress-value"
                  cx="50"
                  cy="50"
                  r="45"
                  style="stroke-dashoffset: {283 - (283 * (counters[index] / stat.value))}"
                />
              </svg>
            </div>
          </div>

          <!-- Counter -->
          <div class="stat-number">
            <span class="counter">{counters[index].toLocaleString()}</span>
            <span class="unit">{stat.unit}</span>
          </div>

          <!-- Label -->
          <div class="stat-label">{stat.label}</div>

          <!-- Decorative Elements -->
          <div class="card-decoration decoration-1"></div>
          <div class="card-decoration decoration-2"></div>
        </div>
      {/each}
    </div>

    <!-- Bottom CTA -->
    <div class="stats-cta" in:fly={{ y: 50, duration: 800, delay: 1200 }}>
      <p>Bergabunglah dengan ribuan perusahaan yang telah mempercayai kami</p>
      <a href="#contact" class="cta-button">
        <span>Mulai Kerjasama</span>
        <i class="fas fa-arrow-right"></i>
      </a>
    </div>
  </div>
</section>

<style>
  .statistics {
    padding: 7rem 2rem;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    position: relative;
    overflow: hidden;
  }

  /* Background Elements */
  .stats-background {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .animated-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }

  @keyframes gridMove {
    0% { transform: translate(0, 0); }
    100% { transform: translate(50px, 50px); }
  }

  .gradient-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%);
  }

  .floating-shapes {
    position: absolute;
    inset: 0;
  }

  .shape {
    position: absolute;
    opacity: 0.1;
    animation: floatShape 15s infinite ease-in-out;
  }

  .shape-0 {
    width: 80px;
    height: 80px;
    background: var(--yellow);
    border-radius: 50%;
  }

  .shape-1 {
    width: 60px;
    height: 60px;
    background: var(--white);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }

  .shape-2 {
    width: 70px;
    height: 70px;
    background: rgba(255,255,255,0.5);
    transform: rotate(45deg);
  }

  @keyframes floatShape {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-50px) rotate(180deg); }
  }

  /* Container */
  .stats-container {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
  }

  /* Section Header */
  .section-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .section-label {
    display: inline-block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--yellow);
    background: rgba(248, 225, 27, 0.1);
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
    margin-bottom: 1rem;
    letter-spacing: 1px;
  }

  .section-title {
    font-size: 2.8rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    color: var(--white);
    line-height: 1.2;
    text-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .highlight {
    color: var(--yellow);
    position: relative;
  }

  .highlight::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--yellow);
    border-radius: 3px;
  }

  .progress-bar {
    width: 120px;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
    margin: 0 auto;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--yellow);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .stat-card {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 2.5rem;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
  }

  .stat-card:hover {
    transform: translateY(-10px);
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,255,255,0.2);
  }

  /* Icon Circle */
  .icon-circle {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 2rem;
  }

  .icon-inner {
    position: absolute;
    inset: 15px;
    background: var(--stat-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font-size: 2.5rem;
    z-index: 2;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }

  .circle-progress {
    position: absolute;
    inset: 0;
  }

  .circle-progress svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .progress-bg {
    fill: none;
    stroke: rgba(255,255,255,0.1);
    stroke-width: 8;
  }

  .progress-value {
    fill: none;
    stroke: var(--stat-color);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 283;
    transition: stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Number */
  .stat-number {
    font-size: 3rem;
    font-weight: 800;
    color: var(--white);
    margin-bottom: 0.5rem;
    line-height: 1;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.2rem;
  }

  .unit {
    font-size: 2rem;
    color: var(--yellow);
  }

  /* Label */
  .stat-label {
    font-size: 1.1rem;
    color: rgba(255,255,255,0.9);
    line-height: 1.4;
    max-width: 250px;
    margin: 0 auto;
  }

  /* Card Decorations */
  .card-decoration {
    position: absolute;
    background: var(--stat-color);
    opacity: 0.1;
    border-radius: 50%;
  }

  .decoration-1 {
    width: 100px;
    height: 100px;
    top: -50px;
    right: -50px;
  }

  .decoration-2 {
    width: 60px;
    height: 60px;
    bottom: -30px;
    left: -30px;
  }

  /* CTA Section */
  .stats-cta {
    text-align: center;
    margin-top: 2rem;
  }

  .stats-cta p {
    color: rgba(255,255,255,0.9);
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    background: var(--yellow);
    color: var(--text-dark);
    padding: 1rem 2.5rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }

  .cta-button:hover {
    background: var(--yellow-dark);
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.3);
    gap: 1.2rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .section-title {
      font-size: 2.2rem;
    }

    .stat-number {
      font-size: 2.5rem;
    }

    .unit {
      font-size: 1.8rem;
    }

    .stat-label {
      font-size: 1rem;
    }

    .icon-circle {
      width: 100px;
      height: 100px;
    }

    .icon-inner {
      font-size: 2rem;
    }
  }
</style>