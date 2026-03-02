#!/usr/bin/env tsx
/**
 * Download Wikimedia/Wikipedia beach images to local disk.
 *
 * Usage:
 *   npx tsx scripts/download-wikimedia-images.ts
 *
 * What it does:
 *   1. Fetches all beaches whose photo_url contains "wikimedia" or "wikipedia"
 *   2. Downloads each image one at a time with a 3-5 s random delay between requests
 *   3. Retries after 30 s on 429 rate-limit responses
 *   4. Saves files to ./downloaded-images/beaches/{beach-id}.{ext}
 *   5. Persists a progress log to ./downloaded-images/progress.json so the run
 *      can be interrupted and resumed without re-downloading completed files
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync, mkdirSync, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { join, extname } from "path";
import https from "https";
import http from "http";
import { URL } from "url";

// ---------------------------------------------------------------------------
// Bootstrap .env (same approach as generate-routes.ts)
// ---------------------------------------------------------------------------
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing Supabase credentials in .env");
  process.exit(1);
}

const USER_AGENT = "BeachesOfGreece/1.0 (beachesofgreece.com; admin@beachesofgreece.com)";

const OUTPUT_DIR = join(process.cwd(), "downloaded-images", "beaches");
const PROGRESS_FILE = join(process.cwd(), "downloaded-images", "progress.json");

const DELAY_MIN_MS = 3_000;
const DELAY_MAX_MS = 5_000;
const RETRY_WAIT_MS = 30_000;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Beach {
  id: string;
  name: string;
  slug: string;
  photo_url: string;
}

type ProgressStatus = "done" | "skipped" | "error";

interface ProgressEntry {
  status: ProgressStatus;
  localPath?: string;
  error?: string;
  timestamp: string;
}

interface ProgressLog {
  startedAt: string;
  lastUpdatedAt: string;
  total: number;
  completed: number;
  entries: Record<string, ProgressEntry>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): number {
  return Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1)) + DELAY_MIN_MS;
}

function loadProgress(): ProgressLog {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8")) as ProgressLog;
    } catch {
      console.warn("⚠️  Could not parse progress.json — starting fresh");
    }
  }
  return {
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    total: 0,
    completed: 0,
    entries: {},
  };
}

function saveProgress(log: ProgressLog): void {
  log.lastUpdatedAt = new Date().toISOString();
  writeFileSync(PROGRESS_FILE, JSON.stringify(log, null, 2), "utf-8");
}

/** Resolve redirects and return the final URL string. */
async function resolveRedirects(urlString: string, depth = 0): Promise<string> {
  if (depth > 5) return urlString; // redirect loop guard
  return new Promise((resolve) => {
    const url = new URL(urlString);
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "HEAD",
        headers: { "User-Agent": USER_AGENT },
      },
      (res) => {
        req.destroy();
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : `${url.protocol}//${url.hostname}${res.headers.location}`;
          resolve(resolveRedirects(next, depth + 1));
        } else {
          resolve(urlString);
        }
      }
    );
    req.on("error", () => resolve(urlString));
    req.end();
  });
}

/**
 * Download a single URL to a local file path.
 * Returns the HTTP status code. Follows up to 5 redirects.
 */
async function downloadFile(urlString: string, destPath: string): Promise<number> {
  const finalUrl = await resolveRedirects(urlString);
  const url = new URL(finalUrl);

  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/jpeg,image/png,image/webp,image/*,*/*",
      },
    };

    const req = mod.request(options, (res) => {
      const status = res.statusCode ?? 0;

      if (status >= 200 && status < 300) {
        const out = createWriteStream(destPath);
        pipeline(res, out)
          .then(() => resolve(status))
          .catch(reject);
      } else {
        res.resume(); // drain
        resolve(status);
      }
    });

    req.on("error", reject);
    req.end();
  });
}

/** Extract a reasonable file extension from a URL. Falls back to .jpg */
function extensionFromUrl(urlString: string): string {
  try {
    const pathname = new URL(urlString).pathname;
    const ext = extname(pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext)) return ext;
  } catch {
    // ignore
  }
  return ".jpg";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch all beaches with Wikimedia/Wikipedia photo URLs
  console.log("🔍  Fetching beaches with Wikimedia photo URLs from Supabase…");
  const { data, error } = await supabase
    .from("beaches")
    .select("id, name, slug, photo_url")
    .eq("status", "ACTIVE")
    .or("photo_url.ilike.%wikimedia%,photo_url.ilike.%wikipedia%")
    .order("name");

  if (error) {
    console.error("❌  Supabase error:", error.message);
    process.exit(1);
  }

  const beaches = (data ?? []) as Beach[];
  console.log(`📋  Found ${beaches.length} beaches with Wikimedia images\n`);

  if (beaches.length === 0) {
    console.log("✅  Nothing to download.");
    return;
  }

  // Load or initialise progress log
  const progress = loadProgress();
  progress.total = beaches.length;
  saveProgress(progress);

  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < beaches.length; i++) {
    const beach = beaches[i];
    const label = `[${i + 1}/${beaches.length}] ${beach.name} (${beach.id})`;

    // Already processed in a previous run
    if (progress.entries[beach.id]?.status === "done") {
      console.log(`⏭️   ${label} — already downloaded, skipping`);
      skipped++;
      continue;
    }

    const ext = extensionFromUrl(beach.photo_url);
    const destPath = join(OUTPUT_DIR, `${beach.id}${ext}`);

    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      attempt++;
      try {
        console.log(`⬇️   ${label}`);
        console.log(`     URL: ${beach.photo_url}`);

        const status = await downloadFile(beach.photo_url, destPath);

        if (status >= 200 && status < 300) {
          progress.entries[beach.id] = {
            status: "done",
            localPath: destPath,
            timestamp: new Date().toISOString(),
          };
          progress.completed++;
          saveProgress(progress);
          console.log(`     ✅  Saved → ${destPath}`);
          downloaded++;
          success = true;
        } else if (status === 429) {
          console.log(
            `     ⏳  Rate limited (429). Waiting ${RETRY_WAIT_MS / 1000}s before retry…`
          );
          await sleep(RETRY_WAIT_MS);
        } else {
          console.warn(`     ⚠️   HTTP ${status} — skipping`);
          progress.entries[beach.id] = {
            status: "skipped",
            error: `HTTP ${status}`,
            timestamp: new Date().toISOString(),
          };
          saveProgress(progress);
          errors++;
          success = true; // don't retry non-429 errors
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`     ❌  Error on attempt ${attempt}: ${msg}`);
        if (attempt >= MAX_RETRIES) {
          progress.entries[beach.id] = {
            status: "error",
            error: msg,
            timestamp: new Date().toISOString(),
          };
          saveProgress(progress);
          errors++;
        } else {
          await sleep(RETRY_WAIT_MS);
        }
      }
    }

    // Polite delay before the next request (skip after last item)
    if (i < beaches.length - 1) {
      const delay = randomDelay();
      console.log(`     💤  Waiting ${(delay / 1000).toFixed(1)}s…\n`);
      await sleep(delay);
    }
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📊  Download complete");
  console.log(`   ✅  Downloaded : ${downloaded}`);
  console.log(`   ⏭️   Skipped    : ${skipped}`);
  console.log(`   ❌  Errors     : ${errors}`);
  console.log(`   📁  Output dir : ${OUTPUT_DIR}`);
  console.log(`   📝  Progress   : ${PROGRESS_FILE}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("❌  Fatal error:", err);
  process.exit(1);
});
