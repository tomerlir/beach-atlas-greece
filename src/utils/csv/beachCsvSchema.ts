import { z } from "zod";
import { AMENITY_MAP } from "@/lib/amenities";
import { CsvRowData } from "./download";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Fixed CSV header order as specified
export const CSV_HEADER_ORDER = [
  "slug",
  "name",
  "area",
  "latitude",
  "longitude",
  "type",
  "wave_conditions",
  "organized",
  "parking",
  "blue_flag",
  "amenities",
  "photo_url",
  "photo_source",
  "description",
  "source",
  "verified_at",
  "status",
] as const;

// Allowed amenity keys extracted from the single source of truth
export const ALLOWED_AMENITIES = Object.keys(AMENITY_MAP) as readonly string[];

// Import common types and constants from centralized location
import {
  BEACH_TYPES,
  WAVE_CONDITIONS,
  PARKING_TYPES,
  STATUS_TYPES,
  BeachType,
  WaveCondition,
  ParkingType,
  StatusType,
  isValidBeachType,
  isValidWaveCondition,
  isValidParkingType,
  isValidStatusType,
} from "@/types/common";

// Re-export for backward compatibility
export { BEACH_TYPES, WAVE_CONDITIONS, PARKING_TYPES, STATUS_TYPES };
export type { BeachType, WaveCondition, ParkingType, StatusType };

// Database row types based on Supabase schema
export type BeachDbRow = Tables<"beaches">;
export type BeachDbInsert = TablesInsert<"beaches">;
export type BeachDbUpdate = TablesUpdate<"beaches">;

// Raw CSV input interface with all string values
export interface RawCsvRow {
  slug: string;
  name: string;
  area: string;
  latitude: string;
  longitude: string;
  type: string;
  wave_conditions: string;
  organized: string;
  parking: string;
  blue_flag: string;
  amenities: string;
  photo_url: string;
  photo_source: string;
  description: string;
  source: string;
  verified_at: string;
  status: string;
}

// Zod schema for normalized row
export const BeachCsvRowSchema = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().min(1),
  area: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.enum(BEACH_TYPES),
  wave_conditions: z.enum(WAVE_CONDITIONS).optional(),
  organized: z.boolean(),
  parking: z.enum(PARKING_TYPES),
  blue_flag: z.boolean(),
  amenities: z.array(
    z.string().refine((val) => ALLOWED_AMENITIES.includes(val), {
      message: `Must be one of: ${ALLOWED_AMENITIES.join(", ")}`,
    })
  ),
  photo_url: z.string().optional(),
  photo_source: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  verified_at: z.string().datetime().optional(),
  status: z.enum(STATUS_TYPES).default("DRAFT"),
});

export type BeachCsvRow = z.infer<typeof BeachCsvRowSchema>;

// Validation error type
export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: string;
}

// Classification result
export type RowClassification = "create" | "update" | "skip" | "error";

export interface ClassificationResult {
  classification: RowClassification;
  errors: ValidationError[];
  normalizedRow?: BeachCsvRow;
}

// Utility function to slugify a string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim()
    .substring(0, 80); // Limit to 80 characters
}

// Validation functions are now imported from @/types/common

// Normalize boolean values
function normalizeBoolean(value: string): boolean | undefined {
  if (!value || value.trim() === "") return undefined;
  const normalized = value.toLowerCase().trim();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

// Normalize amenities from comma-separated string
function normalizeAmenities(value: string): string[] {
  if (!value || value.trim() === "") return [];

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => ALLOWED_AMENITIES.includes(item));
}

// Normalize date string
function normalizeDate(value: string): string | undefined {
  if (!value || value.trim() === "") return undefined;

  try {
    const date = new Date(value.trim());
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
}

// Main normalization function
export function normalizeRow(raw: Record<string, string>, rowIndex: number): ClassificationResult {
  const errors: ValidationError[] = [];

  try {
    // Trim all string values and create typed interface
    const trimmed: RawCsvRow = {
      slug: raw.slug?.trim() || "",
      name: raw.name?.trim() || "",
      area: raw.area?.trim() || "",
      latitude: raw.latitude?.trim() || "",
      longitude: raw.longitude?.trim() || "",
      type: raw.type?.trim() || "",
      wave_conditions: raw.wave_conditions?.trim() || "",
      organized: raw.organized?.trim() || "",
      parking: raw.parking?.trim() || "",
      blue_flag: raw.blue_flag?.trim() || "",
      amenities: raw.amenities?.trim() || "",
      photo_url: raw.photo_url?.trim() || "",
      photo_source: raw.photo_source?.trim() || "",
      description: raw.description?.trim() || "",
      source: raw.source?.trim() || "",
      verified_at: raw.verified_at?.trim() || "",
      status: raw.status?.trim() || "",
    };

    // Handle slug - generate from name if missing
    let slug = trimmed.slug;
    if (!slug && trimmed.name) {
      slug = slugify(trimmed.name);
    }
    if (!slug) {
      errors.push({
        row: rowIndex,
        column: "slug",
        message: "Slug is required and cannot be generated from empty name",
        value: trimmed.slug,
      });
    }

    // Normalize coordinates
    const latitude = trimmed.latitude ? parseFloat(trimmed.latitude) : undefined;
    const longitude = trimmed.longitude ? parseFloat(trimmed.longitude) : undefined;

    if (latitude === undefined || isNaN(latitude)) {
      errors.push({
        row: rowIndex,
        column: "latitude",
        message: "Valid latitude is required",
        value: trimmed.latitude,
      });
    }

    if (longitude === undefined || isNaN(longitude)) {
      errors.push({
        row: rowIndex,
        column: "longitude",
        message: "Valid longitude is required",
        value: trimmed.longitude,
      });
    }

    // Normalize booleans
    const organized = normalizeBoolean(trimmed.organized);
    const blueFlag = normalizeBoolean(trimmed.blue_flag);

    // Validate and normalize enums with type safety
    let type: BeachType | undefined;
    let waveConditions: WaveCondition | undefined;
    let parking: ParkingType | undefined;
    let status: StatusType | undefined;

    if (trimmed.type) {
      if (isValidBeachType(trimmed.type)) {
        type = trimmed.type.toUpperCase() as BeachType;
      } else {
        errors.push({
          row: rowIndex,
          column: "type",
          message: `Invalid type. Must be one of: ${BEACH_TYPES.join(", ")}`,
          value: trimmed.type,
        });
      }
    }

    if (trimmed.wave_conditions) {
      if (isValidWaveCondition(trimmed.wave_conditions)) {
        waveConditions = trimmed.wave_conditions.toUpperCase() as WaveCondition;
      } else {
        errors.push({
          row: rowIndex,
          column: "wave_conditions",
          message: `Invalid wave_conditions. Must be one of: ${WAVE_CONDITIONS.join(", ")}`,
          value: trimmed.wave_conditions,
        });
      }
    }

    if (trimmed.parking) {
      if (isValidParkingType(trimmed.parking)) {
        parking = trimmed.parking.toUpperCase() as ParkingType;
      } else {
        errors.push({
          row: rowIndex,
          column: "parking",
          message: `Invalid parking. Must be one of: ${PARKING_TYPES.join(", ")}`,
          value: trimmed.parking,
        });
      }
    }

    if (trimmed.status) {
      if (isValidStatusType(trimmed.status)) {
        status = trimmed.status.toUpperCase() as StatusType;
      } else {
        errors.push({
          row: rowIndex,
          column: "status",
          message: `Invalid status. Must be one of: ${STATUS_TYPES.join(", ")}`,
          value: trimmed.status,
        });
      }
    }

    // Normalize amenities
    const amenities = normalizeAmenities(trimmed.amenities);

    // Check for invalid amenities
    const invalidAmenities =
      trimmed.amenities
        ?.split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item && !ALLOWED_AMENITIES.includes(item)) || [];

    if (invalidAmenities.length > 0) {
      errors.push({
        row: rowIndex,
        column: "amenities",
        message: `Invalid amenities: ${invalidAmenities.join(", ")}. Allowed: ${ALLOWED_AMENITIES.join(", ")}`,
        value: trimmed.amenities,
      });
    }

    // Normalize date
    const verifiedAt = normalizeDate(trimmed.verified_at);
    if (trimmed.verified_at && !verifiedAt) {
      errors.push({
        row: rowIndex,
        column: "verified_at",
        message: "Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ssZ)",
        value: trimmed.verified_at,
      });
    }

    // If there are errors, return error classification
    if (errors.length > 0) {
      return {
        classification: "error",
        errors,
      };
    }

    // Build normalized row
    const normalizedRow: BeachCsvRow = {
      slug: slug!,
      name: trimmed.name,
      area: trimmed.area,
      latitude: latitude!,
      longitude: longitude!,
      type: type,
      wave_conditions: waveConditions || undefined,
      organized: organized ?? false,
      parking: parking,
      blue_flag: blueFlag ?? false,
      amenities,
      photo_url: trimmed.photo_url || undefined,
      description: trimmed.description || undefined,
      source: trimmed.source || undefined,
      verified_at: verifiedAt,
      status: status || "DRAFT",
    };

    return {
      classification: "create", // Will be updated by classify function
      errors: [],
      normalizedRow,
    };
  } catch (error) {
    return {
      classification: "error",
      errors: [
        {
          row: rowIndex,
          column: "general",
          message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
          value: JSON.stringify(raw),
        },
      ],
    };
  }
}

// Classify rows based on existing slugs
export function classify(
  existingSlugs: Set<string>,
  row: BeachCsvRow,
  rowIndex: number,
  seenSlugs: Set<string>
): ClassificationResult {
  const errors: ValidationError[] = [];

  // Check for duplicate slugs within the file
  if (seenSlugs.has(row.slug)) {
    errors.push({
      row: rowIndex,
      column: "slug",
      message: "Duplicate slug within import file",
      value: row.slug,
    });
    return {
      classification: "error",
      errors,
    };
  }

  seenSlugs.add(row.slug);

  // Determine if this is a create or update
  const classification = existingSlugs.has(row.slug) ? "update" : "create";

  return {
    classification,
    errors: [],
    normalizedRow: row,
  };
}

// Convert database row to CSV row
export function dbRowToCsvRow(dbRow: BeachDbRow): CsvRowData {
  return {
    slug: dbRow.slug || "",
    name: dbRow.name || "",
    area: dbRow.area || "",
    latitude: dbRow.latitude?.toString() || "",
    longitude: dbRow.longitude?.toString() || "",
    type: dbRow.type || "",
    wave_conditions: dbRow.wave_conditions || "",
    organized: dbRow.organized ? "true" : "false",
    parking: dbRow.parking || "",
    blue_flag: dbRow.blue_flag ? "true" : "false",
    amenities: dbRow.amenities?.join(",") || "",
    photo_url: dbRow.photo_url || "",
    photo_source: dbRow.photo_source || "",
    description: dbRow.description || "",
    source: dbRow.source || "",
    verified_at: dbRow.verified_at || "",
    status: dbRow.status || "",
  };
}

// Convert CSV row to database insert/update object
export function csvRowToDbInsert(
  csvRow: BeachCsvRow,
  areaIdMap?: Record<string, string>
): BeachDbInsert {
  const dbRow: BeachDbInsert = {
    slug: csvRow.slug,
    name: csvRow.name,
    area: csvRow.area,
    // Map area name to area_id if mapping is provided
    ...(areaIdMap && areaIdMap[csvRow.area] ? { area_id: areaIdMap[csvRow.area] } : {}),
    latitude: csvRow.latitude,
    longitude: csvRow.longitude,
    type: csvRow.type,
    organized: csvRow.organized,
    parking: csvRow.parking,
    blue_flag: csvRow.blue_flag,
    amenities: csvRow.amenities,
    status: csvRow.status,
    // wave_conditions is required in the database schema
    wave_conditions: csvRow.wave_conditions || "CALM",
  };

  // Only include optional fields if they have values
  if (csvRow.photo_url) dbRow.photo_url = csvRow.photo_url;
  if (csvRow.photo_source) dbRow.photo_source = csvRow.photo_source;
  if (csvRow.description) dbRow.description = csvRow.description;
  if (csvRow.source) dbRow.source = csvRow.source;
  if (csvRow.verified_at) dbRow.verified_at = csvRow.verified_at;

  return dbRow;
}

// Convert CSV row to database update object (only non-undefined fields)
export function csvRowToDbUpdate(
  csvRow: BeachCsvRow,
  areaIdMap?: Record<string, string>
): BeachDbUpdate {
  const dbRow: BeachDbUpdate = {};

  // Always include these fields for updates
  if (csvRow.name !== undefined) dbRow.name = csvRow.name;
  if (csvRow.area !== undefined) dbRow.area = csvRow.area;
  // Map area name to area_id if mapping is provided
  if (csvRow.area !== undefined && areaIdMap && areaIdMap[csvRow.area]) {
    dbRow.area_id = areaIdMap[csvRow.area];
  }
  if (csvRow.latitude !== undefined) dbRow.latitude = csvRow.latitude;
  if (csvRow.longitude !== undefined) dbRow.longitude = csvRow.longitude;
  if (csvRow.type !== undefined) dbRow.type = csvRow.type;
  if (csvRow.organized !== undefined) dbRow.organized = csvRow.organized;
  if (csvRow.parking !== undefined) dbRow.parking = csvRow.parking;
  if (csvRow.blue_flag !== undefined) dbRow.blue_flag = csvRow.blue_flag;
  if (csvRow.amenities !== undefined) dbRow.amenities = csvRow.amenities;
  if (csvRow.status !== undefined) dbRow.status = csvRow.status;

  // Optional fields
  if (csvRow.wave_conditions !== undefined) dbRow.wave_conditions = csvRow.wave_conditions;
  if (csvRow.photo_url !== undefined) dbRow.photo_url = csvRow.photo_url;
  if (csvRow.photo_source !== undefined) dbRow.photo_source = csvRow.photo_source;
  if (csvRow.description !== undefined) dbRow.description = csvRow.description;
  if (csvRow.source !== undefined) dbRow.source = csvRow.source;
  if (csvRow.verified_at !== undefined) dbRow.verified_at = csvRow.verified_at;

  return dbRow;
}
