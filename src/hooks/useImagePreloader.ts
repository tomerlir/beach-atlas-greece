import { useCallback, useRef, useEffect } from 'react';

interface ImagePreloadOptions {
  priority?: boolean;
  quality?: number;
  width?: number;
  height?: number;
}

interface PreloadResult {
  success: boolean;
  url: string;
  loadTime: number;
}

export const useImagePreloader = () => {
  const preloadedImages = useRef<Map<string, PreloadResult>>(new Map());
  const loadingImages = useRef<Set<string>>(new Set());
  const preloadQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  // Generate optimized image URL (same logic as OptimizedImage)
  const getOptimizedImageUrl = useCallback((
    src: string, 
    width: number, 
    height: number, 
    quality: number = 80
  ): string => {
    // If it's already a placeholder or optimized URL, return as is
    if (src.includes('placehold.co') || src.includes('res.cloudinary.com')) {
      return src;
    }

    // For Unsplash images, use their optimization API
    if (src.includes('unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('w', width.toString());
      url.searchParams.set('h', height.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('fm', 'webp');
      return url.toString();
    }

    return src;
  }, []);

  // Preload a single image
  const preloadImage = useCallback((
    src: string, 
    options: ImagePreloadOptions = {}
  ): Promise<PreloadResult> => {
    return new Promise((resolve) => {
      const {
        priority = false,
        quality = 80,
        width = 400,
        height = 225
      } = options;

      // Check if already preloaded
      if (preloadedImages.current.has(src)) {
        resolve(preloadedImages.current.get(src)!);
        return;
      }

      // Check if currently loading
      if (loadingImages.current.has(src)) {
        // Wait for the existing load to complete
        const checkInterval = setInterval(() => {
          if (preloadedImages.current.has(src)) {
            clearInterval(checkInterval);
            resolve(preloadedImages.current.get(src)!);
          }
        }, 50);
        return;
      }

      const startTime = Date.now();
      loadingImages.current.add(src);

      const optimizedSrc = getOptimizedImageUrl(src, width, height, quality);
      const img = new Image();

      img.onload = () => {
        const loadTime = Date.now() - startTime;
        const result: PreloadResult = {
          success: true,
          url: optimizedSrc,
          loadTime
        };
        
        preloadedImages.current.set(src, result);
        loadingImages.current.delete(src);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Image preloaded: ${src} in ${loadTime}ms`);
        }
        
        resolve(result);
      };

      img.onerror = () => {
        const loadTime = Date.now() - startTime;
        const result: PreloadResult = {
          success: false,
          url: src,
          loadTime
        };
        
        preloadedImages.current.set(src, result);
        loadingImages.current.delete(src);
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Image preload failed: ${src}`);
        }
        
        resolve(result);
      };

      // Set priority loading
      if (priority) {
        img.fetchPriority = 'high';
      }

      img.src = optimizedSrc;
    });
  }, [getOptimizedImageUrl]);

  // Process preload queue
  const processQueue = useCallback(async () => {
    if (isProcessing.current || preloadQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    while (preloadQueue.current.length > 0) {
      const batch = preloadQueue.current.splice(0, 3); // Process 3 images at a time
      
      await Promise.allSettled(
        batch.map(src => preloadImage(src))
      );

      // Small delay between batches to avoid overwhelming the browser
      if (preloadQueue.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    isProcessing.current = false;
  }, [preloadImage]);

  // Add images to preload queue
  const queueImages = useCallback((urls: string[], options: ImagePreloadOptions = {}) => {
    const newUrls = urls.filter(url => 
      !preloadedImages.current.has(url) && 
      !loadingImages.current.has(url) && 
      !preloadQueue.current.includes(url)
    );

    preloadQueue.current.push(...newUrls);
    processQueue();
  }, [processQueue]);

  // Preload multiple images with priority
  const preloadImages = useCallback(async (
    urls: string[], 
    options: ImagePreloadOptions = {}
  ): Promise<PreloadResult[]> => {
    const results = await Promise.allSettled(
      urls.map(url => preloadImage(url, options))
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        success: false,
        url: '',
        loadTime: 0
      }
    );
  }, [preloadImage]);

  // Preload images for visible beach cards
  const preloadVisibleBeachImages = useCallback((beaches: any[]) => {
    const imageUrls = beaches
      .filter(beach => beach.photo_url)
      .map(beach => beach.photo_url);

    if (imageUrls.length > 0) {
      queueImages(imageUrls, { quality: 85 });
    }
  }, [queueImages]);

  // Check if image is preloaded
  const isPreloaded = useCallback((src: string): boolean => {
    return preloadedImages.current.has(src);
  }, []);

  // Get preload result
  const getPreloadResult = useCallback((src: string): PreloadResult | undefined => {
    return preloadedImages.current.get(src);
  }, []);

  // Clear preloaded images (for memory management)
  const clearPreloadedImages = useCallback(() => {
    preloadedImages.current.clear();
    loadingImages.current.clear();
    preloadQueue.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreloadedImages();
    };
  }, [clearPreloadedImages]);

  return {
    preloadImage,
    preloadImages,
    queueImages,
    preloadVisibleBeachImages,
    isPreloaded,
    getPreloadResult,
    clearPreloadedImages,
    preloadedCount: preloadedImages.current.size,
    loadingCount: loadingImages.current.size,
    queueCount: preloadQueue.current.length
  };
};
