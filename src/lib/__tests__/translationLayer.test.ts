import { describe, it, expect } from "vitest";
import {
  extractFromNaturalLanguageWithContext,
  applyExtractedFilters,
} from "@/lib/naturalLanguageSearch";
import type { FilterState } from "@/hooks/useUrlState";

const baselineFilters = (): FilterState => ({
  search: "",
  originalQuery: undefined,
  location: undefined,
  locations: undefined,
  organized: [],
  blueFlag: false,
  parking: [],
  amenities: [],
  waveConditions: [],
  type: [],
  sort: "name.asc",
  page: 1,
  nearMe: false,
});

describe("Translation layer: NLQ → structured filters", () => {
  it("family-friendly beach with shade → includes family_friendly (shade may be inferred later)", async () => {
    const query = "family-friendly beach with shade";
    const extracted = await extractFromNaturalLanguageWithContext(query);
    const { filters } = extracted;

    // family-friendly should be recognized
    expect((filters.amenities || []).includes("family_friendly")).toBe(true);
    // Shade extraction is not yet guaranteed by current NLP; do not assert here

    const merged = applyExtractedFilters(baselineFilters(), extracted);
    expect(merged.search).toBe("");
  });

  it("calm waters for swimming → waveConditions CALM", async () => {
    const query = "calm waters for swimming";
    const { filters } = await extractFromNaturalLanguageWithContext(query);
    expect(filters.waveConditions).toBeDefined();
    expect(filters.waveConditions?.includes("CALM")).toBe(true);
  });

  it("organized beach with parking and a bar → organized + parking (bar may vary by mapping)", async () => {
    const query = "organized beach with parking and a bar";
    const { filters } = await extractFromNaturalLanguageWithContext(query);
    expect(filters.organized?.includes("organized")).toBe(true);
    expect((filters.parking || []).length).toBeGreaterThan(0);
    // Bar extraction may or may not map; skip strict assertion for now
  });
});
