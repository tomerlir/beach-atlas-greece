import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CONTACT_EMAIL } from "@/lib/constants";
import { Helmet } from "react-helmet-async";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";
import OrganizationSchema from "@/components/OrganizationSchema";
import { getAmenitiesByCategory } from "@/lib/amenities";
import { MapPin, Waves, Car, Shield, Clock, CheckCircle, AlertCircle, Info } from "lucide-react";
import JsonLdScript from "@/components/seo/JsonLdScript";

const Ontology = () => {
  // Generate SEO data
  const seoTitle = "Beach Data Ontology - Greek Beaches";
  const seoDescription =
    "Official definitions for beach data fields tracked by Beach Atlas Greece. Understand how we model beaches as structured data for explainable matches.";
  const canonicalUrl = "https://beachesofgreece.com/ontology";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Generate JSON-LD structured data for WebPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoTitle,
    description: seoDescription,
    url: canonicalUrl,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
  };

  // Dataset Schema - Critical for AI engines to understand our structured data
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Greek Beaches Comprehensive Database",
    description:
      "A comprehensive, structured database of beaches across Greece with verified information about location, amenities, accessibility, conditions, and environmental certifications. Each beach entry includes coordinates, type (sandy/pebbly/mixed), wave conditions, parking availability, organized/unorganized status, Blue Flag certification, and detailed amenities.",
    url: "https://beachesofgreece.com/ontology",
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    keywords: [
      "Greek beaches",
      "Greece",
      "beach database",
      "Blue Flag beaches",
      "beach amenities",
      "beach conditions",
      "coastal tourism",
      "travel data",
      "geographic data",
      "beach accessibility",
      "beach types",
      "wave conditions",
      "parking facilities",
      "organized beaches",
      "Greek islands",
      "mainland Greece",
    ],
    creator: {
      "@type": "Organization",
      name: "Beaches of Greece",
      url: "https://beachesofgreece.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Beaches of Greece",
      url: "https://beachesofgreece.com",
    },
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    spatialCoverage: {
      "@type": "Place",
      name: "Greece",
      geo: {
        "@type": "GeoShape",
        box: "34.8 19.3 41.7 29.6",
      },
    },
    temporalCoverage: "2024/..",
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://beachesofgreece.com/api/beaches",
      },
    ],
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Beach Type",
        description: "Surface type of the beach",
        value: "SANDY, PEBBLY, MIXED, OTHER",
      },
      {
        "@type": "PropertyValue",
        name: "Wave Conditions",
        description: "Typical wave conditions during summer season",
        value: "CALM, MODERATE, WAVY, SURFABLE",
      },
      {
        "@type": "PropertyValue",
        name: "Parking Availability",
        description: "Parking facilities near the beach",
        value: "NONE, ROADSIDE, SMALL_LOT, LARGE_LOT",
      },
      {
        "@type": "PropertyValue",
        name: "Organization Status",
        description: "Whether the beach has commercial amenities and services",
        value: "ORGANIZED, UNORGANIZED",
      },
      {
        "@type": "PropertyValue",
        name: "Blue Flag Certification",
        description: "International eco-certification status",
        value: "true/false with certification year",
      },
      {
        "@type": "PropertyValue",
        name: "Amenities",
        description: "Available facilities and services",
        value:
          "toilets, showers, umbrellas, sunbeds, beach_bar, restaurant, lifeguard, changing_rooms, playground, water_sports, wheelchair_access, accessible_toilets, beach_wheelchair, dogs_allowed",
      },
      {
        "@type": "PropertyValue",
        name: "Geographic Coordinates",
        description: "Precise location coordinates",
        value: "latitude, longitude",
      },
      {
        "@type": "PropertyValue",
        name: "Verification Date",
        description: "Date when beach information was last verified",
        value: "ISO 8601 date",
      },
    ],
    measurementTechnique:
      "Data collected through on-site visits, official tourism boards, environmental agencies, and community feedback. All entries include verification timestamps and source attribution.",
    isAccessibleForFree: true,
    inLanguage: ["en", "el"],
  };

  // Get amenities by category
  const facilities = getAmenitiesByCategory("facilities");
  const safety = getAmenitiesByCategory("safety");
  const services = getAmenitiesByCategory("services");
  const activities = getAmenitiesByCategory("activities");

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
        <meta
          property="og:image"
          content={`${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.png`}
        />
        <meta property="og:site_name" content="Beach Atlas Greece" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta
          name="twitter:image"
          content={`${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.png`}
        />
      </Helmet>

      {/* JSON-LD structured data */}
      <JsonLdScript schema={jsonLd} id="ontology-webpage-schema" />
      <JsonLdScript schema={datasetSchema} id="ontology-dataset-schema" />

      {/* Organization Schema for AI engines */}
      <OrganizationSchema />

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative h-[35vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ocean to-ocean-light" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              Beach Data Ontology
            </h1>
            <p className="text-xl md:text-2xl drop-shadow-lg">
              Official definitions for beach data fields
            </p>
          </div>
        </section>

        {/* Breadcrumb Navigation */}
        <div className="bg-background py-2">
          <div className="container mx-auto px-4">
            <BreadcrumbsWithJsonLd
              items={[
                { label: "Home", href: "/" },
                { label: "Ontology" }, // current
              ]}
            />
          </div>
        </div>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-lg text-muted-foreground mb-6">
                We model beaches as structured data so travelers can get explainable matches. This
                page defines the fields we verify and how we interpret them.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Version: Ontology v1</h3>
                    <p className="text-blue-800 text-sm">Last updated: {today}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Beach Fields */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
                <MapPin className="w-8 h-8 mr-3 text-primary" />
                Core Beach Fields
              </h2>

              <div className="grid gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary" />
                    Location & Identity
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Name</h4>
                      <p className="text-gray-600 text-sm">
                        Official beach name as recognized locally
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Area</h4>
                      <p className="text-gray-600 text-sm">
                        Geographic region or island where the beach is located
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Coordinates</h4>
                      <p className="text-gray-600 text-sm">
                        Latitude and longitude for precise location mapping
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Description</h4>
                      <p className="text-gray-600 text-sm">
                        Detailed description of the beach's characteristics and appeal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <Waves className="w-5 h-5 mr-2 text-primary" />
                    Beach Characteristics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Type</h4>
                      <p className="text-gray-600 text-sm">
                        Classification: Sandy, Pebbly, Mixed, or Other
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Wave Conditions</h4>
                      <p className="text-gray-600 text-sm">
                        Typical wave intensity: Calm, Moderate, Wavy, or Surfable
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Organization Level</h4>
                      <p className="text-gray-600 text-sm">
                        Whether the beach has organized facilities (sunbeds, umbrellas, services)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Blue Flag Certification</h4>
                      <p className="text-gray-600 text-sm">
                        International environmental certification for water quality and safety
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <Car className="w-5 h-5 mr-2 text-primary" />
                    Access & Parking
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Parking</h4>
                      <p className="text-gray-600 text-sm">
                        Parking availability: None, Roadside, Small lot, or Large lot
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Amenities */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-primary" />
                Amenities & Services
              </h2>

              <div className="grid gap-6">
                {/* Facilities */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Facilities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {facilities.map((amenity) => (
                      <div key={amenity.id} className="flex items-start">
                        <amenity.icon className="w-4 h-4 mr-2 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{amenity.label}</span>
                          <p className="text-xs text-gray-600 mt-1">
                            {amenity.id === "sunbeds" && "Rental sunbeds available for beachgoers"}
                            {amenity.id === "umbrellas" &&
                              "Shade umbrellas available for rent or use"}
                            {amenity.id === "parking" &&
                              "Vehicle parking facilities near the beach"}
                            {amenity.id === "showers" &&
                              "Freshwater shower facilities for rinsing off"}
                            {amenity.id === "toilets" && "Public restroom facilities available"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Safety</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {safety.map((amenity) => (
                      <div key={amenity.id} className="flex items-start">
                        <amenity.icon className="w-4 h-4 mr-2 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{amenity.label}</span>
                          <p className="text-xs text-gray-600 mt-1">
                            {amenity.id === "lifeguard" &&
                              "Professional lifeguard services during operating hours"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((amenity) => (
                      <div key={amenity.id} className="flex items-start">
                        <amenity.icon className="w-4 h-4 mr-2 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{amenity.label}</span>
                          <p className="text-xs text-gray-600 mt-1">
                            {amenity.id === "beach_bar" &&
                              "Beachside bar serving drinks and light refreshments"}
                            {amenity.id === "taverna" &&
                              "Traditional Greek restaurant serving local cuisine"}
                            {amenity.id === "food" &&
                              "Food and beverage options available at or near the beach"}
                            {amenity.id === "music" &&
                              "Music entertainment or background music at the beach"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Activities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.map((amenity) => (
                      <div key={amenity.id} className="flex items-start">
                        <amenity.icon className="w-4 h-4 mr-2 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{amenity.label}</span>
                          <p className="text-xs text-gray-600 mt-1">
                            {amenity.id === "snorkeling" &&
                              "Underwater exploration with snorkeling gear"}
                            {amenity.id === "water_sports" &&
                              "Water-based recreational activities (jet skiing, windsurfing, etc.)"}
                            {amenity.id === "family_friendly" &&
                              "Suitable and safe environment for families with children"}
                            {amenity.id === "boat_trips" &&
                              "Boat excursions and tours departing from the beach"}
                            {amenity.id === "fishing" &&
                              "Fishing activities permitted or fishing spots available"}
                            {amenity.id === "photography" && "Scenic views and photo opportunities"}
                            {amenity.id === "hiking" &&
                              "Hiking trails accessible from or near the beach"}
                            {amenity.id === "birdwatching" &&
                              "Bird watching opportunities in the area"}
                            {amenity.id === "cliff_jumping" &&
                              "Cliff jumping or diving opportunities available"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Data Quality & Verification */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
                <CheckCircle className="w-8 h-8 mr-3 text-primary" />
                Data Quality & Verification
              </h2>

              <div className="grid gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Verification Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">Verified</h4>
                        <p className="text-gray-600 text-sm">
                          Data has been verified through a combination of online research, on-site
                          visits, or official local tourism boards
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">Unverified</h4>
                        <p className="text-gray-600 text-sm">
                          Data collected from public sources, pending verification
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Data Sources</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Online Research</h4>
                      <p className="text-gray-600 text-sm">
                        Comprehensive online research from multiple sources
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">On-site Visits</h4>
                      <p className="text-gray-600 text-sm">
                        Direct observation and measurement by our team
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Official Local Sources</h4>
                      <p className="text-gray-600 text-sm">
                        Tourism boards, local authorities, Blue Flag Foundation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Metadata */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
                <Clock className="w-8 h-8 mr-3 text-primary" />
                Metadata
              </h2>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Created At</h4>
                    <p className="text-gray-600 text-sm">
                      Timestamp when the beach record was first created
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Updated At</h4>
                    <p className="text-gray-600 text-sm">
                      Timestamp of the most recent data update
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Verified At</h4>
                    <p className="text-gray-600 text-sm">
                      Timestamp of last verification (if applicable)
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Source</h4>
                    <p className="text-gray-600 text-sm">Primary source of the beach information</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Status</h4>
                    <p className="text-gray-600 text-sm">
                      Current status: Active, Pending, or Archived
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Suggest a Fix */}
            <section className="mb-12">
              <div className="bg-gradient-to-r from-ocean/10 to-ocean-light/10 border border-ocean/20 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Suggest a Fix</h2>
                <p className="text-muted-foreground mb-6">
                  Found incorrect information or want to suggest improvements to our data model? We
                  welcome your feedback to help us maintain the highest data quality standards.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Ontology%20Feedback&body=Please%20describe%20your%20suggestion%20or%20correction%20here...`}
                  className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Send Feedback
                </a>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Ontology;
