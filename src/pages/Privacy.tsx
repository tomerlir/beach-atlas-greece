import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CONTACT_EMAIL } from "@/lib/constants";
import { Helmet } from "react-helmet-async";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";

const Privacy = () => {
  const seoTitle = "Privacy Policy - Beaches of Greece";
  const seoDescription = "Privacy policy describing strictly necessary technologies, cookieless analytics via Umami Cloud, data collected (page views, referrers, events), purposes, GDPR rights, retention, and how to change consent.";
  const canonicalUrl = "https://beachesofgreece.com/privacy";

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
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

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
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative h-[30vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ocean to-ocean-light" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">Privacy Policy</h1>
            <p className="text-lg md:text-xl drop-shadow-lg opacity-90">How we handle strictly necessary tech and cookieless analytics</p>
          </div>
        </section>

        <div className="bg-background py-2">
          <div className="container mx-auto px-4">
            <BreadcrumbsWithJsonLd items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
          </div>
        </div>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:marker:text-primary prose-a:text-primary hover:prose-a:underline prose-a:no-underline">
            <h1 className="!mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground !mt-0">
              Last updated: {new Date().toISOString().split('T')[0]}
            </p>

            <p>
              We value your privacy. This page explains which technologies are strictly necessary for the
              website to function and how our optional analytics work.
            </p>

            <h2>Strictly necessary (always on)</h2>
            <p>
              These technologies are essential for core functionality and are not used for advertising or user
              profiling:
            </p>
            <ul>
              <li>Single Page App runtime: routing, UI rendering, accessibility features</li>
              <li>Service Worker: offline caching and reliable asset delivery</li>
              <li>
                Local storage for consent choice (<code>analytics_consent</code>) so your preference persists
              </li>
              <li>
                Supabase authentication session (admin area only) - session cookies are only set when accessing admin features
              </li>
              <li>Security headers and HTTPS to protect data in transit</li>
            </ul>

            <h2>Analytics (optional, cookieless)</h2>
            <p>
              We use privacy-friendly, cookieless analytics provided by <strong>Umami Cloud</strong> to understand how
              the site is used and to improve features. Analytics only runs if you explicitly opt in from the consent
              banner or the <em>Privacy preferences</em> link in the footer.
            </p>

            <h3>What we track</h3>
            <p>
              When enabled, we track page views and usage to measure traffic and content performance. Our analytics
              implementation is documented in <code>src/lib/analytics.ts</code> and uses events to record key actions
              (e.g., search interactions, map engagement, session summaries).
            </p>

            <h3>Data collected by Umami</h3>
            <ul>
              <li>Page views (URL path) and navigation paths</li>
              <li>Referrer URL (the page you came from), where available</li>
              <li>Anonymous events such as searches, map interactions, and filter usage</li>
              <li>Non-identifying context such as timestamp and a random session identifier</li>
              <li>Technical metadata like browser, operating system, device type, viewport size, and language</li>
              <li>UTM parameters for campaign attribution when present</li>
              <li>
                Approximate location derived from IP at request time for aggregated statistics; IP addresses are not
                stored by our implementation
              </li>
            </ul>

            <h3>What we do not collect</h3>
            <ul>
              <li>No personal identifiers (no names, emails, precise location)</li>
              <li>No marketing cookies and no cross-site tracking</li>
              <li>No third-party advertising or profiling</li>
            </ul>

            <h3>Purpose and legal basis</h3>
            <p>
              The purpose is to understand website traffic and content performance so we can improve features and
              reliability. The legal basis under the GDPR is your <strong>consent</strong> (Article 6(1)(a)), which you
              may withdraw at any time.
            </p>

            <h3>Data retention</h3>
            <p>
              We retain analytics data for up to <strong>12 months</strong> in Umami. Retention is configurable; if we
              change this window, we will update this page. We do not sell or share analytics data for advertising.
            </p>

            <h2>Change or withdraw your consent</h2>
            <p>
              You can change your analytics preference at any time by clicking the <em>Privacy preferences</em> link in
              the site footer. Turning analytics off will stop further analytics events from being sent.
            </p>

            <h2>Your rights (GDPR)</h2>
            <ul>
              <li>Access your personal data</li>
              <li>Request deletion (erasure) of your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time (does not affect prior lawful processing)</li>
              <li>Lodge a complaint with your local supervisory authority</li>
            </ul>

            <h2>Data controller and processor</h2>
            <p>
              The data controller is Beaches of Greece. Umami Cloud provides analytics services as our data processor.
            </p>

            <h2>International transfers</h2>
            <p>
              Depending on your location and service infrastructure, analytics data may be processed outside your
              country. We rely on appropriate safeguards offered by our service providers.
            </p>

            <h2>Children</h2>
            <p>
              This site is not directed to children under 13, and we do not knowingly collect personal data from them.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy from time to time. The “Last updated” date above reflects the latest changes.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about this policy? Contact us at <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Privacy;


