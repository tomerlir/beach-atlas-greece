import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const slugify = (input: string): string => {
  const base = input
    .normalize('NFKD')
    // remove diacritic marks
    .replace(/[\u0300-\u036f]/g, '')
    // keep only ascii letters, numbers, spaces, hyphens, underscores
    .replace(/[^A-Za-z0-9\s_-]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base) return base;
  // Fallback for non-latin names (e.g., Greek-only) → deterministic short id
  const rand = Math.random().toString(36).slice(2, 8);
  return `beach-${rand}`;
};

export const formatRelativeUpdatedAt = (isoDate: string | Date): string => {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34524, 'week'],
    [12, 'month'],
  ];
  let count = seconds;
  let unit = 'second';
  for (let i = 0; i < intervals.length; i++) {
    if (count < intervals[i][0]) break;
    count = Math.floor(count / intervals[i][0]);
    unit = intervals[i][1];
  }
  return `Updated ${count} ${unit}${count !== 1 ? 's' : ''} ago`;
};

export const AMENITY_OPTIONS = [
  'umbrellas',
  'showers',
  'toilets',
  'food',
  'lifeguard',
  'parking',
] as const;

export const TYPE_OPTIONS = ['SANDY','PEBBLY','MIXED','OTHER'] as const;
export const WAVE_OPTIONS = ['CALM','MODERATE','WAVY','SURFABLE'] as const;
export const PARKING_OPTIONS = ['NONE','ROADSIDE','SMALL_LOT','LARGE_LOT'] as const;
export const STATUS_OPTIONS = ['DRAFT','HIDDEN','ACTIVE'] as const;
