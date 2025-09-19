import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  blur?: boolean;
  grayscale?: boolean;
}

interface UseImageOptimizationReturn {
  optimizedSrc: string;
  isLoading: boolean;
  error: boolean;
  retry: () => void;
}

// Image optimization service configuration
const IMAGE_SERVICE_CONFIG = {
  // You can configure different services here
  default: {
    baseUrl: 'https://images.unsplash.com', // Example service
    fallbackUrl: 'https://placehold.co',
  },
  // Add more services as needed
  cloudinary: {
    baseUrl: 'https://res.cloudinary.com/your-cloud',
    fallbackUrl: 'https://placehold.co',
  }
};

// Generate optimized image URL
const generateOptimizedUrl = (
  originalSrc: string,
  options: ImageOptimizationOptions = {}
): string => {
  const {
    width = 400,
    height = 225,
    quality = 80,
    format = 'webp',
    blur = false,
    grayscale = false
  } = options;

  // If it's already a placeholder or optimized URL, return as is
  if (originalSrc.includes('placehold.co') || originalSrc.includes('res.cloudinary.com')) {
    return originalSrc;
  }

  // For Unsplash images, use their optimization API
  if (originalSrc.includes('unsplash.com')) {
    const url = new URL(originalSrc);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('fm', format);
    if (blur) url.searchParams.set('blur', '1');
    if (grayscale) url.searchParams.set('grayscale', '1');
    return url.toString();
  }

  // For other URLs, you might want to use a proxy service
  // This is a placeholder - implement your own image optimization service
  return originalSrc;
};

// Check if image format is supported
const isFormatSupported = (format: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL(`image/${format}`).indexOf(`image/${format}`) === 5;
  } catch {
    return false;
  }
};

// Get the best supported format
const getBestFormat = (): string => {
  if (isFormatSupported('avif')) return 'avif';
  if (isFormatSupported('webp')) return 'webp';
  return 'jpeg';
};

export const useImageOptimization = (
  src: string,
  options: ImageOptimizationOptions = {}
): UseImageOptimizationReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState('');
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const retry = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      setError(false);
      setIsLoading(true);
      loadImage();
    }
  }, []);

  const loadImage = useCallback(async () => {
    if (!src) {
      setError(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(false);

      // Get the best supported format
      const bestFormat = getBestFormat();
      const formatOptions = { ...options, format: bestFormat as any };

      // Generate optimized URL
      const optimizedUrl = generateOptimizedUrl(src, formatOptions);

      // Preload the image
      const img = new Image();
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = optimizedUrl;
      });

      await loadPromise;
      
      setOptimizedSrc(optimizedUrl);
      setIsLoading(false);
      retryCountRef.current = 0;
    } catch (err) {
      console.warn('Image optimization failed:', err);
      setError(true);
      setIsLoading(false);
    }
  }, [src, options]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return {
    optimizedSrc,
    isLoading,
    error,
    retry
  };
};

// Hook for preloading multiple images
export const useImagePreloader = (urls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback(async (url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) return;

    setLoadingImages(prev => new Set(prev).add(url));

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      setLoadedImages(prev => new Set(prev).add(url));
    } catch (error) {
      console.warn('Failed to preload image:', url, error);
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  }, [loadedImages, loadingImages]);

  const preloadAll = useCallback(async () => {
    const promises = urls.map(url => preloadImage(url));
    await Promise.allSettled(promises);
  }, [urls, preloadImage]);

  return {
    loadedImages,
    loadingImages,
    preloadImage,
    preloadAll,
    isLoaded: (url: string) => loadedImages.has(url),
    isLoading: (url: string) => loadingImages.has(url)
  };
};
