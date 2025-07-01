import {preprocessMeltUI, sequence} from "@melt-ui/pp";
import adapter from '@sveltejs/adapter-vercel';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
/** @type {import('@sveltejs/kit').Config}*/
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    // Using Vercel adapter for optimal deployment
    adapter: adapter({
      // Optional: Enable edge runtime for better performance
      runtime: 'nodejs18.x'
    })
  }
};
export default config;
