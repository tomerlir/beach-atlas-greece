import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";
import OrganizationSchema from "@/components/OrganizationSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Waves, Car, Shield, Star, Sparkles, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";

const Guide = () => {
  const seoTitle = "How to Choose the Perfect Greek Beach | Beaches of Greece";
  const seoDescription =
    "Step-by-step guide to selecting the right Greek beach based on waves, sand type, amenities, parking, and accessibility. Includes examples and pro tips.";
  const canonicalUrl = "https://beachesofgreece.com/guide";

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Choose the Perfect Greek Beach",
    description: seoDescription,
    url: canonicalUrl,
    totalTime: "PT5M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: 0,
    },
    supply: [
      { "@type": "HowToSupply", name: "Your preferences (family, activities, vibe)" },
      { "@type": "HowToSupply", name: "Desired amenities (umbrellas, toilets, bar)" },
      { "@type": "HowToSupply", name: "Location or area in Greece" },
    ],
    tool: [
      { "@type": "HowToTool", name: "Beaches of Greece filters" },
      { "@type": "HowToTool", name: "Map view" },
    ],
    step: [
      {
        "@type": "HowToStep",
        name: "Pick your vibe and beach type",
        text: "Choose between sandy, pebbly, or mixed beaches. Decide if you want an organized beach with facilities or a natural, quiet one.",
        image: `${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.png`,
      },
      {
        "@type": "HowToStep",
        name: "Set wave and wind tolerance",
        text: "Families usually prefer calm waters. Surfers or adventurous swimmers may choose wavy or surfable conditions.",
      },
      {
        "@type": "HowToStep",
        name: "Decide on parking and accessibility",
        text: "If driving, filter by parking availability. Check accessibility options when needed.",
      },
      {
        "@type": "HowToStep",
        name: "Choose your area or search near you",
        text: "Pick an island/region or use Near Me to sort by distance.",
      },
      {
        "@type": "HowToStep",
        name: "Refine amenities",
        text: "Select amenities like lifeguard, beach bar, showers, or Blue Flag.",
      },
    ],
    image: [
      `${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.png`,
    ],
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoTitle,
    description: seoDescription,
    url: canonicalUrl,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={`${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.png`}
        />
        <meta property="og:site_name" content="Beach Atlas Greece" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta
          name="twitter:image"
          content={`${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.png`}
        />
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
      </Helmet>

      {/* Organization Schema for AI engines */}
      <OrganizationSchema />

      <div className="min-h-screen bg-background">
        <Header />

        <section className="relative h-[30vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ocean to-ocean-light" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              Beach Selection Guide
            </h1>
            <p className="text-lg md:text-xl drop-shadow-lg opacity-90">
              A quick, practical way to find your perfect Greek beach
            </p>
          </div>
        </section>

        <div className="bg-background py-2">
          <div className="container mx-auto px-4">
            <BreadcrumbsWithJsonLd items={[{ label: "Home", href: "/" }, { label: "Guide" }]} />
          </div>
        </div>

        <main className="container mx-auto px-4 py-12">
          {/* Intro card */}
          <div className="max-w-5xl mx-auto">
            <Card className="border-0 bg-card shadow-soft">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start md:items-center gap-4 md:gap-6 flex-col md:flex-row">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-ocean to-ocean-light text-white flex items-center justify-center shadow-medium">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                      A simple plan for the perfect beach
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Follow these quick steps to match your vibe, conditions, and must-have
                      amenities across Greece. It takes less than five minutes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-card/80">
                      ~5 min
                    </Badge>
                    <Badge variant="outline" className="bg-card/80">
                      Beginner friendly
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Steps grid */}
          <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden border-0 bg-card shadow-soft">
              <div className="absolute inset-0 bg-gradient-to-br from-ocean/10 to-ocean-light/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-ocean text-white flex items-center justify-center shadow-medium">
                    1
                  </div>
                  <h3 className="font-semibold text-lg m-0">Pick your vibe & type</h3>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Star className="h-5 w-5 mt-0.5 text-ocean" />
                  <p>
                    Choose <strong>sandy</strong> for comfort, <strong>pebbly</strong> for crystal
                    waters, or <strong>mixed</strong>. Prefer <strong>organized</strong> (amenities)
                    vs <strong>unorganized</strong> (natural).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-card shadow-soft">
              <div className="absolute inset-0 bg-gradient-to-br from-ocean/10 to-ocean-light/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-ocean text-white flex items-center justify-center shadow-medium">
                    2
                  </div>
                  <h3 className="font-semibold text-lg m-0">Set waves & wind</h3>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Waves className="h-5 w-5 mt-0.5 text-ocean" />
                  <p>
                    Families choose <em>calm</em>. Adventurous swimmers try <em>wavy</em> or{" "}
                    <em>surfable</em>. Conditions change with weather.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-card shadow-soft">
              <div className="absolute inset-0 bg-gradient-to-br from-ocean/10 to-ocean-light/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-ocean text-white flex items-center justify-center shadow-medium">
                    3
                  </div>
                  <h3 className="font-semibold text-lg m-0">Parking & access</h3>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Car className="h-5 w-5 mt-0.5 text-ocean" />
                  <p>
                    Filter by <strong>parking</strong> availability and check{" "}
                    <strong>accessibility</strong> options when needed.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-card shadow-soft">
              <div className="absolute inset-0 bg-gradient-to-br from-ocean/10 to-ocean-light/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-ocean text-white flex items-center justify-center shadow-medium">
                    4
                  </div>
                  <h3 className="font-semibold text-lg m-0">Choose area or Near Me</h3>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 text-ocean" />
                  <p>
                    Pick an island/region or use <strong>Near Me</strong> to sort by distance
                    instantly.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-card shadow-soft">
              <div className="absolute inset-0 bg-gradient-to-br from-ocean/10 to-ocean-light/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-ocean text-white flex items-center justify-center shadow-medium">
                    5
                  </div>
                  <h3 className="font-semibold text-lg m-0">Refine amenities</h3>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Shield className="h-5 w-5 mt-0.5 text-ocean" />
                  <p>
                    Add <strong>lifeguard</strong>, <strong>beach bar</strong>,{" "}
                    <strong>showers</strong>, or <strong>Blue Flag</strong> as priorities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Example searches chips */}
          <div className="max-w-5xl mx-auto mt-10">
            <Card className="border-0 bg-card shadow-soft">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Example searches</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="px-3 py-1 bg-muted/50">
                    calm sandy beach with umbrellas in Corfu
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 bg-muted/50">
                    unorganized beach with clear water near Naxos
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 bg-muted/50">
                    Blue Flag beach with parking in Crete
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 bg-muted/50">
                    family-friendly beach with lifeguard in Rhodes
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pro tips */}
          <div className="max-w-5xl mx-auto mt-6">
            <Card className="border-0 bg-card shadow-soft">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Pro tips</h3>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-1 text-ocean" />
                    Use the map to compare nearby options visually.
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <Car className="h-4 w-4 mt-1 text-ocean" />
                    Arrive early for easier parking at popular beaches.
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <Waves className="h-4 w-4 mt-1 text-ocean" />
                    Check wind/wave forecasts for sensitive choices.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Related links */}
          <div className="max-w-5xl mx-auto mt-8">
            <Card className="border-0 bg-card shadow-soft">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Continue exploring</h3>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/faq">Read the FAQ</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/areas">Browse Areas</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/map">Open the Map</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/ontology">Beach Data Ontology</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Guide;
