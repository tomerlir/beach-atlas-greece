/**
 * Beach content generators — narrative paragraphs and FAQ Q&A pairs derived
 * from the structured beach record AND its unique description text.
 *
 * Anti-duplication design:
 *   1. The single uniquely-authored field per beach is `beach.description`.
 *      We mine its first sentence as the primary uniqueness anchor for the
 *      overview paragraph and the "What kind of beach" answer.
 *   2. Boilerplate disclaimers ("during July and August", "supervise young
 *      children", "as always") are stripped entirely. Each answer is one
 *      tight fact, not fact + generic safety filler.
 *   3. Where multiple phrasings can express the same structured fact, we
 *      pick deterministically by slug hash so beaches with identical
 *      structured profiles still produce different prose.
 *   4. Questions are emitted conditionally — we skip questions whose answer
 *      would be pure boilerplate (e.g. "Is X Blue Flag certified?" when the
 *      answer is no), so beaches get FAQ sets of varying size and content.
 *
 * These functions drive both the visible page content (Q-style H2 sections
 * and the FAQ accordion) and the FAQPage JSON-LD. Same source ensures schema
 * and rendered text never diverge.
 */

import { Tables } from "@/integrations/supabase/types";

type Beach = Tables<"beaches">;

export interface BeachQA {
  question: string;
  answer: string;
}

const amenityLabels: Record<string, string> = {
  lifeguard: "a lifeguard",
  beach_bar: "a beach bar",
  taverna: "a taverna",
  sunbeds: "sunbeds",
  umbrellas: "umbrellas",
  water_sports: "water sports",
  snorkeling: "snorkeling",
  family_friendly: "family-friendly amenities",
  showers: "showers",
  toilets: "toilets",
  parking: "parking",
  wheelchair_access: "wheelchair access",
};

const typeWord: Record<string, string> = {
  SANDY: "sandy",
  PEBBLY: "pebble",
  MIXED: "mixed sand and pebble",
  OTHER: "",
};

// ---------------------------------------------------------------------------
// Helpers

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Stable string-hash bucket selector. Same slug always picks the same
 * option — so individual beach pages are deterministic and re-render
 * identically, but neighbours with the same structured profile get
 * different phrasings.
 */
function pickByHash<T>(slug: string | null | undefined, options: T[]): T {
  if (options.length === 0) {
    throw new Error("pickByHash called with empty options");
  }
  const input = slug || "";
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return options[Math.abs(hash) % options.length];
}

/**
 * Extract the first sentence of the description as a uniqueness anchor.
 * Returns null if the description is missing or too short to be useful.
 */
function firstSentence(description: string | null | undefined): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (trimmed.length < 30) return null;
  const match = trimmed.match(/^[^.!?]+[.!?](?=\s|$)/);
  if (match) return match[0].trim();
  // No sentence terminator within the description — take a reasonable prefix.
  if (trimmed.length <= 220) return trimmed;
  return trimmed.slice(0, 220).replace(/\s+\S*$/, "") + "…";
}

function formatAmenityList(amenities: string[] | null | undefined): string {
  if (!amenities || amenities.length === 0) return "";
  const labeled = amenities
    .map((a) => amenityLabels[a])
    .filter((label): label is string => Boolean(label));
  return joinWithAnd(labeled);
}

function hasFamilySignal(beach: Beach): { signals: string[]; isPositive: boolean } {
  const amenities = beach.amenities || [];
  const signals: string[] = [];
  if (beach.wave_conditions === "CALM") signals.push("calm shallow waters");
  if (amenities.includes("lifeguard")) signals.push("a lifeguard on duty");
  if (amenities.includes("family_friendly")) signals.push("family-friendly amenities");
  if (amenities.includes("toilets")) signals.push("toilet facilities");
  if (amenities.includes("showers")) signals.push("showers");
  // Only emit a family-friendly Q&A when we can say something positive —
  // negative answers are pure filler.
  return { signals, isPositive: signals.length >= 2 };
}

// ---------------------------------------------------------------------------
// Public: narrative overview paragraph (used under "What to expect at X")

/**
 * Overview paragraph. Prefers the description's first sentence as the
 * uniqueness anchor; falls back to a tight structured-data sentence only
 * when no description exists.
 */
export function generateBeachOverview(beach: Beach): string {
  const lead = firstSentence(beach.description);
  if (lead) {
    // Add at most one tight structured fact that the description likely
    // doesn't already state — picked from {wave conditions, organized status,
    // Blue Flag} via slug-hash so identical profiles get different appends.
    const candidates: string[] = [];
    if (beach.wave_conditions === "CALM") {
      candidates.push(`Wave conditions are calm.`);
    } else if (beach.wave_conditions === "SURFABLE") {
      candidates.push(`The waves are consistent and surfable.`);
    } else if (beach.wave_conditions === "WAVY") {
      candidates.push(`Wave conditions can be strong.`);
    }
    if (beach.organized) {
      candidates.push(`It is an organized beach with rentable facilities in season.`);
    }
    if (beach.blue_flag) {
      candidates.push(`It currently holds Blue Flag certification.`);
    }
    if (candidates.length === 0) {
      return lead;
    }
    const pick = pickByHash(beach.slug, candidates);
    return `${lead} ${pick}`;
  }

  // Fallback path — no description available.
  const t = typeWord[beach.type] || "";
  const opener = t
    ? `${beach.name} is a ${t} beach in ${beach.area}, Greece.`
    : `${beach.name} is a beach in ${beach.area}, Greece.`;
  const second = beach.organized
    ? "It is an organized beach with rentable facilities."
    : "It is an unorganized, undeveloped beach.";
  return `${opener} ${second}`;
}

// ---------------------------------------------------------------------------
// Public: amenities answer (used under "What amenities does X have?")

export function generateAmenitiesAnswer(beach: Beach): string {
  const list = formatAmenityList(beach.amenities);
  if (!list) {
    return `${beach.name} does not have organized commercial amenities listed in our records.`;
  }
  const variants = [
    `Verified amenities at ${beach.name} include ${list}.`,
    `${beach.name} offers ${list}.`,
    `At ${beach.name} you'll find ${list}.`,
  ];
  return pickByHash(beach.slug, variants);
}

// ---------------------------------------------------------------------------
// FAQ generators (one builder per question — each may return null to skip)

function whatKindFaq(beach: Beach): BeachQA {
  const lead = firstSentence(beach.description);
  const t = typeWord[beach.type] || "";
  const waveFragment =
    beach.wave_conditions === "CALM"
      ? "calm waters"
      : beach.wave_conditions === "MODERATE"
        ? "moderate waves"
        : beach.wave_conditions === "WAVY"
          ? "stronger waves"
          : beach.wave_conditions === "SURFABLE"
            ? "surfable waves"
            : "varying wave conditions";
  const organizedFragment = beach.organized
    ? "It is an organized beach, so commercial amenities are typically available in season."
    : "It is unorganized, with few or no commercial facilities on the sand.";

  if (lead) {
    // Use the description as the primary unique answer. Append one structured
    // fact (type or organized status) only if it isn't obviously redundant.
    const trailers: string[] = [];
    if (t && !lead.toLowerCase().includes(t)) {
      trailers.push(`It is classified as a ${t} beach with ${waveFragment}.`);
    } else {
      trailers.push(`Wave conditions are typically ${waveFragment}.`);
    }
    trailers.push(organizedFragment);
    return {
      question: `What kind of beach is ${beach.name}?`,
      answer: `${lead} ${pickByHash(beach.slug, trailers)}`,
    };
  }

  // No description — minimal templated answer.
  const opener = t ? `${beach.name} is a ${t} beach` : `${beach.name} is a beach`;
  return {
    question: `What kind of beach is ${beach.name}?`,
    answer: `${opener} in ${beach.area}, Greece, with ${waveFragment}. ${organizedFragment}`,
  };
}

function swimmingFaq(beach: Beach): BeachQA | null {
  // Skip for WAVY — there's no useful answer beyond "be careful", which is
  // a generic disclaimer. The description already covers this for those
  // beaches that warrant the warning.
  if (beach.wave_conditions === "WAVY") return null;

  const hasLifeguard = (beach.amenities || []).includes("lifeguard");
  const name = beach.name;

  let phrasings: string[] = [];
  switch (beach.wave_conditions) {
    case "CALM":
      phrasings = hasLifeguard
        ? [
            `Waters at ${name} are typically calm and shallow — well-suited for less confident swimmers and children. A lifeguard is on duty in season.`,
            `${name} has calm, shallow conditions with a lifeguard in season, which makes it easy water for most swimmers.`,
            `${name} sits on a sheltered stretch with calm water and a seasonal lifeguard.`,
          ]
        : [
            `Waters at ${name} are typically calm and shallow — comfortable for less confident swimmers.`,
            `${name} has calm, shallow conditions, well-suited to relaxed swimming. No lifeguard is listed on site.`,
            `Wave conditions at ${name} are calm; the water is generally easy for most swimmers.`,
          ];
      break;
    case "MODERATE":
      phrasings = hasLifeguard
        ? [
            `${name} has moderate waves and a seasonal lifeguard. Comfortable for most adult swimmers.`,
            `Expect moderate wave activity at ${name}, with a lifeguard on duty in season.`,
          ]
        : [
            `${name} has moderate waves — comfortable for most adult swimmers.`,
            `Wave activity at ${name} is moderate; suitable for confident swimmers.`,
          ];
      break;
    case "SURFABLE":
      phrasings = [
        `${name} has consistent surfable waves, which suits surfing and bodyboarding more than casual swimming.`,
        `Wave conditions at ${name} are surfable — appealing for board sports, less for casual swims.`,
      ];
      break;
    default:
      return null;
  }
  return {
    question: `Is ${name} good for swimming?`,
    answer: pickByHash(beach.slug, phrasings),
  };
}

function parkingFaq(beach: Beach): BeachQA | null {
  const name = beach.name;
  let phrasings: string[] = [];
  switch (beach.parking) {
    case "LARGE_LOT":
      phrasings = [
        `${name} has a large parking lot sized for high-season volumes.`,
        `There is a large parking area at ${name}.`,
        `Parking at ${name} is in a large lot near the beach access.`,
      ];
      break;
    case "SMALL_LOT":
      phrasings = [
        `${name} has a small dedicated parking lot.`,
        `There is a small parking area at ${name}, near the access path.`,
        `Parking at ${name} is in a small lot — limited capacity.`,
      ];
      break;
    case "ROADSIDE":
      phrasings = [
        `${name} has only roadside parking — no dedicated lot.`,
        `Parking at ${name} is limited to roadside spots along the access road.`,
      ];
      break;
    case "NONE":
      phrasings = [
        `${name} has no dedicated parking; access is on foot from nearby roads or public transport.`,
        `There is no parking at ${name} — visitors typically walk in from a nearby road.`,
      ];
      break;
    default:
      return null;
  }
  return {
    question: `Does ${name} have parking?`,
    answer: pickByHash(beach.slug, phrasings),
  };
}

function familyFriendlyFaq(beach: Beach): BeachQA | null {
  const { signals, isPositive } = hasFamilySignal(beach);
  // Skip when we have no positive signals — saying "no, it's not" adds no
  // citable value and would just duplicate across pages.
  if (!isPositive) return null;
  const phrasings = [
    `${beach.name} is generally well-suited for families, with ${joinWithAnd(signals)}.`,
    `Families typically do well at ${beach.name} — ${joinWithAnd(signals)} are all present.`,
    `${beach.name} has ${joinWithAnd(signals)}, which makes it a reasonable family option.`,
  ];
  return {
    question: `Is ${beach.name} family-friendly?`,
    answer: pickByHash(beach.slug, phrasings),
  };
}

function blueFlagFaq(beach: Beach): BeachQA | null {
  // Only emit when the answer is yes — negative answers are filler.
  if (!beach.blue_flag) return null;
  const phrasings = [
    `Yes. ${beach.name} currently holds Blue Flag certification from the Foundation for Environmental Education, awarded annually for water quality, safety, and environmental management. The Blue Flag registry is published at https://www.blueflag.global.`,
    `Yes — ${beach.name} is Blue Flag certified, meaning it meets the international standard for bathing water quality, on-site services, and environmental management as set by the Foundation for Environmental Education.`,
  ];
  return {
    question: `Is ${beach.name} Blue Flag certified?`,
    answer: pickByHash(beach.slug, phrasings),
  };
}

function amenitiesFaq(beach: Beach): BeachQA | null {
  const amenities = beach.amenities || [];
  // Gate on the LABELED count, not the raw count — beaches can have
  // amenities in the data that aren't in our labels map (e.g. "hiking"),
  // which would otherwise produce a one-item filler answer.
  const labeled = amenities.filter((a) => amenityLabels[a] !== undefined);
  if (labeled.length < 3) return null;
  const list = joinWithAnd(labeled.map((a) => amenityLabels[a]));
  const phrasings = [
    `Verified amenities at ${beach.name} include ${list}.`,
    `${beach.name} offers ${list}.`,
    `At ${beach.name} you'll find ${list}.`,
  ];
  return {
    question: `What amenities does ${beach.name} have?`,
    answer: pickByHash(beach.slug, phrasings),
  };
}

// ---------------------------------------------------------------------------
// Public: assembled FAQ list — beaches get a variable-length set so the
// content shape itself differs across the catalogue.

export function generateBeachFAQs(beach: Beach): BeachQA[] {
  // No "Where is X located?" question by design — its answer would either
  // duplicate the description sentence used by whatKindFaq below, or
  // reduce to boilerplate ("located in {area}, Greece"). The breadcrumb,
  // H1, and at-a-glance grid already carry the location signal.
  const builders: Array<(b: Beach) => BeachQA | null> = [
    whatKindFaq,
    swimmingFaq,
    parkingFaq,
    familyFriendlyFaq,
    blueFlagFaq,
    amenitiesFaq,
  ];
  const faqs: BeachQA[] = [];
  for (const build of builders) {
    const item = build(beach);
    if (item) faqs.push(item);
  }
  return faqs;
}
