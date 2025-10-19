import { describe, it, expect } from "vitest";
import { VERIFIED_BEACHES } from "./fixtures/verifiedBeaches";
import { matchesFilters } from "@/hooks/useBeachFiltering";
import type { FilterState } from "@/hooks/useUrlState";
import type { Beach } from "@/types/beach";

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

describe("Strict verified filtering semantics", () => {
  it("includes a beach that matches all type criteria; excludes those that do not", () => {
    const filters: FilterState = { ...baseFilters, type: ["SANDY"] };
    const included = VERIFIED_BEACHES.filter((b) => matchesFilters(b as Beach, filters));
    expect(included.every((b) => b.type === "SANDY")).toBe(true);

    const filtersPebbly: FilterState = { ...baseFilters, type: ["PEBBLY"] };
    const includedPebbly = VERIFIED_BEACHES.filter((b) =>
      matchesFilters(b as Beach, filtersPebbly)
    );
    expect(includedPebbly.every((b) => b.type === "PEBBLY")).toBe(true);
  });

  it("enforces wave conditions strictly", () => {
    const filters: FilterState = { ...baseFilters, waveConditions: ["CALM"] };
    const included = VERIFIED_BEACHES.filter((b) => matchesFilters(b as Beach, filters));
    expect(included.every((b) => b.wave_conditions === "CALM")).toBe(true);

    const excluded = VERIFIED_BEACHES.filter((b) => !matchesFilters(b as Beach, filters));
    expect(excluded.some((b) => b.wave_conditions !== "CALM")).toBe(true);
  });

  it("requires all amenities to be present (AND semantics)", () => {
    const filters: FilterState = { ...baseFilters, amenities: ["sunbeds", "beach_bar"] };
    const included = VERIFIED_BEACHES.filter((b) => matchesFilters(b as Beach, filters));
    expect(included.length).toBeGreaterThan(0);
    expect(
      included.every(
        (b) => (b.amenities || []).includes("sunbeds") && (b.amenities || []).includes("beach_bar")
      )
    ).toBe(true);

    const filtersStrict: FilterState = { ...baseFilters, amenities: ["lifeguard", "beach_bar"] };
    const includedStrict = VERIFIED_BEACHES.filter((b) =>
      matchesFilters(b as Beach, filtersStrict)
    );
    // Expect none if no beach has both
    expect(
      includedStrict.every(
        (b) =>
          (b.amenities || []).includes("lifeguard") && (b.amenities || []).includes("beach_bar")
      )
    ).toBe(true);
  });

  it("applies parking type exactly", () => {
    const filters: FilterState = { ...baseFilters, parking: ["LARGE_LOT"] };
    const included = VERIFIED_BEACHES.filter((b) => matchesFilters(b as Beach, filters));
    expect(included.every((b) => b.parking === "LARGE_LOT")).toBe(true);
    const excluded = VERIFIED_BEACHES.filter((b) => !matchesFilters(b as Beach, filters));
    expect(excluded.some((b) => b.parking !== "LARGE_LOT")).toBe(true);
  });

  it("enforces Blue Flag strictly", () => {
    const filters: FilterState = { ...baseFilters, blueFlag: true };
    const included = VERIFIED_BEACHES.filter((b) => matchesFilters(b as Beach, filters));
    expect(included.every((b) => b.blue_flag === true)).toBe(true);
    const excluded = VERIFIED_BEACHES.filter((b) => !matchesFilters(b as Beach, filters));
    expect(excluded.some((b) => !b.blue_flag)).toBe(true);
  });

  it("composes multiple criteria with AND semantics", () => {
    const filters: FilterState = {
      ...baseFilters,
      type: ["SANDY"],
      waveConditions: ["CALM"],
      organized: ["organized"],
      amenities: ["sunbeds", "beach_bar"],
    };
    const included = VERIFIED_BEACHES.filter((b) => matchesFilters(b as Beach, filters));
    expect(
      included.every(
        (b) =>
          b.type === "SANDY" &&
          b.wave_conditions === "CALM" &&
          b.organized === true &&
          (b.amenities || []).includes("sunbeds") &&
          (b.amenities || []).includes("beach_bar")
      )
    ).toBe(true);

    const excluded = VERIFIED_BEACHES.filter((b) => !matchesFilters(b as Beach, filters));
    expect(excluded.length).toBeGreaterThan(0);
  });
});
