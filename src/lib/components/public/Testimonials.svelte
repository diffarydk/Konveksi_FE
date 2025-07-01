<script lang="ts">
  import { onMount } from "svelte";
  import Swiper from "swiper";
  import {
    Navigation,
    Pagination,
    Autoplay,
    EffectCoverflow,
  } from "swiper/modules";
  import { fadeIn, setupScrollAnimations } from "$lib/utils/animations";

  interface Testimonial {
    text: string;
    authorName: string;
    authorTitle: string;
    authorImage: string;
    rating: number;
  }

  const testimonials: Testimonial[] = [
    {
      text: '"Hay Hill Clothing telah menjadi mitra kami selama 5 tahun. Kualitas produksi dan ketepatan waktu mereka luar biasa. Sangat direkomendasikan untuk kebutuhan seragam perusahaan."',
      authorName: "Sarah Anderson",
      authorTitle: "HR Director, Tech Corp Indonesia",
      authorImage: "images/employee.jpg",
      rating: 5,
    },
    {
      text: '"Kami sangat puas dengan kualitas produk dari Hay Hill Clothing. Design sesuai dengan keinginan kami dan proses produksi tepat waktu. Tim customer service juga sangat responsif."',
      authorName: "Budi Santoso",
      authorTitle: "CEO, Santoso Group",
      authorImage: "images/employee.jpg",
      rating: 5,
    },
    {
      text: '"Sebagai perusahaan startup, kami membutuhkan partner yang fleksibel dan memahami kebutuhan kami. Hay Hill Clothing adalah pilihan tepat! Mereka memberikan saran terbaik untuk budget kami."',
      authorName: "Anisa Wijaya",
      authorTitle: "Founder, Creative Hub Jakarta",
      authorImage: "images/employee.jpg",
      rating: 4,
    },
  ];

  let swiperContainer: HTMLElement;
  let sectionElement: HTMLElement;
  let isVisible = false;

  onMount(() => {
    Swiper.use([Navigation, Pagination, Autoplay, EffectCoverflow]);

    const swiper = new Swiper(swiperContainer, {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      effect: "coverflow",
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: false,
      },
      grabCursor: true, // Ensure cursor shows as grab hand
      autoplay: {
        delay: 8000,
        disableOnInteraction: true,
        pauseOnMouseEnter: true,
      },
      speed: 1000,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        640: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 1,
        },
        1024: {
          slidesPerView: 1,
        },
      },
      on: {
        slideChangeTransitionStart: function () {
          const activeSlide = document.querySelector(
            ".swiper-slide-active .testimonial-item"
          );
          if (activeSlide) {
            activeSlide.classList.add("active");
          }
        },
        slideChangeTransitionEnd: function () {
          document
            .querySelectorAll(
              ".testimonial-item:not(.swiper-slide-active .testimonial-item)"
            )
            .forEach((item) => {
              item.classList.remove("active");
            });
        },
      },
    });

    // Setup intersection observer to trigger animation when the testimonials section is in view
    if (sectionElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isVisible = true;
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(sectionElement);
    }
  });

  function renderStars(rating: number) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return [
      ...Array(fullStars).fill("fas fa-star"),
      ...(halfStar ? ["fas fa-star-half-alt"] : []),
      ...Array(emptyStars).fill("far fa-star"),
    ];
  }
</script>

{@html "<!--Testimonials.svelte-->"}

<section class="testimonials" id="testimonials" bind:this={sectionElement}>
  <div class="testimonials-background"></div>

  <!-- Removed gradient lines -->

  <h2 class="section-title">Apa Kata Klien Kami</h2>
  <p class="section-subtitle">Kepuasan pelanggan adalah prioritas utama kami</p>

  <div class="testimonials-container">
    <div class="quote-icon-left">
      <i class="fas fa-quote-left"></i>
    </div>

    <div class="quote-icon-right">
      <i class="fas fa-quote-right"></i>
    </div>

    <div class="swiper testimonials-swiper" bind:this={swiperContainer}>
      <div class="swiper-wrapper">
        {#each testimonials as testimonial, index}
          <div class="swiper-slide">
            <div class="testimonial-item {index === 0 ? 'active' : ''}">
              <div class="blue-strip"></div>
              <div class="testimonial-rating">
                {#each renderStars(testimonial.rating) as star}
                  <i class={star}></i>
                {/each}
              </div>

              <p class="testimonial-text">{testimonial.text}</p>

              <div class="testimonial-author">
                <div class="author-image-container">
                  <img
                    src={testimonial.authorImage}
                    alt={testimonial.authorName}
                    class="author-image"
                  />
                </div>
                <div class="author-info">
                  <div class="author-name">{testimonial.authorName}</div>
                  <div class="author-title">{testimonial.authorTitle}</div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="swiper-pagination"></div>
    </div>

    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
  </div>

  <div class="testimonial-cta">
    <p>Bergabunglah dengan ribuan pelanggan yang puas dengan layanan kami</p>
    <a href="#contact" class="btn-cta">
      <i class="fas fa-comments"></i> Konsultasi Gratis
    </a>
  </div>
</section>

<style>
  .testimonials {
    padding: 7rem 2rem;
    background: var(--bg-light);
    position: relative;
    overflow: hidden;
  }

  .testimonials-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
  }

  /* Removed gradient line styles */

  .section-title {
    position: relative;
    text-align: center;
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-dark);
    z-index: 1;
  }

  .section-title::after {
    content: "";
    display: block;
    width: 80px;
    height: 3px;
    background: var(--yellow);
    margin: 1rem auto 0;
    border-radius: 3px;
  }

  .section-title::before {
    content: "";
    display: block;
    width: 40px;
    height: 3px;
    background: var(--primary);
    margin: 0 auto 1rem;
    border-radius: 3px;
  }

  .section-subtitle {
    position: relative;
    text-align: center;
    max-width: 600px;
    margin: 0 auto 3rem;
    color: var(--text-light);
    line-height: 1.6;
    z-index: 1;
  }

  .testimonials-container {
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 0;
    z-index: 1;
  }

  .quote-icon-left,
  .quote-icon-right {
    position: absolute;
    font-size: 8rem;
    color: rgba(37, 99, 235, 0.08);
    z-index: 0;
  }

  .quote-icon-left {
    top: 0;
    left: -2rem;
  }

  .quote-icon-right {
    bottom: 0;
    right: -2rem;
  }

  .testimonial-item {
    background: var(--white);
    padding: 3rem;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    height: 100%;
    transform: scale(0.95);
    opacity: 0.8;
    transition: all 0.5s ease;
    position: relative;
    border-top: 5px solid var(--yellow);
    border-bottom: 5px solid var(--primary-light);
    overflow: hidden;
    cursor: default; /* Fix disappearing cursor */
  }

  .blue-strip {
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background: var(--primary);
    transition: all 0.5s ease;
    transform: scaleY(0);
    transform-origin: top;
  }

  .testimonial-item.active {
    transform: scale(1);
    opacity: 1;
  }

  .testimonial-item.active .blue-strip {
    transform: scaleY(1);
  }

  .testimonial-rating {
    margin-bottom: 1.5rem;
    color: var(--yellow);
    font-size: 1.2rem;
    display: flex;
    gap: 0.3rem;
  }

  .testimonial-text {
    font-size: 1.3rem;
    line-height: 1.8;
    margin-bottom: 2rem;
    color: var(--text-dark);
    font-style: italic;
    position: relative;
  }

  .testimonial-text::first-letter {
    color: var(--primary);
    font-size: 1.8rem;
    font-weight: bold;
  }

  .testimonial-author {
    display: flex;
    align-items: center;
    gap: 1rem;
    border-top: 1px solid rgba(37, 99, 235, 0.1);
    padding-top: 1.5rem;
  }

  .author-image-container {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--white);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .author-image-container::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 3px solid transparent;
    border-top-color: var(--primary);
    border-bottom-color: var(--primary);
    border-radius: 50%;
    animation: rotate 5s linear infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .testimonial-item:hover .author-image-container::after {
    opacity: 1;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .author-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }

  .testimonial-item:hover .author-image {
    transform: scale(1.05);
  }

  .author-info {
    text-align: left;
  }

  .author-name {
    font-weight: 700;
    color: var(--primary);
    font-size: 1.1rem;
    margin-bottom: 0.2rem;
  }

  .author-title {
    color: var(--text-light);
    font-size: 0.9rem;
  }

  :global(.swiper-pagination) {
    position: relative;
    margin-top: 2rem;
  }

  :global(.swiper-pagination-bullet) {
    width: 12px;
    height: 12px;
    background: var(--primary);
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  :global(.swiper-pagination-bullet-active) {
    opacity: 1;
    background: var(--yellow);
    transform: scale(1.2);
  }

  :global(.swiper-button-next),
  :global(.swiper-button-prev) {
    color: var(--white);
    background: var(--primary);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    box-shadow: 0 5px 15px rgba(37, 99, 235, 0.2);
    transition: all 0.3s ease;
  }

  :global(.swiper-button-next:hover),
  :global(.swiper-button-prev:hover) {
    background: var(--yellow);
    color: var(--text-dark);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  :global(.swiper-button-next:after),
  :global(.swiper-button-prev:after) {
    font-size: 1.2rem;
  }

  .testimonial-cta {
    text-align: center;
    margin-top: 4rem;
    position: relative;
    z-index: 1;
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.05),
      rgba(37, 99, 235, 0.1)
    );
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    padding: 2rem;
    border-radius: 20px;
    border-left: 4px solid var(--primary);
    border-right: 4px solid var(--yellow);
  }

  .testimonial-cta p {
    color: var(--text-dark);
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .btn-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    background: var(--primary);
    color: var(--white);
    font-weight: 600;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    text-decoration: none;
    box-shadow: 0 5px 15px rgba(37, 99, 235, 0.2);
    transition: all 0.3s ease;
  }

  .btn-cta:hover {
    background: var(--yellow);
    color: var(--text-dark);
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  /* Tablet Styles */
  @media (max-width: 1024px) {
    .testimonials {
      padding: 5rem 1.5rem;
    }

    .section-title {
      font-size: 2rem;
    }

    .testimonial-item {
      padding: 2.5rem;
    }

    .testimonial-text {
      font-size: 1.2rem;
    }

    .testimonial-cta {
      margin-top: 3rem;
      padding: 1.75rem;
    }
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .testimonials {
      padding: 3rem 1rem;
    }

    .section-title {
      font-size: 1.75rem;
      margin-bottom: 0.75rem;
    }

    .section-subtitle {
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }

    .testimonials-container {
      padding: 1.5rem 0;
    }

    .testimonial-item {
      padding: 1.5rem;
      border-radius: 16px;
    }

    .testimonial-text {
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .testimonial-rating {
      margin-bottom: 1rem;
      font-size: 1rem;
      justify-content: center;
    }

    .testimonial-author {
      padding-top: 1rem;
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }

    .author-image-container {
      width: 60px;
      height: 60px;
      align-self: center;
    }

    .author-info {
      text-align: center;
    }

    .author-name {
      font-size: 1rem;
    }

    .author-title {
      font-size: 0.85rem;
    }

    .quote-icon-left,
    .quote-icon-right {
      font-size: 4rem;
      opacity: 0.05;
    }

    .quote-icon-left {
      top: -1rem;
      left: -1rem;
    }

    .quote-icon-right {
      bottom: -1rem;
      right: -1rem;
    }

    :global(.swiper-button-next),
    :global(.swiper-button-prev) {
      width: 40px;
      height: 40px;
    }

    :global(.swiper-button-next:after),
    :global(.swiper-button-prev:after) {
      font-size: 0.9rem;
    }

    :global(.swiper-pagination) {
      margin-top: 1.5rem;
    }

    .testimonial-cta {
      margin-top: 2rem;
      padding: 1.5rem;
      border-radius: 16px;
    }

    .testimonial-cta p {
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    .btn-cta {
      padding: 0.875rem 1.5rem;
      font-size: 0.95rem;
      gap: 0.6rem;
    }
  }

  /* Small Mobile Styles */
  @media (max-width: 480px) {
    .testimonials {
      padding: 2rem 0.75rem;
    }

    .section-title {
      font-size: 1.5rem;
    }

    .testimonial-item {
      padding: 1.25rem;
    }

    .testimonial-text {
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .testimonial-rating {
      font-size: 0.9rem;
    }

    .author-image-container {
      width: 50px;
      height: 50px;
    }

    .author-name {
      font-size: 0.95rem;
    }

    .author-title {
      font-size: 0.8rem;
    }

    .quote-icon-left,
    .quote-icon-right {
      font-size: 3rem;
      display: none; /* Hide on very small screens for performance */
    }

    .testimonial-cta {
      padding: 1.25rem;
    }

    .testimonial-cta p {
      font-size: 0.9rem;
    }

    .btn-cta {
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
      width: 100%;
      justify-content: center;
    }
  }
</style>
