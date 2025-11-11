import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { asyncCssPlugin } from "./vite-plugin-async-css";
import { performancePlugin } from "./vite-plugin-performance";
import { vitePrerenderPlugin } from "vite-prerender-plugin";
import { readFileSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load prerender routes if in production build
  let prerenderRoutes: string[] = [];
  if (mode === 'production') {
    const routesFile = path.resolve(__dirname, 'prerender-routes.json');
    if (existsSync(routesFile)) {
      try {
        prerenderRoutes = JSON.parse(readFileSync(routesFile, 'utf-8'));
        console.warn(`✅ Loaded ${prerenderRoutes.length} routes for prerendering`);
      } catch (error) {
        console.warn('⚠️  Could not load prerender-routes.json:', error);
      }
    } else {
      console.warn('⚠️  prerender-routes.json not found. Run `npm run generate-routes` first.');
    }
  }

  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    asyncCssPlugin(),
    performancePlugin(),
    // Only enable prerendering in production builds
    mode === 'production' && vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: path.resolve(__dirname, 'prerender.tsx'),
      additionalPrerenderRoutes: prerenderRoutes,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React and routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI and styling - split into common and rare components
          'ui-common': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'sonner'
          ],
          
          // Rarely used UI components
          'ui-rare': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch'
          ],
          
          // Data fetching and state
          'data-vendor': [
            '@tanstack/react-query',
            '@supabase/supabase-js',
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          
          // Maps and location (only loaded when needed)
          'map-vendor': [
            'leaflet',
            'react-leaflet'
          ],
          
          // NLP dependencies (only loaded when needed)
          'nlp-vendor': [
            'wink-nlp',
            'wink-eng-lite-web-model',
            'wink-distance',
            'wink-nlp-utils',
            'compromise'
          ],
          
          // Admin functionality (separate chunk)
          'admin-vendor': [
            'papaparse',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label'
          ],
          
          // Utilities
          'utils-vendor': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'cmdk',
            'react-helmet-async'
          ]
        }
      }
    },
    // Increase chunk size warning limit to 1000kb since we're splitting properly
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging in production
    sourcemap: mode === 'development',
    // CSS optimization
    cssMinify: true,
    // Minify output for smaller bundle sizes
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
    // Inline small assets as base64 to reduce HTTP requests
    assetsInlineLimit: 4096
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/__tests__/**',
        '**/test/**',
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
}});
