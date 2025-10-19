import { useState, useEffect } from "react";

// Import the actual wink-nlp types
import type { default as WinkNLPFactory } from "wink-nlp";
import type { default as WinkNLPModel } from "wink-eng-lite-web-model";
import type { default as WinkDistance } from "wink-distance";

// Compromise.js types based on actual usage patterns
interface CompromiseDocument {
  lemma(): { text(): string };
  match(selector: string): { out(format: string): string[] };
}

// Compromise.js factory function type
type CompromiseFactory = (text: string) => CompromiseDocument;

interface NLPModules {
  winkNLP: typeof WinkNLPFactory;
  model: typeof WinkNLPModel;
  distance: typeof WinkDistance;
  compromise: CompromiseFactory;
}

interface UseLazyNLPReturn {
  nlp: NLPModules | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to lazily load NLP dependencies only when needed
 * This prevents the large NLP libraries from being included in the main bundle
 */
export const useLazyNLP = (): UseLazyNLPReturn => {
  const [nlp, setNlp] = useState<NLPModules | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadNLP = async () => {
      if (nlp || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import NLP dependencies
        const [winkNLPModule, modelModule, distanceModule, compromiseModule] = await Promise.all([
          import("wink-nlp"),
          import("wink-eng-lite-web-model"),
          import("wink-distance"),
          import("compromise"),
        ]);

        if (isMounted) {
          setNlp({
            winkNLP: winkNLPModule.default,
            model: modelModule.default,
            distance: distanceModule.default,
            compromise: compromiseModule.default,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to load NLP modules"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNLP();

    return () => {
      isMounted = false;
    };
  }, [nlp, isLoading]);

  return { nlp, isLoading, error };
};
