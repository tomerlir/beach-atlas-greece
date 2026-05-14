import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { generateAreaSlug } from "@/lib/utils";
import {
  getBestListBySlug,
  rankBeachesForList,
  BEST_LISTS,
  type RankedBeach,
} from "@/lib/best-lists";
import { generateBestListWebPageSchema, generateBestListFAQSchema } from "@/lib/structured-data";
import { Tables } from "@/integrations/supabase/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptimizedImage from "@/components/OptimizedImage";
import { BreadcrumbsWithJsonLd } from "@/components/breadcrumbs/BreadcrumbsWithJsonLd";
import JsonLdScript from "@/components/seo/JsonLdScript";
import NotFound from "@/pages/NotFound";
import { ChevronDown, Waves, ArrowRight } from "lucide-react";

type Beach = Tables<"beaches">;

const Best = () => {
  const { slug } = useParams<{ slug: string }>();
  const list = slug ? getBestListBySlug(slug) : null;

  // Fetch all active beaches once; rank/filter locally per list.
  // Using the shared ["beaches"] queryKey lets prerender seed this from
  // generate-routes.ts allBeaches without an extra fetch on SSR.
  const { data: beaches = [], isLoading } = useQuery({
    queryKey: ["beaches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beaches")
        .select("*")
        .eq("status", "ACTIVE")
        .order("name");
      if (error) throw error;
      return data as Beach[];
    },
    enabled: !!list,
    staleTime: 5 * 60 * 1000,
  });

  if (!list) return <NotFound />;

  const ranked: RankedBeach[] = rankBeachesForList(beaches, list);
  const canonicalUrl = `https://beachesofgreece.com/best/${list.slug}`;

  const itemListSchema = generateBestListWebPageSchema(list, ranked, canonicalUrl);
  const faqSchema = generateBestListFAQSchema(list, canonicalUrl);

  return (
    <>
      <Helmet>
        <title>{list.metaTitle}</title>
        <meta name="description" content={list.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={list.metaTitle} />
        <meta property="og:description" content={list.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Beaches of Greece" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={list.metaTitle} />
        <meta name="twitter:description" content={list.metaDescription} />
      </Helmet>

      <JsonLdScript schema={itemListSchema} id="best-list-schema" />
      <JsonLdScript schema={faqSchema} id="best-list-faq-schema" />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-4xl md:max-w-5xl mx-auto px-4 py-8">
          <div className="bg-background py-2 mb-2">
            <BreadcrumbsWithJsonLd
              items={[
                { label: "Home", href: "/" },
                { label: "Best Lists", href: "/best" },
                { label: list.h1 },
              ]}
            />
          </div>

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {list.h1}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{list.intro}</p>
          </header>

          {/* Methodology — E-E-A-T signal. Specific, not marketing. */}
          <section className="mb-10 p-5 bg-muted/40 border border-border/50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Methodology</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{list.methodology}</p>
          </section>

          {/* Ranked list */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : ranked.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No beaches currently match these criteria. Check back as our directory expands.
            </div>
          ) : (
            <section aria-labelledby="ranked-list-heading" className="mb-12">
              <h2 id="ranked-list-heading" className="text-2xl font-semibold mb-6">
                Top {ranked.length} beaches
              </h2>
              <ol className="space-y-4">
                {ranked.map(({ beach, rank, rationale }) => {
                  const beachUrl = `/${generateAreaSlug(beach.area)}/${beach.slug}`;
                  return (
                    <li
                      key={beach.id}
                      className="flex gap-4 p-4 bg-card border border-border/50 rounded-lg hover:shadow-soft transition-shadow"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-lg">
                        {rank}
                      </div>
                      <div className="flex-shrink-0 w-32 h-24 md:w-40 md:h-28 rounded-md overflow-hidden bg-muted">
                        {beach.photo_url ? (
                          <OptimizedImage
                            src={beach.photo_url}
                            alt={`${beach.name} in ${beach.area}, Greece`}
                            width={160}
                            height={112}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            placeholder="blur"
                            placeholderPalette="default"
                            fallbackComponent={
                              <div className="w-full h-full bg-gradient-to-br from-ocean to-secondary flex items-center justify-center">
                                <Waves className="h-8 w-8 text-primary-foreground/50" />
                              </div>
                            }
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-ocean to-secondary flex items-center justify-center">
                            <Waves className="h-8 w-8 text-primary-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-lg font-semibold">
                            <Link
                              to={beachUrl}
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              {beach.name}
                            </Link>
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{beach.area}, Greece</p>
                        {rationale && (
                          <p className="text-sm text-foreground/80 leading-relaxed">{rationale}</p>
                        )}
                        <Link
                          to={beachUrl}
                          className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                        >
                          Read full details <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* FAQ — visible accordion + matching FAQPage JSON-LD above */}
          <section aria-labelledby="best-faq-heading" className="mb-12">
            <h2 id="best-faq-heading" className="text-2xl font-semibold mb-6">
              Common questions
            </h2>
            <div className="space-y-3">
              {list.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-card border border-border rounded-lg px-5 shadow-soft"
                >
                  <summary className="flex justify-between items-center cursor-pointer list-none py-4 hover:opacity-80 transition-opacity">
                    <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                    <ChevronDown
                      className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180 flex-shrink-0"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="text-muted-foreground pb-4 leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Related lists — internal linking back into the /best cluster */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Explore other Greek beach lists</h2>
            <ul className="flex flex-wrap gap-2">
              {BEST_LISTS.filter((l) => l.slug !== list.slug).map((l) => (
                <li key={l.slug}>
                  <Link
                    to={`/best/${l.slug}`}
                    className="inline-block px-3 py-1.5 text-sm rounded-full border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                  >
                    {l.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Best;
