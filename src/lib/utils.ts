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

export const formatRelativeTime = (isoDate: string | Date): string => {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

export const formatRelativeUpdatedAt = (isoDate: string | Date): string => {
  return `Updated ${formatRelativeTime(isoDate)}`;
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
