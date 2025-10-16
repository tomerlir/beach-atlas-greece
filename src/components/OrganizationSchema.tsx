import { Helmet } from "react-helmet-async";

/**
 * Organization Schema Component
 * Provides structured data about the website/organization for AI engines and search engines.
 * This helps establish authority and improves visibility in AI-generated answers.
 */
const OrganizationSchema = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Beaches of Greece",
    alternateName: "Greek Beaches Directory",
    url: "https://beachesofgreece.com",
    logo: "https://beachesofgreece.com/logo.png",
    description:
      "Comprehensive directory of Greek beaches with detailed information about amenities, accessibility, and conditions. Find the perfect beach in Greece for your next visit.",
    foundingDate: "2024",
    sameAs: ["https://beachesofgreece.com"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "info@beachesofgreece.com",
      availableLanguage: ["English", "Greek"],
    },
    areaServed: {
      "@type": "Country",
      name: "Greece",
    },
    knowsAbout: [
      "Greek beaches",
      "Beach amenities",
      "Blue Flag beaches",
      "Beach accessibility",
      "Coastal tourism",
      "Greek islands",
      "Beach conditions",
      "Water sports locations",
    ],
    owns: {
      "@type": "Dataset",
      name: "Greek Beaches Database",
      description:
        "Comprehensive database of beaches across Greece including location, amenities, conditions, and accessibility information",
      url: "https://beachesofgreece.com/ontology",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Beaches of Greece",
    url: "https://beachesofgreece.com",
    description:
      "Find Greek beaches near you or by area—filter Blue Flag, parking, beach bars, toilets, wave conditions, and sand type. Plan your day in minutes.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://beachesofgreece.com/?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Beaches of Greece",
      url: "https://beachesofgreece.com",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
    </Helmet>
  );
};

export default OrganizationSchema;
