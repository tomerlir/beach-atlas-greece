import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BeachCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border-0 bg-card shadow-soft h-full">
      {/* Image Skeleton */}
      <div className="aspect-video bg-gradient-ocean relative overflow-hidden">
        <Skeleton className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
        
        {/* Badge Skeletons */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Skeleton className="h-6 w-20 bg-card/80" />
          <Skeleton className="h-6 w-16 bg-card/80" />
        </div>
        
        {/* Distance Badge Skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-16 bg-card/80" />
        </div>
      </div>

      <CardContent className="p-5">
        {/* Title & Location Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Parking Info Skeleton */}
        <div className="flex items-center mb-4 p-2 bg-muted/50 rounded-lg">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Amenities Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BeachCardSkeleton;
