/**
 * Common Type Definitions
 *
 * This file consolidates all common enum-like types used throughout the application
 * to ensure consistency and follow the DRY principle.
 */

import React from "react";
import { XCircle, AlertCircle, CheckCircle } from "lucide-react";

// ============================================================================
// ENUM CONSTANTS
// ============================================================================

export const BEACH_TYPES = ["SANDY", "PEBBLY", "MIXED", "OTHER"] as const;
export const WAVE_CONDITIONS = ["CALM", "MODERATE", "WAVY", "SURFABLE"] as const;
export const PARKING_TYPES = ["NONE", "ROADSIDE", "SMALL_LOT", "LARGE_LOT"] as const;
export const ORGANIZED_TYPES = ["ORGANIZED", "UNORGANIZED"] as const;
export const STATUS_TYPES = ["ACTIVE", "HIDDEN", "DRAFT"] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BeachType = (typeof BEACH_TYPES)[number];
export type WaveCondition = (typeof WAVE_CONDITIONS)[number];
export type ParkingType = (typeof PARKING_TYPES)[number];
export type OrganizedType = (typeof ORGANIZED_TYPES)[number];
export type StatusType = (typeof STATUS_TYPES)[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isValidBeachType = (value: string): value is BeachType => {
  return BEACH_TYPES.includes(value.toUpperCase() as BeachType);
};

export const isValidWaveCondition = (value: string): value is WaveCondition => {
  return WAVE_CONDITIONS.includes(value.toUpperCase() as WaveCondition);
};

export const isValidParkingType = (value: string): value is ParkingType => {
  return PARKING_TYPES.includes(value.toUpperCase() as ParkingType);
};

export const isValidOrganizedType = (value: string): value is OrganizedType => {
  return ORGANIZED_TYPES.includes(value.toUpperCase() as OrganizedType);
};

export const isValidStatusType = (value: string): value is StatusType => {
  return STATUS_TYPES.includes(value.toUpperCase() as StatusType);
};

// ============================================================================
// CENTRALIZED CONFIGURATIONS
// ============================================================================

// Centralized parking configuration with all display properties
export interface ParkingConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  naturalLabel: string; // For natural language descriptions
}

export const PARKING_CONFIG: Record<ParkingType, ParkingConfig> = {
  NONE: {
    label: "No Parking",
    icon: XCircle,
    color: "text-secondary",
    naturalLabel: "no parking",
  },
  ROADSIDE: {
    label: "Roadside Parking",
    icon: AlertCircle,
    color: "text-secondary",
    naturalLabel: "roadside parking",
  },
  SMALL_LOT: {
    label: "Small Lot",
    icon: AlertCircle,
    color: "text-secondary",
    naturalLabel: "small parking lot",
  },
  LARGE_LOT: {
    label: "Large Lot",
    icon: CheckCircle,
    color: "text-secondary",
    naturalLabel: "large parking lot",
  },
};

// Helper function to get parking config
export const getParkingConfig = (parkingType: ParkingType): ParkingConfig => {
  return PARKING_CONFIG[parkingType];
};

// Helper function to get parking label for natural language
export const getParkingNaturalLabel = (parkingType: ParkingType): string => {
  return PARKING_CONFIG[parkingType].naturalLabel;
};

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Re-export commonly used constants for backward compatibility
export const TYPE_OPTIONS = BEACH_TYPES;
export const WAVE_OPTIONS = WAVE_CONDITIONS;
export const PARKING_OPTIONS = PARKING_TYPES;
export const STATUS_OPTIONS = STATUS_TYPES;
