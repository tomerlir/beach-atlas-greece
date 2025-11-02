/**
 * Vite plugin for performance optimizations including:
 * - Ensuring modulepreload is present for critical chunks
 * - Adding resource hints
 * - Optimizing script loading order
 */
import type { Plugin } from 'vite';

export function performancePlugin(): Plugin {
  return {
    name: 'vite-plugin-performance',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      // Ensure all modulepreload links have fetchpriority for critical chunks
      html = html.replace(
        /<link rel="modulepreload" crossorigin href="([^"]*(?:react-vendor|index)[^"]*)\.js">/g,
        '<link rel="modulepreload" crossorigin href="$1.js" fetchpriority="high">'
      );

      // Add fetchpriority="low" to non-critical vendor chunks to prioritize main bundle
      html = html.replace(
        /<link rel="modulepreload" crossorigin href="([^"]*(?:admin-vendor|nlp-vendor|map-vendor)[^"]*)\.js">/g,
        '<link rel="modulepreload" crossorigin href="$1.js" fetchpriority="low">'
      );

      return html;
    },
  };
}

