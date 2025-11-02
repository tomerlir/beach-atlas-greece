/**
 * Vite plugin to make CSS non-blocking for improved page load performance.
 * 
 * This plugin transforms the generated HTML to load stylesheets asynchronously,
 * preventing them from blocking the initial render. The technique is industry-standard
 * and recommended by Google PageSpeed Insights.
 * 
 * @see https://web.dev/defer-non-critical-css/
 */
import type { Plugin } from 'vite';

export function asyncCssPlugin(): Plugin {
  return {
    name: 'vite-plugin-async-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      // Transform CSS link tags to load asynchronously
      // Using the media="print" trick which is the most reliable cross-browser method
      
      // Match stylesheet links (with or without crossorigin attribute)
      // and transform them to load asynchronously
      html = html.replace(
        /<link rel="stylesheet"(?: crossorigin)? href="([^"]+\.css)">/g,
        (match, cssUrl) => {
          return `<link rel="stylesheet" href="${cssUrl}" media="print" onload="this.media='all';this.onload=null;">` +
                 `<noscript><link rel="stylesheet" href="${cssUrl}"></noscript>`;
        }
      );

      return html;
    },
  };
}

