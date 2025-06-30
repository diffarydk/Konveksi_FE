import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Hard Refresh Performance Optimizations
	server: {
		// Dev server optimizations
		hmr: {
			overlay: false // Disable error overlay for better performance
		}
	},
	
	// Build optimizations that also help dev performance
	build: {
		// Enable rollup optimizations
		rollupOptions: {
			output: {
				// Manual chunks for better caching
				manualChunks: {
					// Vendor libraries
					'vendor-core': ['svelte', '@sveltejs/kit'],
					'vendor-ui': ['@melt-ui/svelte'],
					// Admin specific chunks
					'admin-components': [
						'src/lib/components/admin/Orders/OrderList.svelte',
						'src/lib/components/admin/Orders/OrderForm.svelte',
						'src/lib/components/admin/common/Breadcrumb.svelte'
					],
					// Services chunk
					'services': [
						'src/lib/services/orders.ts',
						'src/lib/services/api.ts'
					]
				}
			}
		},
		// Source maps for debugging (can be disabled in prod)
		sourcemap: false, // Disable for better performance
		// Minification settings
		minify: 'esbuild', // Faster than terser
		// Target modern browsers for better performance
		target: 'es2020'
	},
	
	// Dependency optimization
	optimizeDeps: {
		// Pre-bundle these dependencies
		include: [
			'svelte/transition',
			'svelte/easing',
			'@melt-ui/svelte',
			'chart.js',
			'chart.js/auto'
		],
		// Exclude from pre-bundling (let Vite handle them)
		exclude: [
			'@sveltejs/kit'
		]
	},
	
	// Performance settings
	esbuild: {
		// Optimize for development speed
		target: 'es2020',
		// Keep function names for better debugging
		keepNames: true
	},
	
	// Cache settings for better hard refresh performance
	cacheDir: 'node_modules/.vite',
	
	// CSS optimization
	css: {
		// Dev source maps (can be disabled for even better perf)
		devSourcemap: false,
		// PostCSS optimizations
		postcss: {
			plugins: []
		}
	}
});
