import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BEST_LISTS } from "@/lib/best-lists";
import { generateBestListsIndexSchema } from "@/lib/structured-data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { ArrowRight } from "lucide-react";

const BestIndex = () => {
  const canonicalUrl = "https://beachesofgreece.com/best";
  const metaTitle = "Best Beach Lists in Greece — Ranked by Verified Criteria";
  const metaDescription =
    "Curated, methodology-backed lists of the best Greek beaches by use case: family-friendly, Blue Flag, snorkeling, calm water, sandy, wild, and easy-access.";

  const schema = generateBestListsIndexSchema(BEST_LISTS, canonicalUrl);

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Beaches of Greece" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Helmet>

      <JsonLdScript schema={schema} id="best-lists-index-schema" />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-4xl md:max-w-5xl mx-auto px-4 py-8">
          <div className="bg-background py-2 mb-2">
            <BreadcrumbsWithJsonLd
              items={[{ label: "Home", href: "/" }, { label: "Best Lists" }]}
            />
          </div>

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Best Beach Lists in Greece
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Each list is a methodology-backed cut of our verified beach directory for a specific
              intent — family visits, snorkeling, calm swimming, and more. Rankings use structured
              fields (wave conditions, amenities, parking, Blue Flag status), not vibes.
            </p>
          </header>

          <ul className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {BEST_LISTS.map((list) => (
              <li key={list.slug}>
                <Link
                  to={`/best/${list.slug}`}
                  className="block h-full p-5 bg-card border border-border rounded-lg shadow-soft hover:shadow-md transition-shadow"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-2">{list.h1}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {list.metaDescription}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary">
                    View ranking <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BestIndex;
