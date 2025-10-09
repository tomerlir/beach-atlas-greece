import React from 'react';
import { ExternalLink } from 'lucide-react';

interface PhotoAttributionProps {
  photoSource?: string;
  className?: string;
  compact?: boolean; // New prop for compact mode
}

/**
 * PhotoAttribution component for displaying proper photo credits
 * Follows industry standards for legal protection and aesthetic appeal
 * 
 * Expected photo_source format examples:
 * - "dronepicr, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0>, via Wikimedia Commons"
 * - "Photo by John Smith via Unsplash"
 * - "Image by Jane Doe, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0/>"
 */
const PhotoAttribution: React.FC<PhotoAttributionProps> = ({ 
  photoSource, 
  className = "",
  compact = false
}) => {
  if (!photoSource) return null;

  // Parse the attribution string to extract components
  const parseAttribution = (source: string) => {
    // Handle Creative Commons format: "author, CC BY 2.0 <license_url>, via source"
    const ccMatch = source.match(/^(.+?),\s*(CC\s+[^<]+)\s*<([^>]+)>,\s*via\s*(.+)$/);
    if (ccMatch) {
      return {
        author: ccMatch[1].trim(),
        license: ccMatch[2].trim(),
        licenseUrl: ccMatch[3].trim(),
        source: ccMatch[4].trim(),
        isCC: true
      };
    }

    // Handle simple format: "Photo by Author via Source"
    const simpleMatch = source.match(/^Photo\s+by\s+(.+?)\s+via\s+(.+)$/i);
    if (simpleMatch) {
      return {
        author: simpleMatch[1].trim(),
        source: simpleMatch[2].trim(),
        isCC: false
      };
    }

    // Handle format: "Author, License <url>"
    const licenseMatch = source.match(/^(.+?),\s*(.+?)\s*<([^>]+)>$/);
    if (licenseMatch) {
      return {
        author: licenseMatch[1].trim(),
        license: licenseMatch[2].trim(),
        licenseUrl: licenseMatch[3].trim(),
        isCC: licenseMatch[2].includes('CC'),
        source: undefined
      };
    }

    // Fallback: treat as simple author name
    return {
      author: source.trim(),
      isCC: false
    };
  };

  const attribution = parseAttribution(photoSource);

  // Compact mode for homepage cards - shows only author name with minimal styling
  if (compact) {
    return (
      <div className={`absolute bottom-1 right-1 bg-foreground/60 backdrop-blur-sm text-background text-[10px] px-1.5 py-0.5 rounded text-nowrap ${className}`}>
        <span className="text-background/90 truncate max-w-[80px] block">
          {attribution.author}
        </span>
      </div>
    );
  }

  // Full mode for detail pages - shows complete attribution
  return (
    <div className={`absolute bottom-2 right-2 bg-foreground/70 backdrop-blur-sm text-background text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-sm sm:rounded-md max-w-[calc(100%-1rem)] ${className}`}>
      <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
        <span className="text-background/90">
          {attribution.author}
        </span>
        
        {attribution.license && (
          <>
            <span className="text-background/70">•</span>
            {attribution.licenseUrl ? (
              <a
                href={attribution.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/90 hover:text-background underline decoration-dotted underline-offset-2 transition-colors"
                title={`View ${attribution.license} license`}
              >
                {attribution.license}
                <ExternalLink className="inline w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" />
              </a>
            ) : (
              <span className="text-background/70">{attribution.license}</span>
            )}
          </>
        )}
        
        {attribution.source && (
          <>
            <span className="text-background/70">•</span>
            <span className="text-background/70">via {attribution.source}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoAttribution;
