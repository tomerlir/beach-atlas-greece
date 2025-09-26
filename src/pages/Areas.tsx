import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Waves } from "lucide-react";
import { useAreasWithBeachCount } from "@/hooks/useAreas";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/OptimizedImage";
import PhotoAttribution from "@/components/PhotoAttribution";
import { CONTACT_EMAIL } from "@/lib/constants";
import heroImage from "@/assets/hero-beach.jpg";

const Areas = () => {
  const { data: areas = [], isLoading, error } = useAreasWithBeachCount();

  // Generate SEO data
  const seoTitle = "Greek Beach Areas | Beach Atlas";
  const seoDescription = "Explore beaches by area across Greece. Discover the best beaches in Corfu, Mykonos, Crete, and other beautiful Greek destinations.";
  const canonicalUrl = "https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/areas";

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Areas",
            "item": "https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/areas"
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": "Greek Beach Areas",
        "description": "A curated list of beach areas across Greece",
        "numberOfItems": areas.length,
        "itemListElement": areas.slice(0, 10).map((area, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Place",
            "name": area.name,
            "description": area.description || `Discover beaches in ${area.name}, Greece`,
            "url": `https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/${area.slug}`
          }
        }))
      }
    ]
  };

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
        <meta property="og:image" content="https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/hero-beach.jpg" />
        <meta property="og:site_name" content="Beach Atlas Greece" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content="https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/hero-beach.jpg" />
        
        {/* JSON-LD structured data */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative h-[50vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/30" />
          
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Explore Greek Beach Areas
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-8">
              Discover beaches organized by region across Greece. 
              From the famous islands to hidden mainland gems.
            </p>
          </div>
        </section>

        <main className="container mx-auto px-4 py-12">
          {/* Screen reader announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {!isLoading && !error && `${areas.length} areas found`}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse overflow-hidden border-0 bg-white shadow-soft">
                  {/* Image skeleton */}
                  <div className="aspect-video bg-gradient-ocean relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
                    {/* Badge skeleton */}
                    <div className="absolute top-3 right-3 h-6 w-20 bg-white/50 rounded-full"></div>
                    {/* Title skeleton */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="h-5 bg-white/50 rounded w-2/3"></div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-4/5"></div>
                      <div className="h-3 bg-muted rounded w-3/5"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 max-w-md mx-auto">
                <p className="text-destructive font-medium text-lg">Failed to load areas</p>
                <p className="text-muted-foreground mt-2">Please try again later</p>
              </div>
            </div>
          )}

          {/* Areas Grid */}
          {!isLoading && !error && (
            <>
              {areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {areas.map((area) => {
                    // Fallback component for when image fails to load
                    const fallbackComponent = (
                      <div className="w-full h-full bg-gradient-ocean flex items-center justify-center">
                        <Waves className="h-16 w-16 text-white opacity-60" />
                      </div>
                    );

                    return (
                      <Link 
                        key={area.id} 
                        to={`/${area.slug}`}
                        className="group block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
                        aria-label={`Explore beaches in ${area.name}`}
                      >
                        <Card className="h-full transition-all duration-300 hover:shadow-strong overflow-hidden border-0 bg-white shadow-soft hover:shadow-medium">
                          {/* Area Image */}
                          <div className="aspect-video bg-gradient-ocean relative overflow-hidden">
                            {area.hero_photo_url ? (
                              <OptimizedImage
                                src={area.hero_photo_url}
                                alt={`Beautiful beaches in ${area.name}, Greece`}
                                width={400}
                                height={225}
                                className="group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                quality={85}
                                fallbackComponent={fallbackComponent}
                              />
                            ) : (
                              fallbackComponent
                            )}
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                            
                            {/* Beach Count Badge */}
                            <div className="absolute top-3 right-3">
                              <Badge variant="outline" className="bg-white/95 text-foreground border-white/50 shadow-sm backdrop-blur-sm">
                                <MapPin className="h-3 w-3 mr-1" />
                                {area.beach_count} {area.beach_count === 1 ? 'beach' : 'beaches'}
                              </Badge>
                            </div>

                            {/* Area Name Overlay */}
                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="text-white font-bold text-lg drop-shadow-lg">
                                {area.name}
                              </h3>
                            </div>
                          </div>

                          <CardContent className="p-4">
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {area.description || `Discover the beautiful beaches of ${area.name}, Greece. From organized resorts to hidden gems waiting to be explored.`}
                            </p>
                            
                            {/* Photo Attribution */}
                            {area.hero_photo_source && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <PhotoAttribution photoSource={area.hero_photo_source} />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-muted/50 border border-border rounded-xl p-8 max-w-md mx-auto">
                    <p className="text-muted-foreground font-medium text-lg">No areas found</p>
                    <p className="text-muted-foreground mt-2">Check back later for new beach areas</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-muted py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-6 mb-4">
              <Link 
                to="/about" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </Link>
              <a 
                href={`mailto:${CONTACT_EMAIL}`} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Feedback
              </a>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Beaches of Greece . Discover the beauty of Greece.
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Information is for guidance only, please verify locally.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Areas;
