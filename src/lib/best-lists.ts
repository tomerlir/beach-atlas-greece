/**
 * "/best/<slug>" catalog pages — ranked recommendations.
 *
 * Each list is a category-shaped answer surface for AI engines and Google.
 * When a user asks Perplexity "best calm-water beaches in Greece for kids",
 * the engine needs a list-shaped, ranked, citable source. These pages are
 * that source.
 *
 * Each list defines:
 *  - a filter to restrict the catalog to beaches that qualify
 *  - a score function to rank qualifiers
 *  - a per-beach rationale function (the "why it's on this list")
 *  - hand-written methodology (E-E-A-T signal) and FAQ block (AEO surface)
 *
 * Methodology paragraphs are deliberately specific: they explain WHICH
 * structured fields drive the ranking, so the page reads as a verified
 * directory cut, not a vibes-based listicle.
 */

import { Tables } from "@/integrations/supabase/types";

type Beach = Tables<"beaches">;

export interface BestListFaq {
  question: string;
  answer: string;
}

export interface BestListConfig {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** 1-2 sentence lede shown above methodology. */
  intro: string;
  /** Methodology paragraph explaining the ranking criteria (E-E-A-T). */
  methodology: string;
  filter: (beach: Beach) => boolean;
  score: (beach: Beach) => number;
  /**
   * Build the "why this beach is on the list" sentence. Each list emphasizes
   * different signals. The function receives the beach plus an optional
   * first-sentence lead from the beach's DB overview — when provided, the
   * rationale should weave it in so the per-beach text reads uniquely
   * instead of repeating the same templated phrasing across beaches with
   * identical signal profiles.
   */
  rationale: (beach: Beach, overviewLead?: string) => string;
  faqs: BestListFaq[];
  /** Max beaches shown on the page. */
  itemsPerPage: number;
}

// ---------------------------------------------------------------------------
// Helpers for filter/score functions

const hasAmenity = (b: Beach, a: string) => (b.amenities || []).includes(a);
const isCalm = (b: Beach) => b.wave_conditions === "CALM";

// ---------------------------------------------------------------------------
// Rationale helpers — short sentences derived from structured fields

const list = (parts: string[]) => {
  const clean = parts.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
};

// ---------------------------------------------------------------------------
// List definitions

export const BEST_LISTS: BestListConfig[] = [
  {
    slug: "family-friendly-beaches-greece",
    h1: "Best Family-Friendly Beaches in Greece",
    metaTitle: "Best Family-Friendly Beaches in Greece (Calm Water + Lifeguards)",
    metaDescription:
      "Ranked list of family-friendly Greek beaches with calm water, lifeguards, toilets, and easy parking — scored from verified amenity data.",
    intro:
      "These Greek beaches consistently rank highly for families based on water conditions, on-site supervision, and the practical facilities that matter when traveling with children.",
    methodology:
      "Every beach in our directory is scored on four signals that matter for family visits: wave conditions (calm, shallow water is preferred), seasonal lifeguard presence, the presence of family-friendly amenities such as toilets and showers, and accessible parking. We weight calm water and lifeguards most heavily, then add points for facilities. Each beach below earns at least three of these signals and is verified from on-site notes, the Blue Flag Foundation registry, and OpenStreetMap geolocation.",
    filter: (b) => {
      if (b.wave_conditions === "WAVY" || b.wave_conditions === "SURFABLE") return false;
      const amenities = b.amenities || [];
      let score = 0;
      if (isCalm(b)) score += 3;
      if (amenities.includes("lifeguard")) score += 3;
      if (amenities.includes("family_friendly")) score += 2;
      if (amenities.includes("toilets")) score += 1;
      if (amenities.includes("showers")) score += 1;
      if (b.organized) score += 1;
      if (b.parking !== "NONE") score += 1;
      return score >= 4;
    },
    score: (b) => {
      const amenities = b.amenities || [];
      return (
        (isCalm(b) ? 3 : 0) +
        (amenities.includes("lifeguard") ? 3 : 0) +
        (amenities.includes("family_friendly") ? 2 : 0) +
        (amenities.includes("toilets") ? 1 : 0) +
        (amenities.includes("showers") ? 1 : 0) +
        (b.organized ? 1 : 0) +
        (b.parking === "LARGE_LOT" ? 2 : b.parking === "SMALL_LOT" ? 1 : 0) +
        (b.blue_flag ? 1 : 0)
      );
    },
    rationale: (b, overviewLead) => {
      const reasons: string[] = [];
      if (isCalm(b)) reasons.push("calm shallow water");
      if (hasAmenity(b, "lifeguard")) reasons.push("a seasonal lifeguard");
      if (hasAmenity(b, "family_friendly")) reasons.push("family-friendly facilities");
      if (hasAmenity(b, "toilets") && hasAmenity(b, "showers")) reasons.push("toilets and showers");
      if (b.parking === "LARGE_LOT") reasons.push("a large parking lot");
      if (b.blue_flag) reasons.push("Blue Flag certification");
      const signals = reasons.length ? `Combines ${list(reasons.slice(0, 3))}.` : "";
      return overviewLead ? `${overviewLead} ${signals}`.trim() : signals;
    },
    faqs: [
      {
        question: "What makes a Greek beach family-friendly?",
        answer:
          "For families, the key signals are calm, shallow water for less confident swimmers, a seasonal lifeguard, on-site toilets and showers, and easy parking close to the sand. Organized beaches with sunbeds and a beach bar add convenience for full-day visits with kids.",
      },
      {
        question: "Which Greek islands have the most family-friendly beaches?",
        answer:
          "Corfu, Zakynthos, Chalkidiki, and the gulf-side coast of Attica concentrate the most family-friendly beaches — protected coves, calm Ionian waters, and well-developed amenities. The exposed southern Aegean (Mykonos, Naxos windward sides) tends to be windier.",
      },
      {
        question: "Are there lifeguards on Greek beaches?",
        answer:
          "Lifeguard coverage is seasonal and concentrated on organized beaches, typically Blue Flag-certified ones and beaches operated by municipalities. Unorganized beaches and remote coves usually have no lifeguard. We mark verified lifeguard presence on each beach detail page.",
      },
      {
        question: "What facilities should I look for at a family beach?",
        answer:
          "At minimum: toilets, showers, and shaded options (umbrellas or trees). Useful additions are a beach bar or taverna for food and water, lifeguard presence, and a paved or large parking lot so you don't carry gear far. Wheelchair access and beach wheelchairs exist at a small number of organized beaches.",
      },
      {
        question: "Are Greek beaches stroller-accessible?",
        answer:
          "A handful of organized beaches have paved paths from the parking area to the sand, but most beaches require some walking across sand or pebbles. Beaches with large parking lots near the shoreline are the easiest with strollers and beach gear.",
      },
    ],
    itemsPerPage: 15,
  },

  {
    slug: "blue-flag-beaches-greece",
    h1: "Blue Flag Beaches in Greece (Verified Registry)",
    metaTitle: "Blue Flag Beaches in Greece — Verified Certified List",
    metaDescription:
      "Greek beaches currently certified by the Blue Flag programme for water quality, safety, environmental management, and on-site services.",
    intro:
      "Greece has consistently ranked among the world's top countries by Blue Flag count. The list below shows beaches in our directory that currently hold the certification.",
    methodology:
      "Blue Flag is an international eco-certification awarded annually by the Foundation for Environmental Education (FEE) to beaches that meet strict criteria for bathing water quality, environmental management, safety, and on-site services. Certifications are renewed each year and can be revoked. Our list reflects the current cycle as cross-referenced with the Blue Flag registry at blueflag.global; beach amenities and parking are verified independently from our directory data.",
    filter: (b) => b.blue_flag === true,
    score: (b) => {
      const amenities = b.amenities || [];
      return (
        amenities.length +
        (b.organized ? 2 : 0) +
        (amenities.includes("lifeguard") ? 2 : 0) +
        (b.parking === "LARGE_LOT" ? 1 : 0)
      );
    },
    rationale: (b, overviewLead) => {
      const amenities = b.amenities || [];
      const features: string[] = [];
      if (b.organized) features.push("organized");
      if (amenities.includes("lifeguard")) features.push("lifeguard on duty");
      if (amenities.length >= 4) features.push(`${amenities.length} verified amenities`);
      const signals = features.length
        ? `Blue Flag certified, ${list(features)}.`
        : "Blue Flag certified.";
      return overviewLead ? `${overviewLead} ${signals}`.trim() : signals;
    },
    faqs: [
      {
        question: "What is the Blue Flag programme?",
        answer:
          "Blue Flag is an international voluntary eco-label run by the Foundation for Environmental Education (FEE) since 1985. To earn the certification, a beach must meet criteria across four pillars: bathing water quality, environmental management, environmental education, and safety and services. Certifications are reviewed annually.",
      },
      {
        question: "How many Greek beaches have Blue Flag status?",
        answer:
          "Greece is typically among the top two countries worldwide by Blue Flag beach count, generally certifying between 540 and 620 beaches each season. Our directory currently lists the certified ones we have verified data for; this is a subset of the full national total.",
      },
      {
        question: "What exactly does Blue Flag certify?",
        answer:
          "Routine bathing water quality testing (with results posted on the beach), waste management on-site, safety equipment, lifeguard presence or rescue capacity, accessibility provisions where applicable, and environmental information for visitors. Note: Blue Flag certifies the operational management — it doesn't guarantee scenic quality or natural setting.",
      },
      {
        question: "Do Blue Flag beaches always have lifeguards?",
        answer:
          "Most Blue Flag beaches have a lifeguard during the certified bathing season, but the requirement can be met by a documented emergency response procedure in some cases. Check the specific beach for confirmed lifeguard presence on duty.",
      },
      {
        question: "Are Blue Flag beaches better than uncertified ones?",
        answer:
          "Better in a specific sense: Blue Flag certifies water quality, safety, and on-site services. Many spectacular Greek beaches are not Blue Flag certified because they're undeveloped or remote — Balos and Sarakiniko, for example, are unorganized and lack the facilities the programme requires. The certification signals operational quality, not scenic value.",
      },
    ],
    itemsPerPage: 20,
  },

  {
    slug: "snorkeling-beaches-greece",
    h1: "Best Snorkeling Beaches in Greece",
    metaTitle: "Best Snorkeling Beaches in Greece — Clear Water & Rock Formations",
    metaDescription:
      "Greek beaches with the best snorkeling — clear calm water, rocky shorelines, and verified snorkeling-friendly conditions.",
    intro:
      "Snorkeling rewards beaches with two things: clarity and structure. The list below picks beaches where calm, clear water meets rocky shorelines, coves, or underwater formations worth exploring.",
    methodology:
      "Snorkeling-friendly beaches share a recognizable profile: calm wave conditions for visibility, rocky or mixed seabed (rather than pure flat sand which hides little) and small-scale topography — coves, caves, sandbars. Our list filters beaches with the snorkeling amenity flagged in our data and ranks them by the combination of calm water, water clarity signals, and structural variety in the surrounding shoreline.",
    filter: (b) => hasAmenity(b, "snorkeling"),
    score: (b) => {
      const amenities = b.amenities || [];
      return (
        (isCalm(b) ? 3 : b.wave_conditions === "MODERATE" ? 1 : 0) +
        (b.type === "PEBBLY" || b.type === "MIXED" ? 2 : 0) +
        (b.blue_flag ? 1 : 0) +
        (amenities.includes("water_sports") ? 1 : 0) +
        (b.organized ? 1 : 0)
      );
    },
    rationale: (b, overviewLead) => {
      const features: string[] = [];
      if (isCalm(b)) features.push("calm water");
      if (b.type === "PEBBLY" || b.type === "MIXED") features.push("rocky shoreline");
      if (b.blue_flag) features.push("Blue Flag water quality");
      const signals = features.length
        ? `Snorkeling spot with ${list(features)}.`
        : "Snorkeling listed as an on-site amenity.";
      return overviewLead ? `${overviewLead} ${signals}`.trim() : signals;
    },
    faqs: [
      {
        question: "Where can you snorkel in Greece?",
        answer:
          "Most Greek coastlines support snorkeling, but the best spots combine clear calm water with rocky shores or coves. The Cyclades (Milos, Paros, Naxos), the Ionian (Lefkada, Zakynthos, Corfu), and Crete's south coast all offer well-known snorkeling beaches. Avoid wind-exposed beaches when the Meltemi blows in summer.",
      },
      {
        question: "What's the best Greek island for snorkeling?",
        answer:
          "Milos is widely considered the most spectacular snorkeling destination thanks to its volcanic underwater formations, caves, and exceptional clarity. The Sporades and Lefkada are also strong, with consistently calm sheltered bays. Crete offers volume and variety across its south and west coasts.",
      },
      {
        question: "Do you need a permit to snorkel in Greece?",
        answer:
          "No permit is required for recreational snorkeling. Spearfishing is regulated and restricted around archaeological sites and marine protected areas. Collecting marine life (especially shells, starfish, and sea urchins from protected zones) is prohibited.",
      },
      {
        question: "What marine life can you see while snorkeling in Greece?",
        answer:
          "Common sightings include sea bream, damselfish, octopus, wrasses, sea urchins, and seagrass meadows that host juvenile fish. Around Posidonia seagrass beds you may see seahorses. Larger sightings — turtles, monk seals — are concentrated in specific protected areas like the Bay of Laganas (Zakynthos).",
      },
      {
        question: "When is the best time of year for snorkeling in Greece?",
        answer:
          "Late May through early October has the warmest water, with peak clarity in September after the algae bloom of midsummer has cleared. Avoid days when the Meltemi (northern wind) is strong — water gets churned and visibility drops sharply on exposed coasts.",
      },
    ],
    itemsPerPage: 15,
  },

  {
    slug: "calm-water-beaches-greece",
    h1: "Best Calm-Water Beaches in Greece for Swimming",
    metaTitle: "Calmest Beaches in Greece for Swimming — Sheltered & Shallow",
    metaDescription:
      "Greek beaches with the calmest water for swimming, families with children, and less confident swimmers — based on verified wave-condition data.",
    intro:
      "Calm-water beaches sit in sheltered bays, on the leeward side of islands, or in coastal lagoons protected from the prevailing northern winds. They're the right pick for families, less confident swimmers, and snorkelers.",
    methodology:
      "We classify each beach's typical wave conditions on a four-point scale (calm, moderate, wavy, surfable). The list below shows beaches in the CALM bucket — typically sheltered bays, leeward coasts, or naturally protected coves where wind chop and swell rarely reach the swimming area. Rankings combine calm conditions with on-site lifeguard, parking, and amenities for practical swimmability.",
    filter: (b) => isCalm(b),
    score: (b) => {
      const amenities = b.amenities || [];
      return (
        3 +
        (amenities.includes("lifeguard") ? 2 : 0) +
        (b.organized ? 1 : 0) +
        (amenities.includes("toilets") ? 1 : 0) +
        (b.parking === "LARGE_LOT" ? 1 : b.parking === "SMALL_LOT" ? 0.5 : 0) +
        (b.blue_flag ? 1 : 0)
      );
    },
    rationale: (b, overviewLead) => {
      const reasons: string[] = ["calm sheltered water"];
      if (hasAmenity(b, "lifeguard")) reasons.push("seasonal lifeguard");
      if (b.organized) reasons.push("organized amenities");
      if (b.blue_flag) reasons.push("Blue Flag certified");
      const signals = `${reasons[0].charAt(0).toUpperCase()}${reasons[0].slice(1)}${reasons.length > 1 ? ` with ${list(reasons.slice(1))}.` : "."}`;
      return overviewLead ? `${overviewLead} ${signals}`.trim() : signals;
    },
    faqs: [
      {
        question: "Why are some Greek beaches so much calmer than others?",
        answer:
          "Two factors: orientation relative to the prevailing wind, and shoreline shape. The Meltemi blows from the north during summer in the Aegean. Beaches on south-facing coasts, leeward sides of islands, or in enclosed bays stay calm while exposed northern and western shores get choppy. The Ionian Sea is generally calmer than the Aegean year-round.",
      },
      {
        question: "What's the calmest sea in Greece for swimming?",
        answer:
          "The Ionian Sea (western Greek coast and islands like Corfu, Zakynthos, Lefkada) is the calmest large body of water — protected from the Meltemi and with smaller fetch. Within the Aegean, the protected bays of Chalkidiki and the southern coasts of Cycladic islands offer the calmest swimming.",
      },
      {
        question: "Which Greek beaches are best for less confident swimmers?",
        answer:
          "Look for the combination of calm water, shallow gradient (gentle slope into the sea), sandy bottom rather than rocky, and ideally a lifeguard on duty. The beaches in our calm-water list with those additional signals are the safest options.",
      },
      {
        question: "When is the Meltemi worst?",
        answer:
          "The Meltemi typically peaks in July and August, with strong winds (force 5-7) several days per week in the central Aegean. It's milder in May, June, and September. The Ionian and northern Greek coasts are largely unaffected.",
      },
      {
        question: "Can you swim safely without a lifeguard?",
        answer:
          "On calm-water beaches with shallow gradient, yes — millions of visitors do every year. We mark beaches without lifeguard coverage in our data so you can choose accordingly. Adult supervision near children is always the practical rule, regardless of beach classification.",
      },
    ],
    itemsPerPage: 18,
  },

  {
    slug: "sandy-beaches-greece",
    h1: "Best Sandy Beaches in Greece",
    metaTitle: "Best Sandy Beaches in Greece — Soft Sand & Shallow Entry",
    metaDescription:
      "Greek beaches with proper sand (not pebbles or rock) — verified by beach-type classification and ranked by amenities.",
    intro:
      "Most Greek beaches are pebble or mixed — soft-sand beaches are the exception, concentrated in specific regions where geology and currents combine. The list below picks the standout sandy beaches in our directory.",
    methodology:
      "Each beach in our directory is classified by surface type (sandy, pebble, mixed, other). This list filters strictly to the SANDY bucket — proper sand, comfortable underfoot, easy on swimming entry. We then rank by amenity completeness, parking, and Blue Flag status, since most sandy beaches also see higher visitor volume and benefit from organized infrastructure.",
    filter: (b) => b.type === "SANDY",
    score: (b) => {
      const amenities = b.amenities || [];
      return (
        amenities.length +
        (b.organized ? 2 : 0) +
        (b.blue_flag ? 2 : 0) +
        (isCalm(b) ? 2 : 0) +
        (b.parking === "LARGE_LOT" ? 1 : 0)
      );
    },
    rationale: (b, overviewLead) => {
      const features: string[] = ["soft sand"];
      if (isCalm(b)) features.push("calm water");
      if (b.blue_flag) features.push("Blue Flag");
      if (b.organized) features.push("full facilities");
      const signals = `${features[0].charAt(0).toUpperCase()}${features[0].slice(1)}${features.length > 1 ? ` with ${list(features.slice(1))}.` : "."}`;
      return overviewLead ? `${overviewLead} ${signals}`.trim() : signals;
    },
    faqs: [
      {
        question: "Why are so many Greek beaches pebbles instead of sand?",
        answer:
          "Most Greek coastlines are erosional — rock-coast geology weathered into pebbles and cobbles rather than the sediment-rich accumulating coasts that produce wide sandy beaches. True sandy beaches concentrate where rivers deposit sediment, where currents pile sand into bars, or in lagoons and dune systems. They're a minority of the total Greek shoreline.",
      },
      {
        question: "Which Greek regions have the most sandy beaches?",
        answer:
          "The Halkidiki peninsulas, the Ionian islands (especially the long beaches of Corfu, Lefkada, and Zakynthos), Naxos and Paros on their southern coasts, and the gulf-side coast of Attica all have extensive sandy stretches. The Cyclades north coasts and most Cretan beaches outside specific spots are pebble or mixed.",
      },
      {
        question: "Are Greek sandy beaches good for sandcastles and beach games?",
        answer:
          "The best sandy beaches in our list have fine to medium grain that packs well. Coarser sand or shell-fragment sand (common around volcanic islands) doesn't sculpt as well but is more comfortable underfoot.",
      },
      {
        question: "Is sandy beach water clearer than pebble beach water?",
        answer:
          "Often the opposite. Pebble beaches typically have clearer water because sand stays suspended longer when stirred up. The clearest Greek beaches tend to be pebble or rocky shorelines — visibility on those can be exceptional even close to shore.",
      },
      {
        question: "What's the longest sandy beach in Greece?",
        answer:
          "Several candidates depending on definition. Plaka beach on Naxos runs unbroken for roughly 4 km; Sarti beach on Halkidiki, the Falassarna stretch on western Crete, and the Vatera coast on Lesvos all run several kilometers. We list specific beaches by name in our directory rather than aggregating contiguous coastline.",
      },
    ],
    itemsPerPage: 15,
  },

  {
    slug: "unspoiled-beaches-greece",
    h1: "Best Wild and Unspoiled Beaches in Greece",
    metaTitle: "Best Wild & Unspoiled Beaches in Greece — Remote, Natural, Undeveloped",
    metaDescription:
      "Greek beaches that remain wild, natural, and undeveloped — no sun loungers, minimal facilities, harder access, and scenic reward.",
    intro:
      "Wild beaches are the antidote to organized resort coastlines. They have minimal or no commercial infrastructure, often require effort to reach, and reward visitors with quieter sand and a stronger sense of place.",
    methodology:
      "We define unspoiled as the combination of: no organized commercial operation, minimal or no on-site amenities, and remote access (roadside parking or no dedicated parking at all). This list filters for that combination and ranks by how unambiguously wild each beach is, with bonus weight for distinctive natural features like coastal lagoons, cliffs, or remote sandbars. These beaches are best visited self-sufficient: bring water, sun protection, and pack out what you bring in.",
    filter: (b) => {
      if (b.organized) return false;
      const amenities = b.amenities || [];
      if (amenities.length > 2) return false;
      return b.parking === "NONE" || b.parking === "ROADSIDE" || b.parking === "SMALL_LOT";
    },
    score: (b) => {
      const amenities = b.amenities || [];
      return (
        (b.organized ? 0 : 3) +
        (b.parking === "NONE" ? 3 : b.parking === "ROADSIDE" ? 2 : 0) +
        (amenities.length === 0 ? 2 : amenities.length === 1 ? 1 : 0) +
        (b.blue_flag ? -2 : 0) +
        (b.type === "SANDY" ? 1 : 0)
      );
    },
    rationale: (b, overviewLead) => {
      const reasons: string[] = ["unorganized"];
      if (b.parking === "NONE") reasons.push("no dedicated parking");
      else if (b.parking === "ROADSIDE") reasons.push("roadside parking only");
      const amenities = b.amenities || [];
      if (amenities.length === 0) reasons.push("no facilities");
      const signals = `${reasons[0].charAt(0).toUpperCase()}${reasons[0].slice(1)}${reasons.length > 1 ? `, with ${list(reasons.slice(1))}.` : "."}`;
      return overviewLead ? `${overviewLead} ${signals}`.trim() : signals;
    },
    faqs: [
      {
        question: "What does an unspoiled Greek beach actually mean?",
        answer:
          "Practically: no sun loungers for rent, no beach bar, no organized parking lot, often no signage. You arrive, find a spot, lay down a towel, and you're on your own. The trade-off is fewer crowds, more natural setting, and the visual reward of an undeveloped coast — at the cost of bringing your own water, shade, and food.",
      },
      {
        question: "What should I bring to a wild beach?",
        answer:
          "Plenty of water (1.5-2 liters per person minimum), high-SPF sun protection, a beach umbrella or sun hat, food for the duration of your visit, and a trash bag — there are no bins. A small first-aid kit is sensible if you're walking in over rocks. Bring out everything you brought in.",
      },
      {
        question: "Are wild beaches in Greece safe?",
        answer:
          "Generally yes for swimming if you're a competent swimmer, since wild beaches are often in protected coves. The main risks are heat exhaustion, dehydration, and minor injuries on rocks or sea urchins — all of which are managed by preparation. Cell coverage can be patchy in remote spots; tell someone your plan.",
      },
      {
        question: "How do you get to a wild beach without a car?",
        answer:
          "Most truly wild beaches require a car, scooter, or boat. Some accessible ones are reachable by hiking from a paved road (typically 10-30 minutes on foot). On islands, day-tour boats often visit famous wild beaches like Balos or Navagio.",
      },
      {
        question: "Should I be worried about overcrowding at wild beaches?",
        answer:
          "Famous wild beaches (Balos, Navagio, Elafonissi) get cruise-boat crowds during peak summer days. Less-famous wild beaches stay quiet. Going early in the morning or late afternoon avoids the bulk of day-boat traffic at the well-known ones.",
      },
    ],
    itemsPerPage: 15,
  },

  {
    slug: "easy-access-beaches-greece",
    h1: "Greek Beaches with the Easiest Parking and Access",
    metaTitle: "Easy-Access Greek Beaches — Large Parking, Paved Road, Organized",
    metaDescription:
      "Greek beaches with large parking lots, easy road access, and full organized facilities — minimal walking with kids, gear, or limited mobility.",
    intro:
      "Some Greek beaches are 20 minutes' hike down a goat track. These are the opposite — drive up, unload, walk a short distance, lay down a towel. Right pick when you're traveling with kids, equipment, or someone with limited mobility.",
    methodology:
      "We filter beaches with verified large parking lots and rank by the combination of parking capacity, on-site organization (which usually means short walks to amenities), and a flat or gentle approach to the sand. These beaches sacrifice some remoteness for convenience — they tend to be more developed and busier, but that's the trade-off you're choosing when access is the priority.",
    filter: (b) => b.parking === "LARGE_LOT" || (b.parking === "SMALL_LOT" && b.organized),
    score: (b) => {
      const amenities = b.amenities || [];
      return (
        (b.parking === "LARGE_LOT" ? 3 : 1) +
        (b.organized ? 2 : 0) +
        (amenities.includes("toilets") ? 1 : 0) +
        (amenities.includes("showers") ? 1 : 0) +
        (amenities.includes("family_friendly") ? 1 : 0) +
        (b.blue_flag ? 1 : 0) +
        (isCalm(b) ? 1 : 0)
      );
    },
    rationale: (b, overviewLead) => {
      const features: string[] = [];
      if (b.parking === "LARGE_LOT") features.push("large parking lot");
      else if (b.parking === "SMALL_LOT") features.push("small dedicated parking");
      if (b.organized) features.push("full amenities");
      if (b.blue_flag) features.push("Blue Flag");
      const signals = features.length
        ? `${features[0].charAt(0).toUpperCase()}${features[0].slice(1)}${features.length > 1 ? `, ${list(features.slice(1))}.` : "."}`
        : "";
      return overviewLead ? `${overviewLead} ${signals}`.trim() : signals;
    },
    faqs: [
      {
        question: "Which Greek beaches have wheelchair access?",
        answer:
          "Wheelchair access is a small but growing subset of organized beaches. Beach wheelchairs (with wide wheels for sand) are available at some municipal beaches in Attica, Halkidiki, and major resort areas. We mark accessibility features on individual beach pages where verified — for accessibility-critical trips, contact the beach operator before visiting.",
      },
      {
        question: "Can you park right at the beach in Greece?",
        answer:
          "At the beaches in this list, yes — they have dedicated parking lots within short walking distance of the sand. Many other Greek beaches require roadside parking some distance away, or have no parking and require a walk-in. We classify each beach's parking situation on a four-level scale.",
      },
      {
        question: "Do you have to pay for parking at Greek beaches?",
        answer:
          "Most beach parking in Greece is free. Some popular beaches near major resorts charge for parking during summer; pay-and-display kiosks are typical. We do not currently track parking fees on each beach but it's worth checking signage on arrival.",
      },
      {
        question: "Are easy-access beaches more crowded?",
        answer:
          "Yes, on average. Beaches with large parking lots and easy approach are the default choice for day-trippers and families with gear, so they fill faster during summer. Arriving by 10 AM or after 4 PM avoids the peak. The trade-off for the convenience is more people.",
      },
      {
        question: "Which Greek beaches are best for traveling with a baby?",
        answer:
          "Look for the combination of large parking lot, organized beach with toilets and changing facilities, calm shallow water, and lifeguard presence. These are the beaches at the top of this list combined with the family-friendly list. Pack a sun tent — even Blue Flag organized beaches don't always rent baby-suitable shade.",
      },
    ],
    itemsPerPage: 15,
  },
];

export function getBestListBySlug(slug: string): BestListConfig | null {
  return BEST_LISTS.find((l) => l.slug === slug) || null;
}

export interface RankedBeach {
  beach: Beach;
  rank: number;
  score: number;
  rationale: string;
}

/**
 * Extract a short, beach-specific lead sentence from the embedded DB
 * overview (set by generate-routes.ts joining beach_content into allBeaches).
 * Returns null when no overview exists. We take the first sentence so the
 * rationale stays short and the unique flavour anchors each entry.
 */
function extractOverviewLead(beach: Beach): string | undefined {
  const overview = (beach as Beach & { beach_content?: { overview?: string } | null }).beach_content
    ?.overview;
  if (!overview) return undefined;
  const match = overview.match(/^[^.!?]+[.!?](?=\s|$)/);
  return match ? match[0].trim() : overview.slice(0, 180).trim();
}

export function rankBeachesForList(beaches: Beach[], list: BestListConfig): RankedBeach[] {
  const qualifying = beaches.filter(list.filter);
  qualifying.sort((a, b) => list.score(b) - list.score(a));
  const top = qualifying.slice(0, list.itemsPerPage);
  return top.map((beach, i) => ({
    beach,
    rank: i + 1,
    score: list.score(beach),
    rationale: list.rationale(beach, extractOverviewLead(beach)),
  }));
}
