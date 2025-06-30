{@html '<!--MapLocation.svelte-->'}
<script lang="ts">
  import { onMount } from 'svelte';
  
  let isMapLoaded = false;
  
  onMount(() => {
    // Simulate map loading
    setTimeout(() => {
      isMapLoaded = true;
    }, 800);
  });
</script>

<section class="map-location" id="address">
  <h2 class="section-title">Alamat</h2>
  <p class="section-subtitle">
    Temukan kami di Telkom Bandung untuk konsultasi langsung
  </p>
  
  <div class="map-container">
    <div class="map-card">
      <div class="map-header">
        <div class="header-icon">
          <i class="fas fa-map-pin"></i>
        </div>
        <h3>Telkom Bandung</h3>
      </div>
      
      <div class="map-frame">
        {#if isMapLoaded}
          <img src="images/maps.png" alt="Peta lokasi Hay Hill Clothing di Telkom Bandung" class="map-image" />
          <div class="map-overlay">
            <a href="https://maps.app.goo.gl/psh9Gk1wV3tLgeCA9" class="btn-directions" target="_blank" rel="noopener">
              <i class="fas fa-directions"></i> Petunjuk Arah
            </a>
          </div>
        {:else}
          <div class="map-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Memuat peta...</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .map-location {
    padding: 7rem 2rem;
    background: var(--bg-light);
  }
  
  .section-title {
    text-align: center;
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 1rem;
  }
  
  .section-subtitle {
    text-align: center;
    max-width: 600px;
    margin: 0 auto 3rem;
    color: var(--text-light);
    line-height: 1.6;
  }
  
  .map-container {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .map-card {
    background: var(--white);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 30px rgba(0,0,0,0.08);
  }
  
  .map-header {
    padding: 1.5rem;
    background: var(--primary);
    color: var(--white);
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .header-icon {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }
  
  .map-header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }
  
  .map-frame {
    position: relative;
    height: 500px;
    background: #f5f5f5;
  }
  
  .map-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .map-overlay {
    position: absolute;
    bottom: 25px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }
  
  .btn-directions {
    padding: 1rem 2rem;
    background: var(--yellow);
    color: var(--text-dark);
    font-weight: 600;
    border-radius: 50px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    font-size: 1.1rem;
  }
  
  .btn-directions:hover {
    background: var(--yellow-dark);
    transform: translateY(-3px);
    box-shadow: 0 12px 25px rgba(0,0,0,0.2);
  }
  
  .map-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1.5rem;
    color: var(--text-light);
  }
  
  .map-loading i {
    font-size: 2.5rem;
    color: var(--primary);
  }
  
  .map-loading p {
    font-size: 1.1rem;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .section-title {
      font-size: 1.8rem;
    }
    
    .map-frame {
      height: 350px;
    }
    
    .map-header {
      padding: 1.2rem;
    }
    
    .btn-directions {
      padding: 0.8rem 1.5rem;
      font-size: 1rem;
    }
  }
</style>