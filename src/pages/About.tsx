import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CONTACT_EMAIL } from "@/lib/constants";
import { Helmet } from "react-helmet-async";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";
import OrganizationSchema from "@/components/OrganizationSchema";
import { Link } from "react-router-dom";
import JsonLdScript from "@/components/seo/JsonLdScript";

const About = () => {
  // Generate SEO data
  const seoTitle = "About Us | Verified Greek Beach Data & Smart Search";
  const seoDescription =
    "Discover how Beaches of Greece uses AI-powered natural language search, verified data & transparent matching to help you find perfect beaches across Greece.";
  const canonicalUrl = "https://beachesofgreece.com/about";

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoTitle,
    description: seoDescription,
    url: canonicalUrl,
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

      <JsonLdScript schema={jsonLd} id="about-schema" />

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
              About Beaches of Greece
            </h1>
            <p className="text-xl md:text-2xl drop-shadow-lg opacity-90">
              AI-Concierge of Greek beaches with verified data and explainable matches
            </p>
          </div>
        </section>

        {/* Breadcrumb Navigation - under hero */}
        <div className="bg-background py-2">
          <div className="container mx-auto px-4">
            <BreadcrumbsWithJsonLd
              items={[
                { label: "Home", href: "/" },
                { label: "About" }, // current
              ]}
            />
          </div>
        </div>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-6">
                Beaches of Greece is a comprehensive platform that helps travelers find the perfect
                Greek beach through natural language search and verified data. Instead of browsing
                through generic beach lists, you can describe what you're looking for in plain
                language, and we'll match you with beaches that meet your specific needs.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4">What We Do</h2>

              <ul className="space-y-4 text-muted-foreground mb-8">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-foreground">Natural Language Search</strong>
                    <p className="text-sm mt-1">
                      Describe what you want in plain language and get precise beach recommendations
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-foreground">Verified Beach Data</strong>
                    <p className="text-sm mt-1">
                      Every beach entry includes verification dates and quality standards
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-foreground">Comprehensive Coverage</strong>
                    <p className="text-sm mt-1">
                      Striving to cover all named beaches across Greek islands and mainland, with
                      detailed information about amenities, conditions, and access
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-foreground">Interactive Maps</strong>
                    <p className="text-sm mt-1">
                      Browse beaches on interactive maps with detailed preview cards
                    </p>
                  </div>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4">How It Works</h2>

              <div className="bg-gradient-to-r from-ocean/10 to-ocean-light/10 border border-ocean/20 rounded-lg p-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      1
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">Describe what you want</h3>
                      <p className="text-sm text-muted-foreground">
                        Type in plain language: "calm sandy beach with umbrellas in Santorini"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      2
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        We translate to verified filters
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Your request becomes structured filters: type=sandy, waves=calm,
                        amenities=umbrellas, area=Santorini
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      3
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">Get explainable results</h3>
                      <p className="text-sm text-muted-foreground">
                        Each result comes with a "why these beaches" explanation based on verified
                        data
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Data Quality & Verification
              </h2>

              <p className="text-muted-foreground mb-4">
                Every beach in our database comes with transparent verification. We collect data
                through online research, on-site visits, and official local tourism boards. We track
                when data was last verified and maintain strict quality standards. Our{" "}
                <strong>verified_at</strong> dates ensure you know exactly how fresh the information
                is.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Blue Flag Certification</h3>
                <p className="text-blue-800 text-sm">
                  Blue Flag is an international certification awarded annually by the Foundation for
                  Environmental Education (FEE). Badge shown on this site indicates beaches
                  certified as of the listed season/year. Look for the Blue Flag badge on beach
                  cards to find these premium destinations.
                </p>
              </div>

              <p className="text-muted-foreground mb-6">
                For complete details on our data model and verification process, visit our{" "}
                <Link
                  to="/ontology"
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  Beach Data Ontology
                </Link>{" "}
                page.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4">For Partners</h2>

              <p className="text-muted-foreground mb-4">
                Accommodation providers, ferry companies, and travel services can easily integrate
                our beach recommendations with simple embeds. We offer link/QR/widget solutions with
                UTM tracking to help your guests find their perfect beach.
              </p>

              <div className="bg-gradient-to-r from-ocean/10 to-ocean-light/10 border border-ocean/20 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-foreground mb-2">Partner Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started with simple embeds that pre-fill search queries and track completed
                  beach matches (CBM) for your guests. Perfect for hotel concierges, travel agents,
                  and ferry operators.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Partner%20Integration%20Inquiry&body=Hi,%20I'm%20interested%20in%20integrating%20Beaches%20of%20Greece%20for%20my%20travel%20business...`}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  Get Partner Access
                </a>
              </div>

              <h2 id="credits" className="text-2xl font-semibold text-foreground mb-4">
                Credits
              </h2>

              <p className="text-muted-foreground mb-4">
                Our beach data is carefully curated through online research, on-site visits, and
                official local tourism boards. We maintain detailed records of when each beach was
                last verified.
              </p>

              <p className="text-muted-foreground mb-6">
                Every beach entry includes verification dates and quality standards. We strive to
                keep all information accurate and up-to-date with transparent{" "}
                <Link
                  to="/ontology"
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  data quality standards
                </Link>
                .
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>

              <p className="text-muted-foreground">
                Have suggestions for beaches we should add? Found incorrect information? We'd love
                to hear from you! Send us your{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  feedback
                </a>
                .
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
