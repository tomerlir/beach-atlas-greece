import { describe, it, expect } from "vitest";
import { generateResultsExplanation } from "@/components/ResultsSummary";
import type { FilterState } from "@/hooks/useUrlState";

const baseFilters: FilterState = {
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
};

describe("Explainable picks (ResultsSummary explanation)", () => {
  it("summarizes calm waters + sunbeds + beach bar", () => {
    const filters: FilterState = {
      ...baseFilters,
      waveConditions: ["CALM"],
      amenities: ["sunbeds", "beach_bar"],
    };
    const parts = generateResultsExplanation(filters, 5, null);
    const joined = parts.join(" ");
    expect(joined).toMatch(/calm waters/i);
    expect(joined).toMatch(/sunbeds/i);
    expect(joined).toMatch(/beach bar/i);
  });

  it("empty filters with results uses friendly default", () => {
    const parts = generateResultsExplanation(baseFilters, 12, null);
    expect(parts).toEqual(["showing all available beaches"]);
  });

  it("prioritizes location/type/features when many parts", () => {
    const filters: FilterState = {
      ...baseFilters,
      search: "crete",
      type: ["SANDY"],
      waveConditions: ["CALM"],
      amenities: ["sunbeds", "umbrellas", "beach_bar"],
    };
    const parts = generateResultsExplanation(filters, 20, null);
    // Should include location and type among first parts
    expect(parts[0]).toMatch(/in Crete|near Crete/i);
    expect(parts.some((p) => p.includes("shores"))).toBe(true);
  });
});
