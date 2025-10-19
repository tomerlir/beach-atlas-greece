import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import DetailImageSkeleton from "@/components/DetailImageSkeleton";
import { getCachedPlaceholder, generateSimpleGradientPlaceholder } from "@/utils/imagePlaceholder";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
  fallbackComponent?: React.ReactNode;
  useDetailSkeleton?: boolean; // New prop for detail page skeleton
  placeholderPalette?: "default" | "morning" | "afternoon" | "sunset"; // New prop for placeholder theme
}

// Use the new placeholder utility functions
const generateBlurDataURL = (
  width: number,
  height: number,
  palette: keyof typeof import("@/utils/imagePlaceholder").BEACH_COLOR_PALETTES = "default"
): string => {
  try {
    // Try to use the cached beach-themed placeholder
    return getCachedPlaceholder(width, height, palette);
  } catch (error) {
    // Fallback to simple gradient if there's an issue
    console.warn("Failed to generate beach placeholder, using fallback:", error);
    return generateSimpleGradientPlaceholder(width, height);
  }
};

// Image optimization service (you can replace with your preferred service)
const getOptimizedImageUrl = (src: string): string => {
  // For now, we'll use a simple approach
  // In production, you might want to use services like:
  // - Cloudinary
  // - ImageKit
  // - Vercel's Image Optimization
  // - Or implement your own image proxy

  // If it's already a placeholder, return as is
  if (src.includes("placehold.co")) {
    return src;
  }

  // For other URLs, you could implement your own optimization
  // This is a placeholder implementation
  return src;
};

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width = 400,
  height = 225,
  priority = false,
  placeholder = "blur",
  blurDataURL,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  loading = "lazy",
  onLoad,
  onError,
  fallbackComponent,
  useDetailSkeleton = false,
  placeholderPalette = "default",
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadStartTime = useRef<number>(0);
  const { trackImageLoad, trackImageError } = usePerformanceMonitoring();
  const { isPreloaded, getPreloadResult } = useImagePreloader();

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(width, height, placeholderPalette);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      // Ensure observer is properly disconnected in all cases
      try {
        observer.disconnect();
      } catch (error) {
        // Observer might already be disconnected, ignore error
        console.warn("Observer cleanup warning:", error);
      }
    };
  }, [priority, isInView]);

  // Handle image load
  const handleLoad = useCallback(() => {
    const loadTime = Date.now() - loadStartTime.current;
    trackImageLoad(src, loadTime);
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad, src, trackImageLoad]);

  // Check if image is already preloaded
  const preloadResult = getPreloadResult(src);
  const isImagePreloaded = isPreloaded(src);

  // Handle image error
  const handleError = useCallback(() => {
    trackImageError(src);
    setImageError(true);
    onError?.();
  }, [onError, src, trackImageError]);

  // Get optimized image URL - use preloaded URL if available
  const optimizedSrc = isInView
    ? isImagePreloaded && preloadResult?.success
      ? preloadResult.url
      : getOptimizedImageUrl(src)
    : "";

  // If image is preloaded, mark as loaded immediately
  useEffect(() => {
    if (isImagePreloaded && preloadResult?.success && isInView) {
      setImageLoaded(true);
      onLoad?.();
    }
  }, [isImagePreloaded, preloadResult, isInView, onLoad]);

  if (imageError && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden w-full", className)}
      style={{
        aspectRatio: `${width}/${height}`,
        // Additional CSS to prevent layout shift
        contain: "layout style paint",
        // Ensure proper mobile behavior
        maxWidth: "100%",
        height: "auto",
      }}
    >
      {/* Blur placeholder - always present to prevent layout shift */}
      {placeholder === "blur" && !imageLoaded && !imageError && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${defaultBlurDataURL})`,
            backgroundColor: "#0ea5e9", // Fallback color matching the gradient
            // Apply blur effect via CSS filter - reduced for mobile performance
            filter: "blur(8px)",
            transform: "scale(1.02)", // Reduced scale for mobile
          }}
        />
      )}

      {/* Loading skeleton - only show if not using blur placeholder */}
      {placeholder !== "blur" &&
        !imageLoaded &&
        !imageError &&
        (useDetailSkeleton ? (
          <DetailImageSkeleton className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted animate-pulse" />
        ))}

      {/* Actual image */}
      {isInView && !imageError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? "eager" : loading}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          onLoadStart={() => {
            loadStartTime.current = Date.now();
          }}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Error fallback */}
      {imageError && !fallbackComponent && (
        <div className="absolute inset-0 bg-gradient-to-br from-ocean to-secondary flex items-center justify-center">
          <div className="text-primary-foreground text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-60"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm opacity-80">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
