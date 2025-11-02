import { ImgHTMLAttributes } from "react";

interface ResponsivePictureProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Base name of the image (e.g., 'hero-background') */
  baseName: string;
  /** Fallback format extension (e.g., 'png', 'webp') */
  fallbackExt?: string;
  /** Available widths for responsive images */
  widths: number[];
  /** Alt text for accessibility */
  alt: string;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Loading strategy */
  loading?: "lazy" | "eager";
  /** Additional CSS classes */
  className?: string;
}

/**
 * ResponsivePicture component that serves optimized images in modern formats (AVIF, WebP)
 * with automatic fallback to original format.
 *
 * Generated images are expected to be in the format: {baseName}-{width}.{format}
 */
export const ResponsivePicture: React.FC<ResponsivePictureProps> = ({
  baseName,
  fallbackExt = "png",
  widths,
  alt,
  sizes = "100vw",
  loading = "lazy",
  className,
  ...imgProps
}) => {
  // Generate srcset for AVIF format
  const avifSrcset = widths.map((width) => `/${baseName}-${width}.avif ${width}w`).join(", ");

  // Generate srcset for WebP format
  const webpSrcset = widths.map((width) => `/${baseName}-${width}.webp ${width}w`).join(", ");

  // Fallback image (use the largest width or original)
  const fallbackSrc = `/${baseName}.${fallbackExt}`;

  return (
    <picture>
      {/* AVIF format - best compression */}
      <source type="image/avif" srcSet={avifSrcset} sizes={sizes} />

      {/* WebP format - wide browser support, good compression */}
      <source type="image/webp" srcSet={webpSrcset} sizes={sizes} />

      {/* Fallback img element - also used for dimensions and lazy loading */}
      <img
        src={fallbackSrc}
        srcSet={webpSrcset}
        sizes={sizes}
        alt={alt}
        loading={loading}
        className={className}
        decoding={loading === "eager" ? "sync" : "async"}
        {...imgProps}
      />
    </picture>
  );
};

export default ResponsivePicture;
