#!/usr/bin/env tsx
/**
 * Normalize Creative Commons license URLs stored in photo attribution strings.
 *
 * Why: Ahrefs flagged 190 pages linking to CC URLs that 301-redirect. The bad
 * forms come straight from `beaches.photo_source` and `areas.hero_photo_source`
 * in Supabase. Fixing at the data source is correct — render-time normalization
 * would mask bad data forever.
 *
 * What it normalizes (inside the attribution string, leaving the rest intact):
 *   1. http://creativecommons.org/...  →  https://creativecommons.org/...
 *   2. .../licenses/{type}/{version}   →  .../licenses/{type}/{version}/
 *
 * Examples:
 *   "Author, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0>, via X"
 *      → "Author, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0/>, via X"
 *
 *   "Author, CC BY-SA 3.0 <http://creativecommons.org/licenses/by-sa/3.0/>, via X"
 *      → "Author, CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>, via X"
 *
 * Usage:
 *   npx tsx scripts/normalize-cc-urls.ts            # dry run — print proposed changes, no writes
 *   npx tsx scripts/normalize-cc-urls.ts --apply    # actually write to Supabase
 *
 * Requires SUPABASE_SECRET_KEY in .env for write access (RLS bypass).
 * Dry runs work with the publishable key alone.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Bootstrap .env
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

const APPLY = process.argv.includes("--apply");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
// Writes need the service-role key (bypasses RLS). For dry runs we can use the
// anon/publishable key, since SELECT is permitted by RLS.
const WRITE_KEY = process.env.SUPABASE_SECRET_KEY ?? "";
const READ_KEY =
  WRITE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !READ_KEY) {
  console.error("❌  Missing Supabase credentials in .env");
  process.exit(1);
}

if (APPLY && !WRITE_KEY) {
  console.error("❌  --apply requires SUPABASE_SECRET_KEY in .env (RLS bypass for writes)");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, APPLY ? WRITE_KEY : READ_KEY);

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

/**
 * Normalize CC license URLs embedded in a free-form attribution string.
 * Only touches substrings that look like a CC license URL — everything else is
 * left exactly as-is.
 */
export function normalizeCCUrls(input: string): string {
  let out = input;
  // 1. Upgrade http → https on the CC domain.
  out = out.replace(/http:\/\/creativecommons\.org/g, "https://creativecommons.org");
  // 2. Ensure trailing slash after `/licenses/{type}/{version}` when the next
  //    char isn't already a slash. Version must be full `N.N` (e.g. 1.0, 2.5,
  //    3.0, 4.0) — a partial `\d` match would corrupt `3.0/` into `3/.0/`.
  //    The negative lookahead `(?!\/)` prevents double slashes and skips URLs
  //    that already have a path suffix like `/deed.en`.
  out = out.replace(
    /(https:\/\/creativecommons\.org\/licenses\/[a-z-]+\/\d+\.\d+)(?!\/)/g,
    "$1/"
  );
  return out;
}

// ---------------------------------------------------------------------------
// Self-test — fail fast if the regex regresses
// ---------------------------------------------------------------------------
{
  const cases: Array<[string, string]> = [
    [
      "Author, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0>, via Wikimedia Commons",
      "Author, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0/>, via Wikimedia Commons",
    ],
    [
      "Author, CC BY-SA 3.0 <http://creativecommons.org/licenses/by-sa/3.0/>, via Wikimedia Commons",
      "Author, CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>, via Wikimedia Commons",
    ],
    [
      // Already-correct URL stays untouched.
      "Author, CC BY 4.0 <https://creativecommons.org/licenses/by/4.0/>, via Wikimedia Commons",
      "Author, CC BY 4.0 <https://creativecommons.org/licenses/by/4.0/>, via Wikimedia Commons",
    ],
    [
      // Locale-suffixed URL stays untouched.
      "Author, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0/deed.en>, via X",
      "Author, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0/deed.en>, via X",
    ],
    [
      // Non-CC URLs are not touched.
      "Photo by John via Unsplash",
      "Photo by John via Unsplash",
    ],
  ];
  for (const [input, expected] of cases) {
    const got = normalizeCCUrls(input);
    if (got !== expected) {
      console.error("❌  Self-test failed");
      console.error(`   input:    ${input}`);
      console.error(`   expected: ${expected}`);
      console.error(`   got:      ${got}`);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

interface Target {
  table: "beaches" | "areas";
  column: "photo_source" | "hero_photo_source";
  label: string; // for display
}

const TARGETS: Target[] = [
  { table: "beaches", column: "photo_source", label: "beach" },
  { table: "areas", column: "hero_photo_source", label: "area" },
];

interface Row {
  id: string;
  name: string;
  value: string;
}

async function fetchRows(target: Target): Promise<Row[]> {
  const { data, error } = await client
    .from(target.table)
    .select(`id, name, ${target.column}`)
    .ilike(target.column, "%creativecommons.org%");

  if (error) throw new Error(`Fetch failed (${target.table}): ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    value: (r as unknown as Record<string, string>)[target.column],
  }));
}

async function applyOne(target: Target, id: string, newValue: string): Promise<void> {
  const { error } = await client
    .from(target.table)
    .update({ [target.column]: newValue })
    .eq("id", id);
  if (error) throw new Error(`Update failed (${target.table}#${id}): ${error.message}`);
}

(async () => {
  console.warn(APPLY ? "🚀 APPLY mode — will write changes" : "🔍 DRY RUN — no writes");
  console.warn("");

  let totalChanged = 0;
  let totalUnchanged = 0;

  for (const target of TARGETS) {
    const rows = await fetchRows(target);
    console.warn(`── ${target.table}.${target.column} (${rows.length} candidates)`);

    let changed = 0;
    let unchanged = 0;
    for (const row of rows) {
      const next = normalizeCCUrls(row.value);
      if (next === row.value) {
        unchanged++;
        continue;
      }
      changed++;
      console.warn(`  ${target.label} ${row.name} (${row.id})`);
      console.warn(`    -  ${row.value}`);
      console.warn(`    +  ${next}`);
      if (APPLY) {
        try {
          await applyOne(target, row.id, next);
        } catch (err) {
          console.error(`    ❌  ${(err as Error).message}`);
          process.exitCode = 1;
        }
      }
    }
    console.warn(`  ${changed} would change, ${unchanged} already clean`);
    console.warn("");
    totalChanged += changed;
    totalUnchanged += unchanged;
  }

  console.warn("─".repeat(50));
  console.warn(
    APPLY
      ? `✅ Wrote ${totalChanged} rows. ${totalUnchanged} already clean.`
      : `📊 ${totalChanged} rows would change. ${totalUnchanged} already clean.`
  );
  if (!APPLY && totalChanged > 0) {
    console.warn("");
    console.warn("To apply: npx tsx scripts/normalize-cc-urls.ts --apply");
  }
})().catch((err) => {
  console.error("❌ ", err);
  process.exit(1);
});
