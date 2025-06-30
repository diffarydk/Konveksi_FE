{@html '<!--BackToTop.svelte-->'}
<script lang="ts">
  import { onMount } from 'svelte';

  let isActive = false;

  onMount(() => {
    function handleScroll() {
      isActive = window.scrollY > 300;
    }

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
</script>

<a href="#" 
   class="back-to-top" 
   class:active={isActive} 
   on:click|preventDefault={scrollToTop}
   aria-label="Back to top">
  <i class="fas fa-arrow-up"></i>
</a>

<style>
  /* Back to top button */
  .back-to-top {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: var(--yellow);
    color: var(--text-dark);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 1.25rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    opacity: 0;
    visibility: hidden;
    z-index: 99;
  }

  .back-to-top.active {
    opacity: 1;
    visibility: visible;
  }

  .back-to-top:hover {
    transform: translateY(-5px);
    background: var(--yellow-dark);
  }
</style>