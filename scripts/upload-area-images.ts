#!/usr/bin/env tsx
/**
 * Upload locally-downloaded area hero images to Supabase Storage
 * and update each area's hero_photo_url in the database.
 *
 * Prerequisite: run scripts/download-wikimedia-area-images.ts first.
 *
 * Usage:
 *   npx tsx scripts/upload-area-images.ts
 *
 * Requires in .env:
 *   SUPABASE_SECRET_KEY=...   ← Supabase Dashboard → Settings → API → sb_secret_*
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, extname, basename } from "path";

// ---------------------------------------------------------------------------
// Bootstrap .env
// ---------------------------------------------------------------------------
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    });
}

// ---------------------------------------------------------------------------
// Config / validation
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error("❌  Missing credentials. Add to .env:");
  if (!SUPABASE_URL) console.error("   VITE_SUPABASE_URL=...");
  if (!SECRET_KEY)
    console.error(
      "   SUPABASE_SECRET_KEY=...  (Supabase Dashboard → Settings → API → sb_secret_*)"
    );
  process.exit(1);
}

const BUCKET = "beach-photos";
const IMAGES_DIR = join(process.cwd(), "downloaded-images", "areas");
const DOWNLOAD_PROGRESS_FILE = join(process.cwd(), "downloaded-images", "areas-progress.json");
const UPLOAD_PROGRESS_FILE = join(process.cwd(), "downloaded-images", "areas-upload-progress.json");

const INTER_REQUEST_DELAY_MS = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DownloadEntry {
  status: "done" | "skipped" | "error";
  localPath?: string;
  timestamp: string;
}

interface DownloadProgress {
  entries: Record<string, DownloadEntry>;
}

interface UploadEntry {
  status: "done" | "error";
  storagePath?: string;
  publicUrl?: string;
  error?: string;
  timestamp: string;
}

interface UploadProgress {
  startedAt: string;
  lastUpdatedAt: string;
  total: number;
  uploaded: number;
  errors: number;
  entries: Record<string, UploadEntry>;
}

interface WorkItem {
  areaId: string;
  localPath: string;
  ext: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadUploadProgress(): UploadProgress {
  if (existsSync(UPLOAD_PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(UPLOAD_PROGRESS_FILE, "utf-8")) as UploadProgress;
    } catch {
      console.warn("⚠️  Could not parse areas-upload-progress.json — starting fresh");
    }
  }
  return {
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    total: 0,
    uploaded: 0,
    errors: 0,
    entries: {},
  };
}

function saveUploadProgress(log: UploadProgress) {
  log.lastUpdatedAt = new Date().toISOString();
  writeFileSync(UPLOAD_PROGRESS_FILE, JSON.stringify(log, null, 2), "utf-8");
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

function mimeFromExt(ext: string): string {
  return MIME[ext.toLowerCase()] ?? "image/jpeg";
}

function collectWorkItems(downloadProgress: DownloadProgress): WorkItem[] {
  const items: WorkItem[] = [];

  for (const [areaId, entry] of Object.entries(downloadProgress.entries)) {
    if (entry.status !== "done" || !entry.localPath) continue;
    if (!existsSync(entry.localPath)) {
      console.warn(`⚠️  File listed in progress not found on disk: ${entry.localPath}`);
      continue;
    }
    items.push({ areaId, localPath: entry.localPath, ext: extname(entry.localPath) || ".jpg" });
  }

  // Fallback: pick up any image files in the areas dir not tracked in progress
  if (existsSync(IMAGES_DIR)) {
    const tracked = new Set(items.map((i) => i.areaId));
    for (const filename of readdirSync(IMAGES_DIR)) {
      const ext = extname(filename);
      if (!Object.keys(MIME).includes(ext.toLowerCase())) continue;
      const areaId = basename(filename, ext);
      if (tracked.has(areaId)) continue;
      items.push({ areaId, localPath: join(IMAGES_DIR, filename), ext });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!existsSync(DOWNLOAD_PROGRESS_FILE)) {
    console.error("❌  No download progress file found at:\n   " + DOWNLOAD_PROGRESS_FILE);
    console.error("   Run scripts/download-wikimedia-area-images.ts first.");
    process.exit(1);
  }

  const downloadProgress: DownloadProgress = JSON.parse(
    readFileSync(DOWNLOAD_PROGRESS_FILE, "utf-8")
  );

  const work = collectWorkItems(downloadProgress);

  if (work.length === 0) {
    console.log("✅  No downloaded area images found to upload.");
    return;
  }

  console.log(`📋  Found ${work.length} area images ready to upload\n`);

  const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const uploadProgress = loadUploadProgress();
  uploadProgress.total = work.length;
  saveUploadProgress(uploadProgress);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < work.length; i++) {
    const { areaId, localPath, ext } = work[i];
    const label = `[${i + 1}/${work.length}] ${areaId}`;

    if (uploadProgress.entries[areaId]?.status === "done") {
      console.log(`⏭️   ${label} — already uploaded, skipping`);
      skipped++;
      continue;
    }

    const storagePath = `areas/${areaId}/photo${ext}`;
    const contentType = mimeFromExt(ext);

    console.log(`⬆️   ${label}`);
    console.log(`     local : ${localPath}`);
    console.log(`     dest  : ${BUCKET}/${storagePath}`);

    try {
      const fileBuffer = readFileSync(localPath);

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType, upsert: true });

      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      const { error: dbErr } = await supabase
        .from("areas")
        .update({ hero_photo_url: publicUrl })
        .eq("id", areaId);

      if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`);

      uploadProgress.entries[areaId] = {
        status: "done",
        storagePath,
        publicUrl,
        timestamp: new Date().toISOString(),
      };
      uploadProgress.uploaded++;
      saveUploadProgress(uploadProgress);

      console.log(`     ✅  hero_photo_url → ${publicUrl}`);
      uploaded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`     ❌  ${msg}`);
      uploadProgress.entries[areaId] = {
        status: "error",
        error: msg,
        timestamp: new Date().toISOString(),
      };
      uploadProgress.errors++;
      saveUploadProgress(uploadProgress);
      errors++;
    }

    if (i < work.length - 1) await sleep(INTER_REQUEST_DELAY_MS);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊  Upload complete");
  console.log(`   ✅  Uploaded : ${uploaded}`);
  console.log(`   ⏭️   Skipped  : ${skipped}`);
  console.log(`   ❌  Errors   : ${errors}`);
  console.log(`   📝  Progress : ${UPLOAD_PROGRESS_FILE}`);
  console.log("=".repeat(60));

  if (errors > 0) {
    console.log(`\n💡  Re-run to retry ${errors} failed item(s).`);
    console.log(`   (Remove their entries from areas-upload-progress.json to force retry)`);
  }
}

main().catch((err) => {
  console.error("❌  Fatal error:", err);
  process.exit(1);
});
