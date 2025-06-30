<!-- src/+page.svelte -->
<script lang="ts">
  import Navbar from "$lib/components/public/Navbar.svelte";
  import Hero from "$lib/components/public/Hero.svelte";
  import Features from "$lib/components/public/Features.svelte";
  import OrderProcess from "$lib/components/public/OrderProcess.svelte";
  import ProductionProcess from "$lib/components/public/ProductionProcess.svelte";
  import Statistics from "$lib/components/public/Statistics.svelte";
  import Testimonials from "$lib/components/public/Testimonials.svelte";
  import Products from "$lib/components/public/Products.svelte";
  import FAQ from "$lib/components/public/FAQ.svelte";
  import Contact from "$lib/components/public/Contact.svelte";
  import Address from "$lib/components/public/Address.svelte";
  import Footer from "$lib/components/public/Footer.svelte";
  import BackToTop from "$lib/components/public/BackToTop.svelte";

  import "../app.css";
</script>

<Navbar />
<Hero />
<Features />
<OrderProcess />
<ProductionProcess />
<Statistics />
<Testimonials />
<Products />
<FAQ />
<Contact />
<Address />
<Footer />
<BackToTop />
