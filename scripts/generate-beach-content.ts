#!/usr/bin/env tsx

/**
 * Beach Content Generator — populates the `beach_content` table with
 * AI-generated narrative content (overview, amenities summary, FAQ set,
 * SEO keywords) per beach via DeepSeek (OpenAI-compatible API).
 *
 * Usage:
 *   tsx scripts/generate-beach-content.ts --slug balos-beach-crete --dry-run
 *   tsx scripts/generate-beach-content.ts --missing                  # only beaches without content
 *   tsx scripts/generate-beach-content.ts --all                      # all beaches (force)
 *   tsx scripts/generate-beach-content.ts --regenerate --slug X      # overwrite even if exists
 *   tsx scripts/generate-beach-content.ts --missing --limit 5        # process at most 5
 *
 * Required env (.env):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SECRET_KEY              # service-role for upserts
 *   DEEPSEEK_API_KEY
 * Optional env:
 *   DEEPSEEK_BASE_URL   default https://api.deepseek.com
 *   DEEPSEEK_MODEL      default deepseek-chat
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Environment loading (mirror other scripts in this repo)

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const PROMPT_VERSION = "v2";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials. Required in .env:");
  console.error("   VITE_SUPABASE_URL=...");
  console.error("   SUPABASE_SECRET_KEY=...");
  process.exit(1);
}
if (!DEEPSEEK_API_KEY) {
  console.error("❌ Missing DEEPSEEK_API_KEY. Add to .env:");
  console.error("   DEEPSEEK_API_KEY=...");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// CLI argument parsing

interface CliArgs {
  slug?: string;
  all: boolean;
  missing: boolean;
  regenerate: boolean;
  dryRun: boolean;
  limit?: number;
  concurrency: number;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {
    all: false,
    missing: false,
    regenerate: false,
    dryRun: false,
    concurrency: 1,
  };
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === "--all") args.all = true;
    else if (arg === "--missing") args.missing = true;
    else if (arg === "--regenerate") args.regenerate = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--slug" && process.argv[i + 1]) {
      args.slug = process.argv[++i];
    } else if (arg.startsWith("--slug=")) {
      args.slug = arg.slice("--slug=".length);
    } else if (arg === "--limit" && process.argv[i + 1]) {
      args.limit = parseInt(process.argv[++i], 10);
    } else if (arg.startsWith("--limit=")) {
      args.limit = parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--concurrency" && process.argv[i + 1]) {
      args.concurrency = Math.max(1, parseInt(process.argv[++i], 10));
    } else if (arg.startsWith("--concurrency=")) {
      args.concurrency = Math.max(1, parseInt(arg.slice("--concurrency=".length), 10));
    }
  }
  if (!args.slug && !args.all && !args.missing) {
    console.error("❌ Specify one of --slug=<slug>, --missing, or --all");
    process.exit(1);
  }
  return args;
}

// ---------------------------------------------------------------------------
// Data types

interface BeachRow {
  id: string;
  slug: string;
  name: string;
  area: string;
  type: string;
  wave_conditions: string;
  organized: boolean;
  blue_flag: boolean;
  parking: string;
  amenities: string[] | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface BeachFaq {
  question: string;
  answer: string;
  intent: string;
  target_keywords: string[];
}

interface GeneratedContent {
  overview: string;
  amenities_summary: string | null;
  faqs: BeachFaq[];
  keywords: string[];
}

const VALID_INTENTS = new Set([
  "family",
  "swimming",
  "parking",
  "access",
  "best-time",
  "blue-flag",
  "snorkeling",
  "surfing",
  "water-sports",
  "crowds",
  "photography",
  "distinctive-feature",
  "water-quality",
  "food-and-drink",
]);

// ---------------------------------------------------------------------------
// Prompt construction

const SYSTEM_PROMPT = `You generate concise, factual, distinctive narrative content for a Greek beach directory. You write like a knowledgeable local — specific, informed, avoiding generic tourism cliché.

HARD RULES:

1. STRICT GROUNDING — every fact you state must be derivable from the provided beach record (description, type, wave_conditions, organized, blue_flag, parking, amenities, area). When in doubt, omit. Specifically:
   - NEVER state any specific number, distance, walking time, hike duration, parking capacity, water depth, dimension, fee, count, or measurement that is not in the input. Use qualitative language instead ("a short walk", "rocky entry", "limited spaces") — never quantitative ("20-minute hike", "1 meter drop", "50 spots").
   - NEVER name a specific town, village, port, road, ferry route, transport service, restaurant, hotel, business, archaeological site, or geographic feature unless that name appears in the description or area field.
   - NEVER claim a beach is on the "north coast" / "south side" / "near X" / "X km from Y" unless that direction or location detail is in the description.
   - NEVER invent amenities, facilities, services, or activities. Only mention what's in the amenities array or directly stated in the description.

2. NO GENERIC DISCLAIMERS or seasonal filler — forbidden phrases include: "during peak season", "in high season", "in summer", "in the summer months", "supervise children", "supervise young children", "always check conditions", "as always", "during the hot months", "in the warmer months", "the midday sun can be harsh", "bring sun protection", "stay hydrated". The reader knows it gets hot in Greece. Cut all of it.

3. NO TEMPLATED PHRASINGS like "X is a {type} beach in {area}". Write specific, human prose drawn from concrete details in the description.

4. ANTI-DUPLICATION — never start "overview" with the same opening words or first sentence as the description. The overview must complement the description, not repeat it. If the description opens "X is a coastal lagoon on the Gramvousa Peninsula," your overview should NOT start with "X is", "Located on", or any phrasing that echoes that lead.

5. OUTPUT FORMAT — return valid JSON only. No prose around it. No markdown code fences. No commentary.

VOICE: confident, specific, observational. Short sentences are fine. No purple prose. No exclamation marks. No marketing language ("breathtaking", "stunning", "paradise", "must-see", "iconic" unless that word appears in the description).

If the input description is short or non-specific, your generated content should also be modest in scope — say less, but say it accurately. Better a one-sentence overview that's true than a paragraph of plausible invention.`;

function buildUserPrompt(beach: BeachRow): string {
  const beachInput = {
    name: beach.name,
    area: beach.area,
    type: beach.type,
    wave_conditions: beach.wave_conditions,
    organized: beach.organized,
    blue_flag: beach.blue_flag,
    parking: beach.parking,
    amenities: beach.amenities || [],
    latitude: beach.latitude,
    longitude: beach.longitude,
    description: beach.description || "",
  };

  return `Generate JSON content for this beach.

BEACH:
${JSON.stringify(beachInput, null, 2)}

REQUIREMENTS:

1. "overview" (string, 80-280 chars): Two short sentences. The first names WHAT a visitor experiences when they arrive — a sensory detail, an unusual feature, a setting cue drawn from the description. The second adds one practical fact useful for planning (parking, organization, wave conditions, Blue Flag, etc.). Do NOT repeat or paraphrase the opening sentence of the description. Goal: someone who's never heard of this beach decides whether to visit after reading this.

2. "amenities_summary" (string, 80-400 chars, OR null if amenities array is empty): A short narrative paragraph describing what facilities feel like in practice at THIS beach. Not a list — narrative. Use only amenities listed. Example shape: "There's a small taverna and a row of sunbeds along the central stretch. Showers and toilets sit near the parking lot." If amenities = [], return null.

3. "faqs" (array of 5-7 objects): Each FAQ is {question, answer, intent, target_keywords}.
   - Pick 5-7 intents from this menu most relevant to THIS beach: family, swimming, parking, access, best-time, blue-flag, snorkeling, surfing, water-sports, crowds, photography, distinctive-feature, water-quality, food-and-drink.
   - Skip intents that don't apply (no surfing for calm-water beach; no blue-flag question unless beach.blue_flag is true; no food-and-drink if no taverna/beach_bar).
   - "question": phrased the way a real user would ask Google or ChatGPT, e.g. "Is Balos beach family-friendly?", "Can you swim at Sarakiniko?", "Where can I park near Red Beach?". Include the beach name. End with "?".
   - "answer": 2-4 sentences, 100-400 chars. Specific to THIS beach using its data and description. Cite exact parking type, specific amenities by name, Blue Flag status, description-grounded details. Never generic.
   - "intent": one of the menu strings above.
   - "target_keywords": 2-4 long-tail keywords this Q&A targets, lowercase, e.g. ["balos beach parking", "how to get to balos crete"].

4. "keywords" (array of 5-10 strings, lowercase): Long-tail SEO/AEO keywords this beach page should rank for. Each keyword is a search query phrase the page should answer.

Return ONLY JSON. No prose. No markdown.`;
}

// ---------------------------------------------------------------------------
// DeepSeek API call

// Reasoning models (like deepseek-v4-pro / deepseek-reasoner) spend most of
// their completion tokens on internal chain-of-thought before producing the
// visible "content". The total token budget must cover both. 8000 is
// comfortable for a typical beach.
const MAX_TOKENS = 8000;
const REQUEST_TIMEOUT_MS = 600_000;

/**
 * Streaming SSE call to the DeepSeek chat completions endpoint.
 *
 * Why streaming: non-streaming calls to reasoning models keep the connection
 * silent for 30-120s while the model thinks, and DeepSeek's load balancer
 * frequently closes idle connections mid-flight ("UND_ERR_SOCKET other side
 * closed"). Streaming sends a heartbeat of partial tokens so intermediaries
 * don't terminate, which makes long-reasoning calls reliable.
 *
 * We accumulate `delta.content` chunks and parse the joined string as JSON
 * (the underlying request still uses response_format: json_object so the
 * concatenated stream forms a valid JSON document).
 */
async function callDeepSeek(beach: BeachRow, retryHint?: string): Promise<unknown> {
  const userPrompt = retryHint
    ? `${buildUserPrompt(beach)}\n\nIMPORTANT RETRY NOTE: ${retryHint}`
    : buildUserPrompt(beach);

  const body = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: MAX_TOKENS,
    stream: true,
  };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API ${response.status}: ${errText.slice(0, 500)}`);
    }
    if (!response.body) {
      throw new Error("DeepSeek response has no body to stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let finishReason: string | null = null;
    let usage: unknown = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by \n\n; lines start with `data: `.
      let nlIdx;
      while ((nlIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nlIdx).trim();
        buffer = buffer.slice(nlIdx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        let chunk: {
          choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
          usage?: unknown;
        };
        try {
          chunk = JSON.parse(payload);
        } catch {
          continue; // skip malformed/heartbeat lines
        }
        const delta = chunk.choices?.[0]?.delta?.content;
        if (typeof delta === "string") content += delta;
        const fr = chunk.choices?.[0]?.finish_reason;
        if (fr) finishReason = fr;
        if (chunk.usage) usage = chunk.usage;
      }
    }

    if (!content) {
      throw new Error(
        `DeepSeek stream produced empty content (finish_reason=${finishReason}, usage=${JSON.stringify(usage || {})})`
      );
    }
    if (finishReason === "length") {
      throw new Error(
        `DeepSeek hit max_tokens (finish_reason=length, usage=${JSON.stringify(usage || {})}). Increase MAX_TOKENS.`
      );
    }
    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`DeepSeek streamed content was not valid JSON: ${content.slice(0, 300)}`);
    }
  } catch (e) {
    const err = e as Error & { cause?: { message?: string; code?: string } };
    if (err.message?.startsWith("DeepSeek ")) throw err;
    const cause =
      err.cause && (err.cause.code || err.cause.message)
        ? ` (cause: ${err.cause.code || ""} ${err.cause.message || ""})`
        : "";
    throw new Error(`DeepSeek request failed: ${err.name}: ${err.message}${cause}`);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

// ---------------------------------------------------------------------------
// Validation — enforce hard constraints on generated content

class ValidationError extends Error {}

/**
 * Geographic, temporal, and common-word tokens that may appear in capitalized
 * form in generated content without being considered "invented entities".
 * These rarely vary per beach and are well-known background context.
 */
const ALWAYS_ALLOWED_WORDS = new Set<string>([
  // Country / regions
  "greece",
  "greek",
  "aegean",
  "ionian",
  "mediterranean",
  "cyclades",
  "dodecanese",
  "sporades",
  "europe",
  "european",
  // Compass / generic geographic
  "north",
  "south",
  "east",
  "west",
  "northern",
  "southern",
  "eastern",
  "western",
  "coast",
  "bay",
  "island",
  "sea",
  "cape",
  "peninsula",
  "beach",
  // Calendar
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "spring",
  "autumn",
  "winter",
  // Common labels
  "yes",
  "no",
  "wifi",
  "atm",
  "dj",
  "bbq",
  "euro",
  "euros",
  // Certification / standards mentioned in our schema
  "blue",
  "flag",
]);

/**
 * Build the allowed-token set from beach inputs. Every lowercased word from
 * the beach name, area, and description is considered grounded.
 */
function buildAllowedWords(beach: BeachRow): Set<string> {
  const allowed = new Set<string>(ALWAYS_ALLOWED_WORDS);
  const sources = [beach.name, beach.area, beach.description || ""].join(" ");
  const words = sources.toLowerCase().match(/[a-z]+/g) || [];
  for (const w of words) allowed.add(w);
  return allowed;
}

/**
 * Find multi-word capitalized phrases in generated content whose constituent
 * words are not all grounded in the input. These are the highest-risk
 * fabricated-entity patterns: invented business names ("Camp Porto Elea"),
 * non-grounded landmarks ("Mount Athos"), invented archaeological sites.
 *
 * We deliberately ignore single-word capitalized tokens since they have a
 * high false-positive rate from sentence-initial capitals. The retry hint
 * for offending multi-word phrases is usually enough to nudge the model
 * away from inventing related single-word names too.
 */
/**
 * Common English sentence-initial words. When the regex starts a phrase
 * with one of these (e.g. "This Blue Flag", "Since Voutakos"), strip it
 * before checking — otherwise we'd flag valid grounded phrases just because
 * the answer happened to begin a sentence with "This" or "Since".
 */
const SENTENCE_STARTER_WORDS = new Set<string>([
  "this",
  "that",
  "these",
  "those",
  "the",
  "a",
  "an",
  "since",
  "when",
  "while",
  "although",
  "however",
  "here",
  "there",
  "during",
  "before",
  "after",
  "indeed",
  "yes",
  "no",
  "well",
  "absolutely",
  "definitely",
]);

/**
 * Syntactic connectors that join proper nouns but aren't themselves
 * entities to validate. "Alykanas or Alykes" should be evaluated as the
 * two proper-noun ends only.
 */
const CONNECTOR_WORDS = new Set<string>([
  "of",
  "and",
  "or",
  "the",
  "in",
  "on",
  "at",
  "de",
  "da",
  "du",
  "della",
  "von",
  "van",
  "le",
  "la",
]);

function findInventedEntities(text: string, allowed: Set<string>): string[] {
  const invented = new Set<string>();
  const regex =
    /\b[A-Z][a-zA-Z]+(?:\s+(?:of|and|the|or|de|da|du|della|von|van|le|la)\s+[A-Z][a-zA-Z]+|\s+[A-Z][a-zA-Z]+)+\b/g;
  for (const m of text.matchAll(regex)) {
    const phrase = m[0];
    let words = phrase.toLowerCase().split(/\s+/);
    // Strip leading sentence-starter if present, then any leading connectors.
    while (words.length > 0 && SENTENCE_STARTER_WORDS.has(words[0])) {
      words = words.slice(1);
    }
    // Evaluate only content words (skip syntactic connectors).
    const contentWords = words.filter((w) => !CONNECTOR_WORDS.has(w));
    if (contentWords.length === 0) continue;
    if (contentWords.every((w) => allowed.has(w))) continue;
    invented.add(phrase);
  }
  return [...invented];
}

/** Phrases the prompt forbids — soft constraint promoted to hard validation. */
const FORBIDDEN_PHRASES = [
  "peak season",
  "high season",
  "in summer",
  "in the summer",
  "summer months",
  "supervise",
  "always check",
  "as always",
  "midday sun",
  "hot months",
  "stay hydrated",
  "bring sun protection",
];

function checkForbiddenPhrases(text: string): string | null {
  const lower = text.toLowerCase();
  for (const p of FORBIDDEN_PHRASES) {
    if (lower.includes(p)) return p;
  }
  return null;
}

function validate(content: unknown, beach: BeachRow): GeneratedContent {
  if (typeof content !== "object" || content === null) {
    throw new ValidationError("response is not an object");
  }
  const c = content as Record<string, unknown>;
  const allowedWords = buildAllowedWords(beach);

  // overview
  if (typeof c.overview !== "string" || c.overview.trim().length < 80) {
    throw new ValidationError(
      `overview missing or too short (${typeof c.overview === "string" ? c.overview.length : "n/a"} chars)`
    );
  }
  if (c.overview.length > 320) {
    throw new ValidationError(`overview too long (${c.overview.length} chars, max 320)`);
  }
  // overview must not echo the first sentence of description
  if (beach.description) {
    const descFirst = (beach.description.match(/^[^.!?]+[.!?]/) || [""])[0].trim();
    if (descFirst && c.overview.trim().startsWith(descFirst.slice(0, 30))) {
      throw new ValidationError("overview opens with the same words as description");
    }
  }
  const overviewBad = checkForbiddenPhrases(c.overview);
  if (overviewBad) {
    throw new ValidationError(`overview contains forbidden phrase: "${overviewBad}"`);
  }
  const overviewInvented = findInventedEntities(c.overview, allowedWords);
  if (overviewInvented.length > 0) {
    throw new ValidationError(
      `overview invents entities not in the beach data: ${overviewInvented.map((e) => `"${e}"`).join(", ")}`
    );
  }

  // amenities_summary
  if (c.amenities_summary !== null && typeof c.amenities_summary !== "string") {
    throw new ValidationError("amenities_summary must be string or null");
  }
  if (typeof c.amenities_summary === "string") {
    if (c.amenities_summary.length < 60) {
      throw new ValidationError("amenities_summary too short");
    }
    if (c.amenities_summary.length > 500) {
      throw new ValidationError("amenities_summary too long");
    }
    const asBad = checkForbiddenPhrases(c.amenities_summary);
    if (asBad) {
      throw new ValidationError(`amenities_summary contains forbidden phrase: "${asBad}"`);
    }
    const asInvented = findInventedEntities(c.amenities_summary, allowedWords);
    if (asInvented.length > 0) {
      throw new ValidationError(
        `amenities_summary invents entities not in the beach data: ${asInvented.map((e) => `"${e}"`).join(", ")}`
      );
    }
  }
  if ((beach.amenities || []).length === 0 && c.amenities_summary !== null) {
    throw new ValidationError("amenities_summary must be null when amenities array is empty");
  }

  // faqs
  if (!Array.isArray(c.faqs) || c.faqs.length < 5 || c.faqs.length > 7) {
    throw new ValidationError(
      `faqs must be array of 5-7 items, got ${Array.isArray(c.faqs) ? c.faqs.length : "n/a"}`
    );
  }
  const intents = new Set<string>();
  const faqs: BeachFaq[] = [];
  for (const [i, f] of (c.faqs as unknown[]).entries()) {
    if (typeof f !== "object" || f === null) {
      throw new ValidationError(`faqs[${i}] not an object`);
    }
    const fobj = f as Record<string, unknown>;
    if (typeof fobj.question !== "string" || !fobj.question.endsWith("?")) {
      throw new ValidationError(`faqs[${i}].question missing or not a question`);
    }
    if (typeof fobj.answer !== "string" || fobj.answer.length < 80 || fobj.answer.length > 500) {
      throw new ValidationError(
        `faqs[${i}].answer wrong length (${typeof fobj.answer === "string" ? fobj.answer.length : "n/a"}, want 80-500)`
      );
    }
    if (typeof fobj.intent !== "string" || !VALID_INTENTS.has(fobj.intent)) {
      throw new ValidationError(`faqs[${i}].intent invalid: ${fobj.intent}`);
    }
    if (intents.has(fobj.intent)) {
      throw new ValidationError(`faqs[${i}].intent duplicate: ${fobj.intent}`);
    }
    intents.add(fobj.intent);
    if (!Array.isArray(fobj.target_keywords) || fobj.target_keywords.length < 2) {
      throw new ValidationError(`faqs[${i}].target_keywords must be array of >=2`);
    }
    if (!fobj.question.toLowerCase().includes(beach.name.toLowerCase().split(" ")[0])) {
      throw new ValidationError(`faqs[${i}].question must mention beach name`);
    }
    const faqBad = checkForbiddenPhrases(fobj.answer);
    if (faqBad) {
      throw new ValidationError(`faqs[${i}].answer contains forbidden phrase: "${faqBad}"`);
    }
    const faqInvented = findInventedEntities(fobj.answer, allowedWords);
    if (faqInvented.length > 0) {
      throw new ValidationError(
        `faqs[${i}].answer invents entities not in the beach data: ${faqInvented.map((e) => `"${e}"`).join(", ")}`
      );
    }
    // intent-specific guards
    if (fobj.intent === "blue-flag" && !beach.blue_flag) {
      throw new ValidationError("blue-flag intent emitted for non-Blue-Flag beach");
    }
    if (
      fobj.intent === "surfing" &&
      beach.wave_conditions !== "SURFABLE" &&
      beach.wave_conditions !== "WAVY"
    ) {
      throw new ValidationError("surfing intent emitted for non-surfable beach");
    }
    faqs.push({
      question: fobj.question,
      answer: fobj.answer,
      intent: fobj.intent,
      target_keywords: fobj.target_keywords as string[],
    });
  }

  // keywords
  if (!Array.isArray(c.keywords) || c.keywords.length < 5 || c.keywords.length > 12) {
    throw new ValidationError(
      `keywords must be array of 5-12 items, got ${Array.isArray(c.keywords) ? c.keywords.length : "n/a"}`
    );
  }
  for (const [i, k] of (c.keywords as unknown[]).entries()) {
    if (typeof k !== "string" || k.length < 4) {
      throw new ValidationError(`keywords[${i}] invalid`);
    }
  }

  return {
    overview: c.overview.trim(),
    amenities_summary: typeof c.amenities_summary === "string" ? c.amenities_summary.trim() : null,
    faqs,
    keywords: c.keywords as string[],
  };
}

// ---------------------------------------------------------------------------
// Uniqueness check — compare overview against existing rows

interface ExistingContent {
  beach_id: string;
  overview: string;
}

function trigramSet(s: string): Set<string> {
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const trigrams = new Set<string>();
  for (let i = 0; i <= cleaned.length - 3; i++) {
    trigrams.add(cleaned.slice(i, i + 3));
  }
  return trigrams;
}

function trigramOverlap(a: string, b: string): number {
  const setA = trigramSet(a);
  const setB = trigramSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersect = 0;
  for (const t of setA) if (setB.has(t)) intersect++;
  return intersect / Math.min(setA.size, setB.size);
}

async function findSimilarOverview(
  candidate: string,
  beachId: string,
  threshold: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from("beach_content")
    .select("beach_id, overview")
    .neq("beach_id", beachId);
  if (error) throw error;
  for (const row of (data || []) as ExistingContent[]) {
    if (trigramOverlap(candidate, row.overview) >= threshold) {
      return row.beach_id;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Generation pipeline (one beach)

/**
 * Build a retry hint tailored to the validation error class. Generic
 * "fix the issue" hints aren't strong enough — the model keeps regenerating
 * with the same forbidden phrasings. We need to spell out concretely what's
 * banned.
 */
function buildRetryHint(error: string, attemptNumber: number): string {
  const severity = attemptNumber >= 3 ? "FINAL WARNING" : "CRITICAL";
  if (error.includes("forbidden phrase")) {
    const base = `${severity}: your last output was rejected because it ${error}. You MUST NOT use ANY of these phrases or their variants under any circumstances: "peak season", "high season", "in summer", "in the summer", "summer months", "supervise", "always check", "as always", "midday sun", "hot months", "stay hydrated", "bring sun protection". Reword every sentence that touched on timing, crowds, or safety using purely qualitative language. Talk about light ("morning", "late afternoon"), crowd density ("quieter", "busier"), or specific weather conditions ("calm days", "windy days") — never seasons or generic safety advice.`;
    if (attemptNumber >= 3) {
      return `${base} If you cannot reword the offending sentence, DELETE IT ENTIRELY. It is better to have a shorter FAQ answer than to repeat any banned phrase.`;
    }
    return base;
  }
  if (error.includes("invalid:")) {
    return `${severity}: you used an intent value that is not in the allowed menu. The ONLY valid intents are: family, swimming, parking, access, best-time, blue-flag, snorkeling, surfing, water-sports, crowds, photography, distinctive-feature, water-quality, food-and-drink. Pick from this exact list, character-for-character.`;
  }
  if (error.includes("surfing intent emitted for non-surfable beach")) {
    return `${severity}: this beach does NOT have surfable waves. DO NOT pick the "surfing" intent. Replace it with one of: best-time, crowds, photography, distinctive-feature, water-quality, food-and-drink, water-sports.`;
  }
  if (error.includes("blue-flag intent emitted for non-Blue-Flag beach")) {
    return `${severity}: this beach is NOT Blue Flag certified. DO NOT pick the "blue-flag" intent. Replace it with another from the menu.`;
  }
  if (error.includes("invents entities")) {
    return `${severity}: your last output mentioned a place/business name that is NOT in the beach data. ${error}. You must remove that mention entirely OR replace it with a generic description. Never use any place name, business name, or geographic landmark that doesn't appear in the input description.`;
  }
  if (error.includes("too similar")) {
    return `${severity}: your overview overlaps too much with another beach's overview. Make it MORE specific to this exact beach's unique features — start with a concrete sensory detail or unusual feature from THIS beach's description.`;
  }
  return `Your last attempt failed validation: ${error}. Fix that issue and regenerate.`;
}

async function generateForBeach(beach: BeachRow): Promise<GeneratedContent> {
  const maxAttempts = 5;
  let retryHint: string | undefined;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await callDeepSeek(beach, retryHint);
      const content = validate(raw, beach);

      const similarBeachId = await findSimilarOverview(content.overview, beach.id, 0.7);
      if (similarBeachId) {
        retryHint = buildRetryHint(`overview too similar to beach ${similarBeachId}`, attempt);
        lastError = new Error(`overview too similar to beach ${similarBeachId}`);
        continue;
      }

      return content;
    } catch (e) {
      lastError = e as Error;
      retryHint = buildRetryHint((e as Error).message, attempt);
      console.warn(
        `  ⚠️  Attempt ${attempt}/${maxAttempts} for ${beach.slug}: ${(e as Error).message}`
      );
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

async function upsertContent(beachId: string, content: GeneratedContent): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("beach_content").upsert(
    {
      beach_id: beachId,
      overview: content.overview,
      amenities_summary: content.amenities_summary,
      faqs: content.faqs,
      keywords: content.keywords,
      generated_at: now,
      generator: DEEPSEEK_MODEL,
      prompt_version: PROMPT_VERSION,
      updated_at: now,
    },
    { onConflict: "beach_id" }
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Beach selection

async function selectBeaches(args: CliArgs): Promise<BeachRow[]> {
  const baseSelect =
    "id, slug, name, area, type, wave_conditions, organized, blue_flag, parking, amenities, description, latitude, longitude";

  if (args.slug) {
    const { data, error } = await supabase
      .from("beaches")
      .select(baseSelect)
      .eq("slug", args.slug)
      .eq("status", "ACTIVE")
      .single();
    if (error) throw error;
    return [data as BeachRow];
  }

  const { data: beaches, error } = await supabase
    .from("beaches")
    .select(baseSelect)
    .eq("status", "ACTIVE")
    .order("name");
  if (error) throw error;

  let result = (beaches || []) as BeachRow[];

  if (args.missing) {
    const { data: existing } = await supabase.from("beach_content").select("beach_id");
    const existingIds = new Set((existing || []).map((r: { beach_id: string }) => r.beach_id));
    result = result.filter((b) => !existingIds.has(b.id));
  } else if (args.all && !args.regenerate) {
    // --all without --regenerate also skips existing rows.
    const { data: existing } = await supabase.from("beach_content").select("beach_id");
    const existingIds = new Set((existing || []).map((r: { beach_id: string }) => r.beach_id));
    result = result.filter((b) => !existingIds.has(b.id));
  }

  if (typeof args.limit === "number" && args.limit > 0) {
    result = result.slice(0, args.limit);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main

/**
 * Worker pool — N concurrent workers each pull beaches from a shared queue
 * and process them sequentially. Bounded concurrency avoids rate limits
 * while still parallelizing the wall-clock cost of the streaming calls.
 */
async function runWorkerPool(
  beaches: BeachRow[],
  concurrency: number,
  processor: (beach: BeachRow, index: number, total: number) => Promise<boolean>
): Promise<{ ok: number; fail: number }> {
  let nextIndex = 0;
  const total = beaches.length;
  let ok = 0;
  let fail = 0;

  const workers = Array.from({ length: Math.min(concurrency, total) }, async (_, workerId) => {
    while (true) {
      const i = nextIndex++;
      if (i >= total) break;
      const success = await processor(beaches[i], i, total);
      if (success) ok++;
      else fail++;
      // Optional small jitter between workers to avoid thundering-herd at the API.
      if (workerId > 0) await new Promise((r) => setTimeout(r, 50));
    }
  });
  await Promise.all(workers);
  return { ok, fail };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const beaches = await selectBeaches(args);

  console.warn(
    `🌊 Generator: model=${DEEPSEEK_MODEL} prompt_version=${PROMPT_VERSION} dry_run=${args.dryRun} concurrency=${args.concurrency}`
  );
  console.warn(`📋 Beaches to process: ${beaches.length}`);
  if (beaches.length === 0) {
    console.warn("Nothing to do.");
    return;
  }

  const start = Date.now();

  const processor = async (beach: BeachRow, i: number, total: number): Promise<boolean> => {
    const tag = `[${i + 1}/${total}]`;
    console.warn(`${tag} ▶ ${beach.slug} (${beach.name}, ${beach.area})`);
    try {
      const content = await generateForBeach(beach);
      if (args.dryRun) {
        console.warn(`${tag} --- OVERVIEW ---`);
        console.warn(content.overview);
        console.warn(`${tag} --- AMENITIES_SUMMARY ---`);
        console.warn(content.amenities_summary || "(null)");
        console.warn(`${tag} --- FAQs (${content.faqs.length}) ---`);
        for (const f of content.faqs) {
          console.warn(`  Q [${f.intent}]: ${f.question}`);
          console.warn(`  A: ${f.answer}`);
          console.warn("");
        }
        console.warn(`${tag} --- KEYWORDS: ${content.keywords.join(", ")}`);
      } else {
        await upsertContent(beach.id, content);
        console.warn(`${tag} ✅ ${beach.slug} upserted`);
      }
      return true;
    } catch (e) {
      console.error(`${tag} ❌ ${beach.slug} failed: ${(e as Error).message}`);
      return false;
    }
  };

  const { ok, fail } = await runWorkerPool(beaches, args.concurrency, processor);

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.warn(
    `\nDone. ok=${ok} fail=${fail} elapsed=${elapsed}s (${(elapsed / Math.max(beaches.length, 1)).toFixed(1)}s/beach)`
  );
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
