import {
  WaveCondition,
  BeachType,
  isValidWaveCondition,
  isValidBeachType,
  WAVE_CONDITIONS,
  BEACH_TYPES,
} from "@/types/common";

/**
 * Parse a string parameter from URL search params
 */
export function parseStringParam(searchParams: URLSearchParams, key: string): string | undefined {
  return searchParams.get(key) || undefined;
}

/**
 * Parse an array parameter from URL search params (comma-separated)
 */
export function parseArrayParam(searchParams: URLSearchParams, key: string): string[] {
  const value = searchParams.get(key);
  return value ? value.split(",").filter(Boolean) : [];
}

/**
 * Parse a boolean parameter from URL search params
 */
export function parseBooleanParam(searchParams: URLSearchParams, key: string): boolean {
  return searchParams.get(key) === "true";
}

/**
 * Parse an integer parameter from URL search params
 */
export function parseIntParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number
): number {
  const value = searchParams.get(key);
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
}

/**
 * Parse an enum array parameter from URL search params with validation
 */
export function parseEnumArrayParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  validValues: readonly T[],
  validator: (value: string) => value is T
): T[] {
  const value = searchParams.get(key);
  if (!value) return [];

  return value.split(",").filter((item): item is T => Boolean(item) && validator(item));
}

/**
 * Parse wave conditions with validation
 */
export function parseWaveConditions(searchParams: URLSearchParams): WaveCondition[] {
  return parseEnumArrayParam(
    searchParams,
    "waveConditions",
    WAVE_CONDITIONS,
    (condition): condition is WaveCondition => isValidWaveCondition(condition)
  );
}

/**
 * Parse beach types with validation
 */
export function parseBeachTypes(searchParams: URLSearchParams): BeachType[] {
  return parseEnumArrayParam(searchParams, "type", BEACH_TYPES, (type): type is BeachType =>
    isValidBeachType(type)
  );
}

/**
 * Parse sort parameter with validation
 */
export function parseSortParam(searchParams: URLSearchParams): string | null {
  const sort = searchParams.get("sort");
  const validSorts = ["name.asc", "name.desc", "distance.asc", "distance.desc"];
  return sort && validSorts.includes(sort) ? sort : null;
}
