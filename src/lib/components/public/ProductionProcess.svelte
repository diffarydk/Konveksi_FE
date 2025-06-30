<!-- Minimalist ProductionProcess.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';

  interface ProcessStep {
    number: number;
    title: string;
    description: string;
    icon: string;
  }

  const processSteps: ProcessStep[] = [
    {
      number: 1,
      title: 'Konsultasi Design',
      description: 'Tim desainer kami akan berdiskusi dengan Anda untuk memahami kebutuhan dan mengembangkan konsep yang sesuai dengan visi Anda.',
      icon: 'fas fa-pencil-ruler'
    },
    {
      number: 2,
      title: 'Pemilihan Material',
      description: 'Kami membantu memilih bahan berkualitas premium yang sesuai dengan budget dan kebutuhan produk Anda.',
      icon: 'fas fa-swatchbook'
    },
    {
      number: 3,
      title: 'Pembuatan Sample',
      description: 'Sample produk dibuat untuk memastikan design, ukuran, dan kualitas sesuai dengan ekspektasi sebelum produksi massal.',
      icon: 'fas fa-tshirt'
    },
    {
      number: 4,
      title: 'Produksi Massal',
      description: 'Proses produksi dilakukan dengan teknologi modern dan pengawasan quality control di setiap tahapan.',
      icon: 'fas fa-industry'
    },
    {
      number: 5,
      title: 'Quality Check',
      description: 'Setiap produk melalui pemeriksaan kualitas yang ketat sebelum dikemas dan dikirim ke pelanggan.',
      icon: 'fas fa-check-double'
    }
  ];

  let activeStep = 0;
  let isVisible = false;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible = true;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const section = document.querySelector('.process');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });

  function setActiveStep(index: number) {
    activeStep = index;
  }
</script>

<section class="process" id="process">
  <div class="process-container">
    <!-- Section Header -->
    <div class="section-header" in:fade={{ delay: 300, duration: 800 }}>
      <h2 class="section-title">Proses Produksi</h2>
      <p class="section-subtitle">
        Setiap tahapan diawasi dengan ketat untuk memastikan kualitas terbaik
      </p>
    </div>
    
    <!-- Process Visual -->
    <div class="process-visual" in:fly={{ y: 50, duration: 800, delay: 500 }}>
      <!-- Progress Bar -->
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          style="width: {((activeStep + 1) / processSteps.length) * 100}%"
        ></div>
      </div>
      
      <!-- Steps -->
      <div class="process-steps">
        {#each processSteps as step, index}
          <div 
            class="step"
            class:active={activeStep === index}
            on:click={() => setActiveStep(index)}
            on:keypress={(e) => e.key === 'Enter' && setActiveStep(index)}
            role="button"
            tabindex="0"
          >
            <div class="step-indicator">
              <i class={step.icon}></i>
            </div>
            <div class="step-info">
              <span class="step-number">0{step.number}</span>
              <h3 class="step-title">{step.title}</h3>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Content Display -->
      <div class="process-content">
        <div class="content-card" in:fade={{ duration: 300 }}>
          <h4>{processSteps[activeStep].title}</h4>
          <p>{processSteps[activeStep].description}</p>
        </div>
      </div>
    </div>
    
    <!-- Process Stats -->
    <div class="process-stats" in:fly={{ y: 30, duration: 800, delay: 800 }}>
      <div class="stat-item">
        <i class="fas fa-clock"></i>
        <span class="stat-value">10-14</span>
        <span class="stat-label">Hari Kerja</span>
      </div>
      <div class="stat-item">
        <i class="fas fa-user-check"></i>
        <span class="stat-value">100%</span>
        <span class="stat-label">QC Check</span>
      </div>
      <div class="stat-item">
        <i class="fas fa-shield-alt"></i>
        <span class="stat-value">Garansi</span>
        <span class="stat-label">Kualitas</span>
      </div>
    </div>
  </div>
</section>

<style>
  .process {
    padding: 8rem 2rem;
    background: var(--white);
    position: relative;
  }

  .process-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Section Header */
  .section-header {
    text-align: center;
    margin-bottom: 5rem;
  }

  .section-title {
    font-size: 2.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-dark);
  }

  .section-subtitle {
    color: var(--text-light);
    max-width: 500px;
    margin: 0 auto;
    font-size: 1.1rem;
    line-height: 1.6;
  }

  /* Process Visual */
  .process-visual {
    position: relative;
    padding: 2rem 0;
  }

  /* Progress Bar */
  .progress-bar {
    position: absolute;
    top: 60px;
    left: 10%;
    right: 10%;
    height: 2px;
    background: var(--bg-light);
    z-index: 0;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.5s ease;
  }

  /* Process Steps */
  .process-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4rem;
    position: relative;
    z-index: 1;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .step-indicator {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background: var(--bg-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--text-light);
    margin-bottom: 1rem;
    transition: all 0.3s ease;
  }

  .step.active .step-indicator {
    background: var(--primary);
    color: var(--white);
    transform: translateY(-5px);
  }

  .step-info {
    text-align: center;
  }

  .step-number {
    display: block;
    font-size: 0.8rem;
    color: var(--text-light);
    margin-bottom: 0.3rem;
  }

  .step-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dark);
    transition: color 0.3s ease;
  }

  .step.active .step-title {
    color: var(--primary);
  }

  /* Content Display */
  .process-content {
    max-width: 700px;
    margin: 0 auto 4rem;
  }

  .content-card {
    background: var(--bg-light);
    padding: 2.5rem;
    border-radius: 16px;
    text-align: center;
  }

  .content-card h4 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 1rem;
  }

  .content-card p {
    color: var(--text-light);
    line-height: 1.8;
    font-size: 1.1rem;
  }

  /* Process Stats */
  .process-stats {
    display: flex;
    justify-content: center;
    gap: 4rem;
    padding: 2rem;
    background: var(--bg-light);
    border-radius: 16px;
  }

  .stat-item {
    text-align: center;
  }

  .stat-item i {
    font-size: 1.5rem;
    color: var(--primary);
    margin-bottom: 0.8rem;
  }

  .stat-value {
    display: block;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 0.3rem;
  }

  .stat-label {
    display: block;
    font-size: 0.9rem;
    color: var(--text-light);
  }

  /* Responsive */
  @media (max-width: 968px) {
    .process-steps {
      flex-wrap: wrap;
      gap: 2rem;
      justify-content: center;
    }
    
    .progress-bar {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .process {
      padding: 6rem 1rem;
    }
    
    .section-title {
      font-size: 2rem;
    }
    
    .process-stats {
      flex-direction: column;
      gap: 2rem;
    }
    
    .content-card {
      padding: 2rem;
    }
    
    .content-card h4 {
      font-size: 1.3rem;
    }
    
    .content-card p {
      font-size: 1rem;
    }
  }
</style>