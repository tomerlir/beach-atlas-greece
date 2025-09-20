import { CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatRelativeTime } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

type Beach = Tables<'beaches'>;

interface DataFreshnessMetaProps {
  beach: Beach;
}

export const DataFreshnessMeta = ({ beach }: DataFreshnessMetaProps) => {
  // Compute display logic
  const displayLabel = beach.verified_at ? 'verified' : beach.updated_at ? 'updated' : null;
  const displayTime = beach.verified_at ?? beach.updated_at;

  // If no display label, render nothing
  if (!displayLabel || !displayTime) {
    return null;
  }

  const IconComponent = beach.verified_at ? CheckCircle : Clock;
  const exactTimestamp = new Date(displayTime).toLocaleString();
  const relativeTime = formatRelativeTime(displayTime);
  
  // Build aria-label for accessibility
  const ariaLabel = `Verification status: ${displayLabel} on ${exactTimestamp}`;

  // Color classes: blue for verified, green for updated
  const iconColorClass = beach.verified_at ? 'text-blue-600' : 'text-green-600';

  return (
    <div 
      className="flex items-center text-sm text-muted-foreground"
      aria-label={ariaLabel}
    >
      <IconComponent className={`h-4 w-4 mr-1.5 ${iconColorClass}`} aria-hidden="true" />
      <span>
        Beach info last {displayLabel} ·{" "}
        <time
          dateTime={displayTime}
          title={exactTimestamp}
          className="underline decoration-dotted underline-offset-2"
        >
          {relativeTime}
        </time>
      </span>
    </div>
  );
};
