<!-- ResponsiveImage.svelte - Komponen untuk optimasi gambar responsive -->
<script lang="ts">
  export let src: string;
  export let alt: string;
  export let srcset: string = "";
  export let sizes: string = "100vw";
  export let loading: "lazy" | "eager" = "lazy";
  export let width: number | undefined = undefined;
  export let height: number | undefined = undefined;
  export let className: string = "";
  export let objectFit: "cover" | "contain" | "fill" | "scale-down" | "none" =
    "cover";
  export let fallbackSrc: string = "";

  let imgElement: HTMLImageElement;
  let imageLoaded = false;
  let imageError = false;

  // Generate automatic srcset if not provided
  function generateSrcset(baseSrc: string): string {
    if (srcset) return srcset;

    const ext = baseSrc.split(".").pop();
    const baseName = baseSrc.replace(`.${ext}`, "");

    // Generate multiple sizes based on common breakpoints
    return [
      `${baseName}-small.${ext} 480w`,
      `${baseName}-medium.${ext} 768w`,
      `${baseName}-large.${ext} 1024w`,
      `${baseName}-xl.${ext} 1200w`,
      `${baseSrc} 1920w`,
    ].join(", ");
  }

  function handleLoad() {
    imageLoaded = true;
    imageError = false;
  }

  function handleError() {
    imageError = true;
    if (fallbackSrc && imgElement.src !== fallbackSrc) {
      imgElement.src = fallbackSrc;
    }
  }
</script>

<div class="responsive-image-container {className}">
  {#if !imageLoaded}
    <div class="image-skeleton" class:error={imageError}>
      <div class="skeleton-shimmer"></div>
      {#if imageError}
        <i class="fas fa-image error-icon"></i>
      {/if}
    </div>
  {/if}

  <img
    bind:this={imgElement}
    {src}
    srcset={generateSrcset(src)}
    {sizes}
    {alt}
    {loading}
    {width}
    {height}
    class="responsive-image"
    class:loaded={imageLoaded}
    style="object-fit: {objectFit}"
    on:load={handleLoad}
    on:error={handleError}
  />
</div>

<style>
  .responsive-image-container {
    position: relative;
    display: block;
    overflow: hidden;
  }

  .responsive-image {
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.3s ease;
    /* Optimize rendering */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  .responsive-image.loaded {
    opacity: 1;
  }

  .image-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-skeleton.error {
    background: #f5f5f5;
    animation: none;
  }

  .skeleton-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  .error-icon {
    font-size: 2rem;
    color: #ccc;
    z-index: 1;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* High DPI screen optimization */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .responsive-image {
      image-rendering: -webkit-optimize-contrast;
    }
  }

  /* Prefers reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .image-skeleton,
    .skeleton-shimmer {
      animation: none;
    }

    .responsive-image {
      transition: none;
    }
  }
</style>
