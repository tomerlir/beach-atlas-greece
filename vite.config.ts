import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
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
    sourcemap: mode === 'development'
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
}));
