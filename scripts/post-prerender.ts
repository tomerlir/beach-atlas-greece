#!/usr/bin/env tsx

/**
 * Post-prerender fixups.
 *
 * vite-prerender-plugin emits each route as `<route>/index.html`, e.g. `/404`
 * becomes `dist/404/index.html`. nginx's `error_page 404 /404.html;` directive
 * does an internal sub-request for the literal path `/404.html`, so we copy
 * the prerendered NotFound shell to `dist/404.html` so nginx can find it.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const src = join(dist, "404", "index.html");
const dest = join(dist, "404.html");

if (existsSync(src)) {
  copyFileSync(src, dest);
  console.log(`✓ Copied dist/404/index.html → dist/404.html (for nginx error_page)`);
} else {
  console.warn(`⚠ dist/404/index.html not found; skipping 404.html copy`);
}
