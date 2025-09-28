import Header from "@/components/Header";
import { CONTACT_EMAIL } from "@/lib/constants";
import { Helmet } from "react-helmet-async";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";

const About = () => {
  // Generate SEO data
  const seoTitle = "About Greek Beaches - Beach Atlas Greece";
  const seoDescription = "Learn about our comprehensive directory of Greek beaches. Discover beaches across all Greek islands and mainland with detailed information, amenities, and Blue Flag certification.";
  const canonicalUrl = "https://beachesofgreece.com/about";

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": seoTitle,
    "description": seoDescription,
    "url": canonicalUrl,
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
        <meta property="og:image" content={`${import.meta.env.VITE_SITE_URL || 'https://beachesofgreece.com'}/hero-background.png`} />
        <meta property="og:site_name" content="Beach Atlas Greece" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={`${import.meta.env.VITE_SITE_URL || 'https://beachesofgreece.com'}/hero-background.png`} />
        
        {/* JSON-LD structured data */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative h-[35vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ocean to-ocean-light" />
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-8 drop-shadow-lg">
              About Greek Beaches
            </h1>
          </div>
        </section>

        {/* Breadcrumb Navigation - under hero */}
        <div className="bg-background py-2">
          <div className="container mx-auto px-4">
            <BreadcrumbsWithJsonLd items={[
              { label: "Home", href: "/" },
              { label: "About" } // current
            ]} />
          </div>
        </div>
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              Welcome to the most comprehensive directory of Greek beaches. Our mission is to help you 
              discover the perfect beach for your next Greek adventure, from the famous beaches of 
              Santorini and Mykonos to hidden gems scattered across the Greek islands.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">What We Offer</h2>
            
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Detailed information about beaches across all Greek islands and mainland</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Smart filtering by amenities, organization level, parking, and Blue Flag certification</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Location-based search to find beaches near you</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>High-quality photos and detailed descriptions</span>
              </li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">Blue Flag Certification</h2>
            
            <p className="text-muted-foreground mb-6">
              Blue Flag is an international certification awarded annually by the Foundation for Environmental Education (FEE). 
              Badge shown on this site indicates beaches certified as of the listed season/year.
              Look for the Blue Flag badge on beach cards to find these premium destinations.
            </p>
            
            <h2 id="credits" className="text-2xl font-semibold text-foreground mb-4">Credits</h2>
            
            <p className="text-muted-foreground mb-6">
              Our beach data is carefully curated from multiple sources including official tourism boards, 
              local authorities, and verified visitor information. We strive to keep all information 
              accurate and up-to-date.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            
            <p className="text-muted-foreground">
              Have suggestions for beaches we should add? Found incorrect information? We'd love to 
              hear from you! Send us your               <a 
                href={`mailto:${CONTACT_EMAIL}`} 
                className="text-primary hover:text-primary/80 underline transition-colors"
              >
                feedback
              </a>.
            </p>
          </div>
        </div>
      </main>
      </div>
    </>
  );
};

export default About;