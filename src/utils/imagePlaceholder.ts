/**
 * Image placeholder utilities for preventing layout shift
 * These functions generate optimized blur placeholders for beach images
 */

// Beach-themed color palettes for different times of day/seasons
export const BEACH_COLOR_PALETTES = {
  morning: {
    sky: "#0ea5e9",
    water: "#38bdf8",
    sand: "#f0f9ff",
    accent: "#7dd3fc",
  },
  afternoon: {
    sky: "#0284c7",
    water: "#0ea5e9",
    sand: "#fef3c7",
    accent: "#38bdf8",
  },
  sunset: {
    sky: "#f97316",
    water: "#fb923c",
    sand: "#fed7aa",
    accent: "#fdba74",
  },
  default: {
    sky: "#0ea5e9",
    water: "#38bdf8",
    sand: "#f0f9ff",
    accent: "#7dd3fc",
  },
} as const;

/**
 * Generate a high-quality blur placeholder optimized for beach images
 * @param width - Target width (will be scaled down for performance)
 * @param height - Target height (will be scaled down for performance)
 * @param palette - Color palette to use (defaults to 'default')
 * @returns Base64 encoded image data URL
 */
export const generateBeachBlurPlaceholder = (
  width: number,
  height: number,
  palette: keyof typeof BEACH_COLOR_PALETTES = "default"
): string => {
  // Create a small canvas for performance (max 40x23 to maintain 16:9 ratio)
  const canvas = document.createElement("canvas");
  // Use a more conservative scale for mobile compatibility
  const maxWidth = 40;
  const maxHeight = 23;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const colors = BEACH_COLOR_PALETTES[palette];

  // Create a beach-themed gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, colors.sky); // Sky
  gradient.addColorStop(0.3, colors.water); // Water
  gradient.addColorStop(0.7, colors.accent); // Shallow water
  gradient.addColorStop(1, colors.sand); // Sand

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle texture to make it look more realistic
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2 + 1;
    ctx.fillRect(x, y, size, size);
  }

  // Add some wave-like patterns
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const y = canvas.height * 0.3 + i * canvas.height * 0.2;
    ctx.moveTo(0, y);
    for (let x = 0; x < canvas.width; x += 5) {
      const waveY = y + Math.sin(x * 0.1 + i) * 2;
      ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  return canvas.toDataURL("image/jpeg", 0.3);
};

/**
 * Generate a simple gradient placeholder (fallback)
 * @param width - Target width
 * @param height - Target height
 * @returns Base64 encoded image data URL
 */
export const generateSimpleGradientPlaceholder = (width: number, height: number): string => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(width, 40);
  canvas.height = Math.min(height, 23);
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#e2e8f0");
  gradient.addColorStop(1, "#cbd5e1");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.1);
};

/**
 * Get a cached placeholder or generate a new one
 * This helps with performance by avoiding repeated generation
 */
const placeholderCache = new Map<string, string>();

export const getCachedPlaceholder = (
  width: number,
  height: number,
  palette: keyof typeof BEACH_COLOR_PALETTES = "default"
): string => {
  const key = `${width}x${height}-${palette}`;

  if (placeholderCache.has(key)) {
    return placeholderCache.get(key)!;
  }

  const placeholder = generateBeachBlurPlaceholder(width, height, palette);
  placeholderCache.set(key, placeholder);

  return placeholder;
};

/**
 * Preload common placeholder sizes for better performance
 */
export const preloadCommonPlaceholders = (): void => {
  const commonSizes = [
    { width: 800, height: 450 }, // Desktop hero
    { width: 400, height: 225 }, // Mobile hero
    { width: 300, height: 169 }, // Thumbnail
  ];

  const palettes: (keyof typeof BEACH_COLOR_PALETTES)[] = ["default", "morning", "afternoon"];

  commonSizes.forEach(({ width, height }) => {
    palettes.forEach((palette) => {
      getCachedPlaceholder(width, height, palette);
    });
  });
};
