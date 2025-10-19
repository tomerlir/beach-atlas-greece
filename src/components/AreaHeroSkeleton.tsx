import { Skeleton } from "@/components/ui/skeleton";
import heroImage from "@/assets/hero-background.png";

const AreaHeroSkeleton = () => {
  return (
    <section className="relative h-[35vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        {/* Title skeleton */}
        <div className="mb-8">
          <Skeleton className="h-12 md:h-16 w-96 md:w-[32rem] mx-auto bg-white/20 animate-pulse" />
        </div>

        {/* Search bar skeleton - only show if we're loading an area (not 404) */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Skeleton className="h-12 w-full bg-white/20 animate-pulse rounded-lg" />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Skeleton className="h-6 w-6 bg-white/30 rounded" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AreaHeroSkeleton;
