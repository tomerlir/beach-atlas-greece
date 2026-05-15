import { useParams, Link } from "react-router-dom";
import { generateAreaSlug, generateBeachUrl, formatRelativeTime } from "@/lib/utils";
import { openInMaps } from "@/lib/maps";
import { generateBeachMetaTitle, generateBeachMetaDescription } from "@/lib/seo";
import { generateBeachWebPageSchema } from "@/lib/structured-data";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { CONTACT_EMAIL } from "@/lib/constants";
import {
  MapPin,
  Waves,
  Car,
  Flag,
  ArrowLeft,
  Shield,
  Palmtree,
  Users,
  Share2,
  MessageSquare,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tables } from "@/integrations/supabase/types";
import { getAmenityConfig } from "@/lib/amenities";
import OptimizedImage from "@/components/OptimizedImage";
import PhotoAttribution from "@/components/PhotoAttribution";
import { ShareDialog } from "@/components/ShareDialog";
import { useProgressiveLoading } from "@/hooks/useProgressiveLoading";
import { generateBeachImageAltText } from "@/lib/accessibility";
import { useNavigationState } from "@/hooks/useNavigationState";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";
import { fetchMoreInArea } from "@/lib/fetchMoreInArea";
import MoreInArea from "@/components/MoreInArea";
import { analytics } from "@/lib/analytics";
import JsonLdScript from "@/components/seo/JsonLdScript";

interface AmenityItem {
  key: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | string;
    size?: number | string;
    color?: string;
  }>;
  category: string;
}

interface AmenitiesByCategory {
  [category: string]: AmenityItem[];
}

type Beach = Tables<"beaches">;

// Map beach types to readable labels
const typeLabels: Record<string, string> = {
  SANDY: "Sandy",
  PEBBLY: "Pebbles",
  MIXED: "Mixed",
  OTHER: "Other",
};

// Map wave conditions to readable labels
const waveLabels: Record<string, string> = {
  CALM: "Calm Waters",
  MODERATE: "Moderate Waves",
  WAVY: "Wavy",
  SURFABLE: "Surfable",
};

// Map parking types to readable labels
const parkingLabels: Record<string, string> = {
  NONE: "No Parking",
  ROADSIDE: "Roadside Parking",
  SMALL_LOT: "Small Parking Lot",
  LARGE_LOT: "Large Parking Lot",
};

const BeachDetail = () => {
  const { area, "beach-name": beachName } = useParams<{ area: string; "beach-name": string }>();
  const { toast } = useToast();
  const { navigateBack } = useNavigationState();

  // State management
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch beach data with optimized caching
  const {
    data: beach,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["beach", beachName],
    queryFn: async () => {
      if (!beachName) throw new Error("No beach name provided");

      const { data, error } = await supabase
        .from("beaches")
        .select("*")
        .eq("slug", beachName)
        .eq("status", "ACTIVE")
        .single();

      if (error) {
        console.error("Beach fetch error:", error);
        throw error;
      }

      // Validate that the area matches the URL parameter
      if (area && generateAreaSlug(data.area) !== area) {
        throw new Error("Area mismatch");
      }

      return data;
    },
    enabled: !!beachName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in newer versions)
  });

  // Track beach engagement after page loads to ensure correct page_path context
  useEffect(() => {
    if (beach) {
      // Get query hash if available - this indicates search source
      const queryHash = sessionStorage.getItem("current_query_hash") || undefined;

      // Determine engagement source from navigation history and search context
      const navigationSource = sessionStorage.getItem("beach-navigation-source");
      let source: "search" | "map" | "browsing" | "area_explore" = "browsing";

      // If there's a query hash, this is definitely from a search
      if (queryHash) {
        source = "search";
      } else if (navigationSource) {
        if (navigationSource.includes("/map")) {
          source = "map";
        } else if (navigationSource.includes("/") && navigationSource !== "/") {
          // Check if coming from another beach page (beach-to-beach navigation)
          const pathParts = navigationSource.split("/").filter(Boolean);
          if (pathParts.length >= 2) {
            // This is a beach URL (e.g., /corfu/beach1), so it's browsing
            source = "browsing";
          } else {
            // This is an area URL (e.g., /corfu), so it's area exploration
            source = "area_explore";
          }
        } else {
          source = "browsing"; // From homepage without search
        }
      }

      // Track engagement with correct page_path context
      // Only pass queryHash if it exists (i.e., if this is from a search)
      analytics.trackBeachEngagement(beach.id, source, queryHash);
    }
  }, [beach]);

  // Fetch ALL siblings in same area, excluding current beach. The full list
  // powers the "All beaches in {area}" nav below for internal-link coverage;
  // the visual carousel slices the first 8 below.
  const { data: siblings = [] } = useQuery({
    queryKey: ["more-in-area", area, beachName],
    queryFn: async () => {
      if (!area || !beachName) return [] as Beach[];
      return fetchMoreInArea(area, beachName, 200);
    },
    enabled: !!area && !!beachName,
    staleTime: 5 * 60 * 1000,
  });

  // Progressive loading state - now that beach data is available
  const { shouldShowContent, handleImageLoad, handleImageError } = useProgressiveLoading(
    isLoading,
    !!beach?.photo_url,
    {
      contentDelay: 0, // Show content immediately
      imageDelay: 0, // Start image loading immediately to prevent layout shift
      enableProgressiveMode: false, // Disable progressive mode to always show image container
    }
  );

  // Ensure page scrolls to top when component mounts
  useEffect(() => {
    const scrollToTop = () => {
      // Scroll to top with multiple methods for compatibility
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Use requestAnimationFrame to ensure DOM is ready, then scroll once
    requestAnimationFrame(() => {
      scrollToTop();
    });
  }, []); // Only run once on mount

  // Note: Distance calculation removed since geolocation is not used on detail page

  // Action handlers
  const handleOpenInMaps = useCallback(() => {
    if (!beach) return;

    // Track conversion event
    analytics.event("beach_conversion", {
      beach_id: beach.id,
      action: "directions",
      source: "detail",
    });
    analytics.trackConversion();

    // Open maps directly based on device (iOS → Apple Maps, Android/Desktop → Google Maps)
    openInMaps({
      latitude: beach.latitude,
      longitude: beach.longitude,
      name: beach.name,
      area: beach.area,
    });
  }, [beach]);

  const handleShare = useCallback(async () => {
    if (!beach) return;

    // Track conversion event
    analytics.event("beach_conversion", {
      beach_id: beach.id,
      action: "share",
      source: "detail",
    });
    analytics.trackConversion();

    const shareData = {
      title: beach.name,
      text: `Check out ${beach.name} in ${beach.area}`,
      url: window.location.href,
    };

    // Try native share first (industry standard)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // User cancelled - don't show error, just return
        if ((error as Error).name !== "AbortError") {
          console.error("Share error:", error);
        }
        return;
      }
    }

    // Fallback: Copy to clipboard (simple and effective)
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Beach URL copied to clipboard",
      });
    } catch {
      // Final fallback: show simple dialog
      setIsShareDialogOpen(true);
    }
  }, [beach, toast]);

  const handleFeedback = useCallback(() => {
    if (!beach) return;

    const subject = `Feedback: ${beach.name} (${beach.slug})`;
    const body = `Hi,\n\nI'd like to provide feedback for the beach "${beach.name}" at ${beach.area}.\n\nFeedback:\n\n\nThank you!`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [beach]);

  // Handle back navigation - go to previous page if available, otherwise fallback to area or home
  const handleBackNavigation = useCallback(() => {
    // First try to use the stored navigation source (most reliable for mobile)
    const fallbackPath = area ? `/${generateAreaSlug(area)}` : "/";
    navigateBack(fallbackPath);
  }, [navigateBack, area]);

  // Group amenities by category
  const amenitiesByCategory = useMemo((): AmenitiesByCategory => {
    if (!beach?.amenities) return {};

    return beach.amenities.reduce((acc, amenity) => {
      const config = getAmenityConfig(amenity) || {
        label: amenity,
        icon: Users,
        color: "text-gray-600",
        category: "activities" as const,
      };

      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push({ key: amenity, ...config, category: config.category });

      return acc;
    }, {} as AmenitiesByCategory);
  }, [beach?.amenities]);

  // Progressive loading - show content immediately, image loads separately
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl md:max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="aspect-[16/9] w-full mb-6 rounded-xl" />
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <div className="flex gap-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  // Error or not found state
  if (error || !beach) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl md:max-w-5xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="py-16">
              <Waves className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-foreground mb-4">Beach Not Found</h1>
              <p className="text-muted-foreground mb-8">
                The beach you're looking for doesn't exist or isn't currently available.
              </p>
              <Button onClick={handleBackNavigation}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Directory
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const shouldShowReadMore = beach.description && beach.description.length > 200;
  const displayDescription =
    shouldShowReadMore && !isDescriptionExpanded
      ? beach.description.slice(0, 200) + "..."
      : beach.description;

  // Generate SEO data with benefit-focused meta tags
  const seoTitle = generateBeachMetaTitle(beach);
  const seoDescription = generateBeachMetaDescription(beach);
  const canonicalUrl = `https://beachesofgreece.com/${generateAreaSlug(beach.area)}/${beach.slug}`;

  // Generate optimized JSON-LD structured data
  const jsonLd = generateBeachWebPageSchema(beach, canonicalUrl);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph tags */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        {beach.photo_url && <meta property="og:image" content={beach.photo_url} />}
        <meta property="og:site_name" content="Beaches of Greece" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {beach.photo_url && <meta name="twitter:image" content={beach.photo_url} />}
      </Helmet>

      {/* JSON-LD structured data */}
      <JsonLdScript schema={jsonLd} id="beach-schema" />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-4xl md:max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb Navigation - at the top */}
          <div className="bg-background py-2 mb-2">
            <div className="max-w-4xl md:max-w-5xl mx-auto">
              <BreadcrumbsWithJsonLd
                items={[
                  { label: "Home", href: "/" },
                  { label: "Areas", href: "/areas" },
                  {
                    label: beach.area || "Unknown Area",
                    href: `/${generateAreaSlug(beach.area || "unknown")}`,
                  },
                  { label: beach.name }, // current
                ]}
              />
            </div>
          </div>

          {/* Back to results link */}
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-6 px-3 py-2 h-auto text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to results
          </Button>

          {/* Image Card - Always render to prevent layout shift */}
          <figure className="mb-6 w-full max-w-full overflow-hidden relative">
            {beach.photo_url ? (
              <>
                <OptimizedImage
                  src={beach.photo_url}
                  alt={generateBeachImageAltText(beach)}
                  width={800}
                  height={450}
                  className="w-full aspect-[16/9] rounded-xl shadow-lg"
                  priority={false} // Changed to false for progressive loading
                  loading="lazy" // Changed to lazy for progressive loading
                  placeholder="blur" // Use blur placeholder to prevent layout shift
                  placeholderPalette="default" // Use default beach-themed placeholder
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  useDetailSkeleton={false} // Use blur placeholder instead of skeleton
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  fallbackComponent={
                    <div className="w-full aspect-[16/9] bg-gradient-to-br from-ocean to-secondary rounded-xl shadow-lg flex items-center justify-center">
                      <Waves className="h-16 w-16 md:h-24 md:w-24 text-primary-foreground opacity-50" />
                    </div>
                  }
                />
                {/* Photo Attribution - positioned just outside the image */}
                <PhotoAttribution photoSource={beach.photo_source} className="z-10" />
              </>
            ) : (
              <div className="w-full aspect-[16/9] bg-gradient-to-br from-ocean to-secondary rounded-xl shadow-lg flex items-center justify-center">
                <Waves className="h-16 w-16 md:h-24 md:w-24 text-primary-foreground opacity-50" />
              </div>
            )}
          </figure>

          {/* Title & Actions - Show immediately when content is ready */}
          {shouldShowContent && (
            <div className="mb-8">
              {/* Title and Action Buttons in Same Row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                    {beach.name}
                  </h1>
                </div>

                {/* Icon-Only Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    onClick={handleOpenInMaps}
                    variant="cta"
                    size="icon"
                    className="h-9 w-9 md:h-10 md:w-10"
                    aria-label="Get directions"
                    title="Get directions"
                  >
                    <MapPin className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="cta"
                    size="icon"
                    onClick={handleShare}
                    className="h-9 w-9 md:h-10 md:w-10"
                    aria-label="Share this beach"
                    title="Share this beach"
                  >
                    <Share2 className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFeedback}
                    className="h-9 w-9 md:h-10 md:w-10"
                    aria-label="Send feedback"
                    title="Send feedback"
                  >
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Area and Verification Info Below Title */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Link
                  to={`/${generateAreaSlug(beach.area)}`}
                  aria-label={`View beaches in ${beach.area}`}
                  className="inline-flex items-center gap-2 text-sm md:text-base rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
                >
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-secondary" aria-hidden="true" />
                  <span className="font-medium">{beach.area}</span>
                </Link>
                <div
                  aria-label={`Information last verified ${beach.updated_at ? formatRelativeTime(beach.updated_at) : "recently"}`}
                  className="inline-flex items-center gap-2 text-sm md:text-base rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  role="status"
                >
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-secondary" aria-hidden="true" />
                  <span className="font-medium">
                    Verified {beach.updated_at ? formatRelativeTime(beach.updated_at) : "recently"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Overview - Show when content is ready */}
          {shouldShowContent && (
            <div className="space-y-8">
              {/* Divider between header/meta and first content section */}
              <hr className="border-neutral-200/30" />

              {/* At a Glance */}
              <section>
                <h2 className="text-2xl font-semibold mb-6">Summary</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Palmtree className="h-5 w-5 text-secondary" aria-hidden="true" />
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Beach Type</dt>
                      <dd className="text-sm">{typeLabels[beach.type] || beach.type}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Waves className="h-5 w-5 text-secondary" aria-hidden="true" />
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Wave Conditions</dt>
                      <dd className="text-sm">
                        {waveLabels[beach.wave_conditions] || beach.wave_conditions}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-secondary" aria-hidden="true" />
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Organization</dt>
                      <dd className="text-sm">{beach.organized ? "Organized" : "Unorganized"}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-secondary" aria-hidden="true" />
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Parking</dt>
                      <dd className="text-sm">{parkingLabels[beach.parking] || beach.parking}</dd>
                    </div>
                  </div>
                  {beach.blue_flag && (
                    <div className="flex items-center gap-3">
                      <Flag className="h-5 w-5 text-secondary" aria-hidden="true" />
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Certification</dt>
                        <dd className="text-sm">Blue Flag Certified</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </section>

              {/* Divider between sections */}
              {beach.description && <hr className="border-neutral-200/30" />}

              {/* About Section */}
              {beach.description && (
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Description</h2>
                  <div>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {displayDescription}
                    </p>
                    {shouldShowReadMore && (
                      <Button
                        variant="link"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="p-0 h-auto mt-2"
                      >
                        {isDescriptionExpanded ? "Read less" : "Read more"}
                      </Button>
                    )}
                  </div>
                </section>
              )}

              {/* Divider between sections */}
              {beach.amenities && beach.amenities.length > 0 && (
                <hr className="border-neutral-200/30" />
              )}

              {/* Amenities */}
              {beach.amenities && beach.amenities.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-6">Amenities</h2>
                  <div className="space-y-6">
                    {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
                      <div key={category}>
                        <h3 className="text-lg font-medium mb-3 capitalize">{category}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {amenities.map(({ key, label, icon: IconComponent }) => (
                            <div
                              key={key}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                              tabIndex={0}
                              role="button"
                              aria-label={`${label} available`}
                            >
                              <IconComponent
                                className="h-4 w-4 text-secondary"
                                aria-hidden={true}
                              />
                              <span className="text-sm font-medium">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>

        {/* More in Area Section — visual carousel, first 8 siblings */}
        {beach && siblings.length > 0 && (
          <MoreInArea
            area={{
              name: beach.area,
              slug: generateAreaSlug(beach.area),
            }}
            beaches={siblings.slice(0, 8)}
          />
        )}

        {/* All beaches in {area} — full text-only sibling list. Mirrors the
            pattern in Area.tsx and gives every beach detail page N-1 inlinks
            to its siblings, dramatically improving internal-link coverage for
            beaches that would otherwise sit outside the alphabetical-first 8. */}
        {beach && siblings.length > 0 && (
          <div className="max-w-4xl md:max-w-5xl mx-auto px-4">
            <nav
              aria-label={`All beaches in ${beach.area}`}
              className="mt-12 pt-8 border-t border-border/40"
            >
              <h2 className="text-lg font-semibold mb-4">All beaches in {beach.area}</h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      to={generateBeachUrl(sibling.area, sibling.slug)}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {sibling.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        <Footer />

        {/* Share Dialog */}
        {beach && (
          <ShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            url={typeof window !== "undefined" ? window.location.href : ""}
            title={beach.name}
            description={`Discover ${beach.name} in ${beach.area}, Greece`}
          />
        )}
      </div>
    </>
  );
};

export default BeachDetail;
