import { Skeleton } from "@/components/ui/skeleton";
import { Waves } from "lucide-react";

interface DetailImageSkeletonProps {
  className?: string;
}

const DetailImageSkeleton = ({ className }: DetailImageSkeletonProps) => {
  return (
    <div className={`w-full aspect-[16/9] rounded-xl shadow-lg overflow-hidden ${className || ""}`}>
      {/* Animated gradient background */}
      <div className="relative w-full h-full bg-gradient-to-br from-ocean via-ocean-light to-secondary">
        {/* Animated overlay for loading effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Waves className="h-16 w-16 mx-auto mb-2 opacity-60 animate-bounce" />
            <div className="text-sm opacity-80">Loading image...</div>
          </div>
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse" />
      </div>
    </div>
  );
};

export default DetailImageSkeleton;
