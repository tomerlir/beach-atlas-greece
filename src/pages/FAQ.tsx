import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CONTACT_EMAIL } from "@/lib/constants";
import { Helmet } from "react-helmet-async";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";
import OrganizationSchema from "@/components/OrganizationSchema";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JsonLdScript from "@/components/seo/JsonLdScript";

const FAQ = () => {
  // FAQ data structured for both UI and Schema.org
  const faqs = [
    {
      question: "What is Beaches of Greece?",
      answer:
        "Beaches of Greece is a comprehensive directory that helps you find the perfect Greek beach using natural language search. You can describe what you're looking for in plain language (like 'calm sandy beach with umbrellas near Santorini'), and we'll match you with beaches that meet your specific needs. Our database includes detailed, verified information about amenities, conditions, accessibility, and more.",
    },
    {
      question: "How do I search for beaches?",
      answer:
        "You can search for beaches in several ways: (1) Use natural language in the search bar - describe what you want like 'organized beach with parking and toilets', (2) Browse by area/region using our Areas page, (3) Use the interactive map to explore beaches geographically, or (4) Apply filters for specific features like Blue Flag certification, wave conditions, beach type, parking availability, and amenities.",
    },
    {
      question: "What does 'organized beach' mean?",
      answer:
        "An organized beach in Greece typically has commercial amenities like sun loungers, umbrellas for rent, lifeguards, and often beach bars or restaurants. Unorganized (or wild/natural) beaches are more pristine and undeveloped, with minimal or no facilities. Both types have their appeal - organized beaches offer convenience and services, while unorganized beaches provide a more natural, peaceful experience.",
    },
    {
      question: "What is Blue Flag certification?",
      answer:
        "Blue Flag is an international eco-certification awarded annually by the Foundation for Environmental Education (FEE). Beaches with Blue Flag certification meet strict criteria for water quality, environmental management, safety, and services. It's a reliable indicator of clean water, good facilities, and environmental responsibility. We display the Blue Flag badge on beaches that currently hold this certification.",
    },
    {
      question: "How accurate and current is your beach data?",
      answer:
        "We take data quality seriously. Every beach entry includes a 'verified_at' date showing when the information was last checked. Our data comes from multiple sources: online research, on-site visits, official tourism boards, and user feedback. We continuously update our database and display data freshness timestamps on each beach detail page. If you notice outdated or incorrect information, please contact us so we can verify and update it.",
    },
    {
      question: "Can I use this to find beaches near my current location?",
      answer:
        "Yes! Use the 'Near Me' feature to find beaches close to your current location. When you enable this feature, we'll request your location permission and sort beaches by distance. This is especially useful when you're already in Greece and looking for nearby beach options. Note: we only use your location when you explicitly enable this feature, and we never store or share your location data.",
    },
    {
      question: "What do the parking categories mean?",
      answer:
        "We categorize parking into four levels: (1) No Parking - you'll need to walk from a distance or use public transport, (2) Roadside Parking - limited parking along the road, (3) Small Parking Lot - dedicated parking area for 20-50 cars, and (4) Large Parking Lot - extensive parking facilities for 50+ vehicles. This helps you plan your visit, especially during peak season.",
    },
    {
      question: "How do wave condition ratings work?",
      answer:
        "Wave conditions are categorized as: Calm (minimal waves, ideal for families with young children), Moderate (some waves, suitable for most swimmers), Wavy (stronger waves, fun for more experienced swimmers), and Surfable (consistent waves suitable for surfing or bodyboarding). Keep in mind that conditions can vary by season and weather - these ratings represent typical conditions during summer months.",
    },
    {
      question: "Which areas/regions do you cover?",
      answer:
        "We strive to cover all major beach areas across Greece, including popular islands like Crete, Mykonos, Santorini, Corfu, Rhodes, Zakynthos, and many others, as well as mainland coastal regions. Our coverage is continuously expanding. Browse our Areas page to see the complete list of regions we cover, along with the number of beaches in each area.",
    },
    {
      question: "Can I suggest a beach to add to your database?",
      answer:
        "Absolutely! We welcome beach suggestions from locals and travelers. If you know of a beach that should be in our directory, please email us at info@beachesofgreece.com with the beach name, location, and any relevant details (amenities, access, special features). We'll research and add it to our database with proper verification.",
    },
    {
      question: "Is there a mobile app?",
      answer:
        "Currently, we're a mobile-optimized web application - no separate app download needed! Our website works seamlessly on smartphones and tablets through your browser. You can bookmark beachesofgreece.com to your home screen for quick access. We've designed the mobile experience with touch-friendly controls, fast loading, and offline support through our service worker.",
    },
    {
      question: "How can hotels or travel businesses integrate your beach recommendations?",
      answer:
        "We offer partnership integrations for accommodation providers, ferry companies, and travel services. You can embed our beach finder on your website, share pre-filtered search links with your guests, or use QR codes for lobby displays. We provide UTM tracking to measure engagement. Contact us at info@beachesofgreece.com for partner integration details and API access options.",
    },
    {
      question: "What does 'explainable results' mean?",
      answer:
        "When we show you beach recommendations, we explain exactly why each beach matches your search. For example, if you search for 'calm sandy beach with parking', we'll show you a summary like 'Showing 12 beaches: sandy beaches (all), calm waters (all), parking available (all)'. This transparency helps you understand that the results are based on verified data, not hidden algorithms or paid placements.",
    },
    {
      question: "Do you include accessibility information?",
      answer:
        "Yes, we track accessibility features where available, including wheelchair access, accessible toilets, beach wheelchairs (wheelchairs designed for sand/water), and paved pathways to the beach. However, accessibility data is still being expanded across our database. If you have accessibility information about a beach, please share it with us at info@beachesofgreece.com.",
    },
    {
      question: "Can I share specific beach recommendations with friends?",
      answer:
        "Yes! Each beach detail page has a Share button that lets you copy a direct link or share via social media. You can also share filtered search results by copying the URL from your browser - it preserves your search criteria and filters, making it easy to recommend beaches that match specific preferences.",
    },
  ];

  // Generate SEO data
  const seoTitle = "Frequently Asked Questions | Beaches of Greece";
  const seoDescription =
    "Find answers to common questions about using Beaches of Greece, understanding beach features, data accuracy, Blue Flag certification, and more.";
  const canonicalUrl = "https://beachesofgreece.com/faq";

  // Generate FAQ Schema for AI engines
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "Beaches of Greece - Frequently Asked Questions",
    description: seoDescription,
    url: canonicalUrl,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // WebPage schema - breadcrumb removed since BreadcrumbsWithJsonLd component handles it
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
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

        {/* Open Graph tags */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={`${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.jpg`}
        />
        <meta property="og:site_name" content="Beaches of Greece" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta
          name="twitter:image"
          content={`${import.meta.env.VITE_SITE_URL || "https://beachesofgreece.com"}/hero-background.jpg`}
        />
      </Helmet>

      {/* JSON-LD structured data */}
      <JsonLdScript schema={faqSchema} id="faq-schema" />
      <JsonLdScript schema={webPageSchema} id="faq-webpage-schema" />

      {/* Organization Schema for AI engines */}
      <OrganizationSchema />

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative h-[30vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ocean to-ocean-light" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl drop-shadow-lg opacity-90">
              Everything you need to know about finding Greek beaches
            </p>
          </div>
        </section>

        {/* Breadcrumb Navigation */}
        <div className="bg-background py-2">
          <div className="container mx-auto px-4">
            <BreadcrumbsWithJsonLd items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
          </div>
        </div>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <p className="text-muted-foreground text-lg mb-8 text-center">
              Have a question that's not answered here? Contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:text-primary/80 underline transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </p>

            <div className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <Collapsible
                  key={index}
                  className="bg-card border border-border rounded-lg px-6 shadow-soft"
                >
                  <CollapsibleTrigger className="flex justify-between items-center w-full text-left py-4 hover:opacity-80 transition-opacity group">
                    <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-12 p-8 bg-gradient-to-r from-ocean/10 to-ocean-light/10 border border-ocean/20 rounded-xl text-center">
              <h2 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h2>
              <p className="text-muted-foreground mb-6">
                We're here to help! Reach out to us and we'll get back to you as soon as possible.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Question%20about%20Beaches%20of%20Greece`}
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-soft hover:shadow-medium"
              >
                Contact Us
              </a>
            </div>

            {/* Related links - prevent dead ends */}
            <div className="mt-8">
              <Card className="border-0 bg-card shadow-soft">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">More to explore</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/guide">Beach Selection Guide</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/areas">Browse Areas</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/map">Open Map</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/ontology">Beach Data Ontology</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FAQ;
