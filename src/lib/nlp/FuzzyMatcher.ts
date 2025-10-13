/**
 * Advanced Fuzzy Matching Module
 * Provides sophisticated string similarity and matching algorithms
 */

import distance from 'wink-distance';

export interface MatchResult {
  text: string;
  score: number;
  method: 'exact' | 'fuzzy' | 'phonetic' | 'semantic';
  confidence: number;
}

export interface FuzzyMatchOptions {
  threshold?: number;
  maxResults?: number;
  methods?: ('exact' | 'fuzzy' | 'phonetic' | 'semantic')[];
  caseSensitive?: boolean;
}

export class FuzzyMatcher {
  private static instance: FuzzyMatcher;
  
  // Phonetic patterns for Greek place names
  private phoneticPatterns = new Map<string, string[]>([
    ['crete', ['kriti', 'crete', 'kreta']],
    ['corfu', ['kerkyra', 'corfu', 'kerkira']],
    ['mykonos', ['mykonos', 'mikonos', 'mykono']],
    ['santorini', ['santorini', 'thira', 'thera']],
    ['rhodes', ['rhodes', 'rodos', 'rodes']],
    ['zakynthos', ['zakynthos', 'zante', 'zakinthos']],
    ['kefalonia', ['kefalonia', 'kephalonia', 'kefallonia']],
    ['paros', ['paros', 'paro']],
    ['naxos', ['naxos', 'naxo']],
    ['ios', ['ios', 'io']],
    ['milos', ['milos', 'milo']],
    ['sifnos', ['sifnos', 'sifno']],
    ['folegandros', ['folegandros', 'folegandro']],
    ['amorgos', ['amorgos', 'amorgo']],
    ['skiathos', ['skiathos', 'skiatos']],
    ['skopelos', ['skopelos', 'skopelo']],
    ['alonissos', ['alonissos', 'aloniso']],
    ['lesbos', ['lesbos', 'lesbo', 'mytilene']],
    ['chios', ['chios', 'chio', 'khios']],
    ['samos', ['samos', 'samo']],
    ['kos', ['kos', 'coo']],
    ['patmos', ['patmos', 'patmo']],
    ['syros', ['syros', 'suro']],
    ['tinos', ['tinos', 'tino']],
    ['andros', ['andros', 'andro']],
    ['kea', ['kea', 'tzia']],
    ['kythnos', ['kythnos', 'kythno']]
  ]);

  // Semantic similarity groups
  private semanticGroups = new Map<string, string[]>([
    ['beach', ['beach', 'beaches', 'shore', 'coast', 'coastal', 'seaside', 'waterfront']],
    ['sandy', ['sandy', 'sand', 'white sand', 'golden sand', 'soft sand']],
    ['pebbly', ['pebbly', 'pebble', 'pebbles', 'stone', 'stony', 'rocky']],
    ['calm', ['calm', 'still', 'peaceful', 'quiet', 'gentle', 'flat', 'shallow']],
    ['wavy', ['wavy', 'waves', 'rough', 'choppy', 'windy', 'strong waves']],
    ['parking', ['parking', 'car park', 'lot', 'space', 'spaces']],
    ['lifeguard', ['lifeguard', 'lifeguards', 'safety', 'rescue', 'patrol']],
    ['restaurant', ['restaurant', 'taverna', 'tavernas', 'food', 'dining', 'eat']],
    ['bar', ['bar', 'bars', 'beach bar', 'drinks', 'cocktails']],
    ['snorkeling', ['snorkeling', 'snorkelling', 'snorkel', 'diving', 'underwater']],
    ['photography', ['photography', 'photos', 'pictures', 'instagram', 'scenic', 'picturesque']]
  ]);

  private constructor() {}

  public static getInstance(): FuzzyMatcher {
    if (!FuzzyMatcher.instance) {
      FuzzyMatcher.instance = new FuzzyMatcher();
    }
    return FuzzyMatcher.instance;
  }

  /**
   * Find best matches for a query against a list of candidates
   */
  public findMatches(
    query: string, 
    candidates: string[], 
    options: FuzzyMatchOptions = {}
  ): MatchResult[] {
    const {
      threshold = 0.6,
      maxResults = 5,
      methods = ['exact', 'fuzzy', 'phonetic', 'semantic'],
      caseSensitive = false
    } = options;

    // Handle null/undefined input gracefully
    if (!query || typeof query !== 'string') {
      query = '';
    }

    const results: MatchResult[] = [];
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    for (const candidate of candidates) {
      const normalizedCandidate = caseSensitive ? candidate : candidate.toLowerCase();
      
      // Exact match
      if (methods.includes('exact') && normalizedQuery === normalizedCandidate) {
        results.push({
          text: candidate,
          score: 1.0,
          method: 'exact',
          confidence: 1.0
        });
        continue;
      }

      // Fuzzy match
      if (methods.includes('fuzzy')) {
        const fuzzyScore = this.calculateFuzzyScore(normalizedQuery, normalizedCandidate);
        if (fuzzyScore >= threshold) {
          results.push({
            text: candidate,
            score: fuzzyScore,
            method: 'fuzzy',
            confidence: fuzzyScore
          });
        }
      }

      // Phonetic match
      if (methods.includes('phonetic')) {
        const phoneticScore = this.calculatePhoneticScore(normalizedQuery, normalizedCandidate);
        if (phoneticScore >= threshold) {
          results.push({
            text: candidate,
            score: phoneticScore,
            method: 'phonetic',
            confidence: phoneticScore
          });
        }
      }

      // Semantic match
      if (methods.includes('semantic')) {
        const semanticScore = this.calculateSemanticScore(normalizedQuery, normalizedCandidate);
        if (semanticScore >= threshold) {
          results.push({
            text: candidate,
            score: semanticScore,
            method: 'semantic',
            confidence: semanticScore
          });
        }
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Calculate fuzzy matching score using multiple algorithms
   */
  private calculateFuzzyScore(query: string, candidate: string): number {
    try {
      // Use wink-distance for multiple similarity measures - correct API usage
      const jaroScore = 1 - distance.string.jaro(query, candidate); // Convert distance to similarity
      const jaroWinklerScore = 1 - distance.string.jaroWinkler(query, candidate); // Convert distance to similarity
      const levenshteinScore = 1 - (distance.string.levenshtein(query, candidate) / Math.max(query.length, candidate.length));
      const jaccardScore = distance.set.jaccard(new Set(query.split('')), new Set(candidate.split('')));
      
      // Weighted average of different algorithms
      const weightedScore = (
        jaroWinklerScore * 0.4 +
        jaroScore * 0.3 +
        levenshteinScore * 0.2 +
        jaccardScore * 0.1
      );

      return Math.max(0, Math.min(1, weightedScore));
    } catch (error) {
      console.warn('Fuzzy score calculation failed:', error);
      // Fallback to simple string similarity
      const maxLength = Math.max(query.length, candidate.length);
      if (maxLength === 0) return 0;
      const commonChars = query.split('').filter(char => candidate.includes(char)).length;
      return commonChars / maxLength;
    }
  }

  /**
   * Calculate phonetic matching score
   */
  private calculatePhoneticScore(query: string, candidate: string): number {
    // Check if query matches any phonetic variations of candidate
    for (const [base, variations] of this.phoneticPatterns) {
      if (base === candidate) {
        for (const variation of variations) {
          if (variation === query) {
            return 0.95;
          }
          // Also check fuzzy match within phonetic group
          const fuzzyScore = this.calculateFuzzyScore(query, variation);
          if (fuzzyScore > 0.8) {
            return fuzzyScore * 0.9; // Slightly lower confidence for phonetic matches
          }
        }
      }
    }

    return 0;
  }

  /**
   * Calculate semantic similarity score
   */
  private calculateSemanticScore(query: string, candidate: string): number {
    // Check if query and candidate are in the same semantic group
    for (const [group, words] of this.semanticGroups) {
      const queryInGroup = words.some(word => word === query || query.includes(word));
      const candidateInGroup = words.some(word => word === candidate || candidate.includes(word));
      
      if (queryInGroup && candidateInGroup) {
        return 0.9;
      }
    }

    // Check for partial semantic matches
    for (const [group, words] of this.semanticGroups) {
      const queryMatch = words.find(word => query.includes(word));
      const candidateMatch = words.find(word => candidate.includes(word));
      
      if (queryMatch && candidateMatch && queryMatch === candidateMatch) {
        return 0.8;
      }
    }

    return 0;
  }

  /**
   * Find the best single match
   */
  public findBestMatch(
    query: string, 
    candidates: string[], 
    options: FuzzyMatchOptions = {}
  ): MatchResult | null {
    const matches = this.findMatches(query, candidates, { ...options, maxResults: 1 });
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Check if two strings are similar enough to be considered a match
   */
  public isMatch(query: string, candidate: string, threshold: number = 0.7): boolean {
    const bestMatch = this.findBestMatch(query, [candidate], { threshold });
    return bestMatch !== null;
  }

  /**
   * Add custom phonetic patterns
   */
  public addPhoneticPattern(base: string, variations: string[]): void {
    this.phoneticPatterns.set(base.toLowerCase(), variations.map(v => v.toLowerCase()));
  }

  /**
   * Add custom semantic groups
   */
  public addSemanticGroup(group: string, words: string[]): void {
    this.semanticGroups.set(group.toLowerCase(), words.map(w => w.toLowerCase()));
  }

  /**
   * Get all phonetic variations for a word
   */
  public getPhoneticVariations(word: string): string[] {
    const normalized = word.toLowerCase();
    for (const [base, variations] of this.phoneticPatterns) {
      if (base === normalized) {
        return variations;
      }
    }
    return [word];
  }

  /**
   * Get semantic group for a word
   */
  public getSemanticGroup(word: string): string | null {
    const normalized = word.toLowerCase();
    for (const [group, words] of this.semanticGroups) {
      if (words.includes(normalized)) {
        return group;
      }
    }
    return null;
  }

  /**
   * Expand query with semantic and phonetic variations
   */
  public expandQuery(query: string): string[] {
    const variations = new Set<string>([query]);
    
    // Add phonetic variations
    const phoneticVariations = this.getPhoneticVariations(query);
    phoneticVariations.forEach(variation => variations.add(variation));
    
    // Add semantic variations
    const semanticGroup = this.getSemanticGroup(query);
    if (semanticGroup) {
      const groupWords = this.semanticGroups.get(semanticGroup) || [];
      groupWords.forEach(word => variations.add(word));
    }
    
    return Array.from(variations);
  }
}
