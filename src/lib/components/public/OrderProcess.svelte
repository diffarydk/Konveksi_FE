{@html '<!--OrderProcess.svelte-->'}
<!-- Enhanced OrderProcess.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  
  interface Step {
    number: number;
    icon: string;
    title: string;
    description: string;
    color: string;
    details: string[];
  }

  const steps: Step[] = [
    {
      number: 1,
      icon: 'fab fa-whatsapp',
      title: 'Konsultasi via WhatsApp',
      description: 'Hubungi kami melalui WhatsApp untuk diskusi awal mengenai kebutuhan Anda.',
      color: '#25D366',
      details: [
        'Diskusi desain dan spesifikasi',
        'Konsultasi bahan dan ukuran',
        'Estimasi biaya awal'
      ]
    },
    {
      number: 2,
      icon: 'fas fa-pencil-alt',
      title: 'Finalisasi Desain & Harga',
      description: 'Tim kami akan membantu finalisasi desain dan memberikan penawaran harga.',
      color: '#2563eb',
      details: [
        'Pembuatan mock-up desain',
        'Penentuan quantity dan size',
        'Penawaran harga final'
      ]
    },
    {
      number: 3,
      icon: 'fas fa-credit-card',
      title: 'Pembayaran Mudah',
      description: 'Setelah deal, Anda akan menerima link pembayaran yang aman dan nyaman.',
      color: '#22c55e',
      details: [
        'Multiple payment methods',
        'Secure payment gateway',
        'Konfirmasi otomatis'
      ]
    },
    {
      number: 4,
      icon: 'fas fa-industry',
      title: 'Proses Produksi',
      description: 'Produksi dimulai dengan quality control di setiap tahapan.',
      color: '#f59e0b',
      details: [
        'Cutting & sewing',
        'Quality checking',
        'Update progress berkala'
      ]
    },
    {
      number: 5,
      icon: 'fas fa-shipping-fast',
      title: 'Pengiriman',
      description: 'Produk jadi akan dikirim ke alamat Anda dengan packaging premium.',
      color: '#ef4444',
      details: [
        'Packaging premium',
        'Tracking number',
        'Asuransi pengiriman'
      ]
    }
  ];

  let activeStep = 1;
  let isVisible = false;
  let progress = 0;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible = true;
          animateProgress();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const section = document.querySelector('.order-process');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });

  function animateProgress() {
    const interval = setInterval(() => {
      if (progress < 100) {
        progress += 2;
      } else {
        clearInterval(interval);
      }
    }, 30);
  }

  function setActiveStep(stepNumber: number) {
    activeStep = stepNumber;
  }
</script>

<section class="order-process" id="order-process">
  <!-- Background Elements -->
  <div class="process-background">
    <div class="gradient-circle circle-1"></div>
    <div class="gradient-circle circle-2"></div>
    <div class="pattern-overlay"></div>
  </div>

  <div class="process-container">
    <!-- Section Header -->
    <div class="section-header" in:fly={{ y: 50, duration: 800, delay: 200 }}>
      <span class="section-label">PROSES PEMESANAN</span>
      <h2 class="section-title">
        Cara Order yang <span class="highlight">Mudah & Cepat</span>
      </h2>
      <p class="section-subtitle">
        Proses pemesanan yang transparan dan efisien untuk kenyamanan Anda
      </p>
    </div>

    <!-- Steps Timeline -->
    <div class="steps-timeline" in:fade={{ duration: 800, delay: 400 }}>
      <!-- Progress Bar -->
      <div class="progress-bar-container">
        <div 
          class="progress-bar" 
          style="width: {isVisible ? (activeStep - 1) * 25 : 0}%"
        ></div>
        {#each steps as step, index}
          <div 
            class="progress-node"
            class:active={activeStep >= step.number}
            class:current={activeStep === step.number}
            style="left: {index * 25}%"
            on:click={() => setActiveStep(step.number)}
            on:keypress={(e) => e.key === 'Enter' && setActiveStep(step.number)}
            role="button"
            tabindex="0"
          >
            <div class="node-icon" style="background: {step.color}">
              <i class={step.icon}></i>
            </div>
            <span class="node-number">{step.number}</span>
          </div>
        {/each}
      </div>

      <!-- Step Cards -->
      <div class="steps-cards">
        {#each steps as step, index}
          <div
            class="step-card"
            class:active={activeStep === step.number}
            in:fly={{ 
              x: -50, 
              duration: 600, 
              delay: 600 + (index * 100),
              easing: cubicOut
            }}
            on:click={() => setActiveStep(step.number)}
            on:keypress={(e) => e.key === 'Enter' && setActiveStep(step.number)}
            role="button"
            tabindex="0"
          >
            <!-- Card Header -->
            <div class="card-header" style="--step-color: {step.color}">
              <div class="step-icon">
                <i class={step.icon}></i>
              </div>
              <div class="step-info">
                <span class="step-number">Langkah {step.number}</span>
                <h3 class="step-title">{step.title}</h3>
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <p class="step-description">{step.description}</p>
              
              <!-- Step Details -->
              <div class="step-details">
                {#each step.details as detail}
                  <div class="detail-item" in:fly={{ x: -20, duration: 400, delay: 100 * index }}>
                    <i class="fas fa-check-circle" style="color: {step.color}"></i>
                    <span>{detail}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Active Indicator -->
            <div class="active-indicator" style="background: {step.color}"></div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Call to Action -->
    <div class="process-cta" in:fly={{ y: 50, duration: 800, delay: 1200 }}>
      <div class="cta-content">
        <h3>Siap untuk memulai?</h3>
        <p>Konsultasikan kebutuhan Anda dengan tim kami sekarang juga!</p>
      </div>
      <a 
        href="https://wa.me/62087776299650?text=Halo%20Hay%20Hill%20Clothing,%20saya%20ingin%20konsultasi%20untuk%20pesanan"
        target="_blank"
        class="cta-button"
      >
        <i class="fab fa-whatsapp"></i>
        <span>Mulai Konsultasi</span>
        <div class="button-shine"></div>
      </a>
    </div>

    <!-- Floating Elements -->
    <div class="floating-elements">
      {#each Array(5) as _, i}
        <div 
          class="floating-icon icon-{i}"
          style="
            animation-delay: {Math.random() * 3}s;
            left: {Math.random() * 100}%;
            top: {Math.random() * 100}%;
          "
        >
          <i class="{steps[i].icon}"></i>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .order-process {
    padding: 7rem 2rem;
    background: var(--white);
    position: relative;
    overflow: hidden;
  }

  /* Background Elements */
  .process-background {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .gradient-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.2;
  }

  .circle-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
    top: -250px;
    right: -250px;
  }

  .circle-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, var(--yellow) 0%, transparent 70%);
    bottom: -200px;
    left: -200px;
  }

  .pattern-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 2px 2px, rgba(0,0,0,0.03) 1px, transparent 1px);
    background-size: 30px 30px;
  }

  /* Container */
  .process-container {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
  }

  /* Section Header */
  .section-header {
    text-align: center;
    margin-bottom: 5rem;
  }

  .section-label {
    display: inline-block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary);
    background: rgba(37, 99, 235, 0.1);
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
    margin-bottom: 1rem;
    letter-spacing: 1px;
  }

  .section-title {
    font-size: 2.8rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--text-dark);
    line-height: 1.2;
  }

  .highlight {
    background: linear-gradient(120deg, var(--primary) 0%, var(--yellow) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-subtitle {
    color: var(--text-light);
    max-width: 600px;
    margin: 0 auto;
    font-size: 1.1rem;
    line-height: 1.6;
  }

  /* Steps Timeline */
  .steps-timeline {
    position: relative;
    margin-bottom: 6rem;
  }

  /* Progress Bar */
  .progress-bar-container {
    position: relative;
    height: 4px;
    background: var(--bg-light);
    border-radius: 4px;
    margin: 4rem 0;
  }

  .progress-bar {
    position: absolute;
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--yellow));
    border-radius: 4px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-node {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .node-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font-size: 1.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .progress-node.active .node-icon {
    transform: scale(1.1);
  }

  .progress-node.current .node-icon {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
    100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
  }

  .node-number {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-weight: 600;
    color: var(--text-dark);
  }

  /* Step Cards */
  .steps-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-top: 8rem;
  }

  .step-card {
    background: var(--white);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border: 1px solid var(--bg-light);
  }

  .step-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .step-card.active {
    border-color: var(--step-color);
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }

  /* Card Header */
  .card-header {
    padding: 1.5rem;
    background: var(--bg-light);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .step-card.active .card-header {
    background: linear-gradient(135deg, var(--step-color), transparent);
  }

  .step-icon {
    width: 50px;
    height: 50px;
    background: var(--white);
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--step-color);
    transition: all 0.3s ease;
  }

  .step-card:hover .step-icon {
    transform: rotate(-10deg) scale(1.1);
  }

  .step-info {
    flex: 1;
  }

  .step-number {
    display: block;
    font-size: 0.9rem;
    color: var(--text-light);
    margin-bottom: 0.3rem;
  }

  .step-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-dark);
    margin: 0;
  }

  /* Card Content */
  .card-content {
    padding: 1.5rem;
  }

  .step-description {
    color: var(--text-light);
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .step-details {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .detail-item i {
    font-size: 0.9rem;
  }

  .detail-item span {
    font-size: 0.9rem;
    color: var(--text-dark);
  }

  /* Active Indicator */
  .active-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    transform: scaleX(0);
    transition: transform 0.3s ease;
    transform-origin: left;
  }

  .step-card.active .active-indicator {
    transform: scaleX(1);
  }

  /* Call to Action */
  .process-cta {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-radius: 24px;
    padding: 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
    margin-top: 4rem;
  }

  .process-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .cta-content {
    position: relative;
    z-index: 1;
  }

  .cta-content h3 {
    color: var(--white);
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }

  .cta-content p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1rem;
  }

  .cta-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    background: #25D366;
    color: var(--white);
    padding: 1.2rem 2.5rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    overflow: hidden;
    z-index: 1;
  }

  .cta-button:hover {
    background: #128C7E;
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .button-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.7s;
  }

  .cta-button:hover .button-shine {
    left: 100%;
  }

  /* Floating Elements */
  .floating-elements {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .floating-icon {
    position: absolute;
    width: 40px;
    height: 40px;
    background: var(--bg-light);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    opacity: 0.1;
    animation: floatIcons 15s infinite ease-in-out;
  }

  @keyframes floatIcons {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(20px, -40px) rotate(90deg); }
    50% { transform: translate(-20px, -80px) rotate(180deg); }
    75% { transform: translate(30px, -20px) rotate(270deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .section-title {
      font-size: 2.2rem;
    }

    .progress-bar-container {
      margin: 6rem 0;
    }

    .steps-cards {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .process-cta {
      flex-direction: column;
      text-align: center;
      gap: 2rem;
      padding: 2rem;
    }

    .cta-content h3 {
      font-size: 1.5rem;
    }
  }
</style>