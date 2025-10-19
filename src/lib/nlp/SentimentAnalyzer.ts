/**
 * Sentiment Analysis Module
 * Analyzes user intent and sentiment in beach search queries
 * Updated to work without TextProcessor dependency
 */

export interface SentimentResult {
  polarity: "positive" | "negative" | "neutral";
  confidence: number;
  intent: "search" | "preference" | "question" | "complaint" | "praise";
  intensity: "low" | "medium" | "high";
  keywords: string[];
}

export interface IntentAnalysis {
  primaryIntent: "search" | "preference" | "question" | "complaint" | "praise";
  secondaryIntents: string[];
  confidence: number;
  modifiers: string[];
}

export class SentimentAnalyzer {
  private static instance: SentimentAnalyzer;

  // Sentiment lexicons
  private positiveWords = new Set([
    "best",
    "great",
    "excellent",
    "awesome",
    "amazing",
    "fantastic",
    "wonderful",
    "perfect",
    "beautiful",
    "stunning",
    "breathtaking",
    "incredible",
    "outstanding",
    "superb",
    "magnificent",
    "spectacular",
    "gorgeous",
    "lovely",
    "nice",
    "good",
    "top",
    "popular",
    "famous",
    "recommended",
    "suggested",
    "must-see",
    "must see",
    "favorite",
    "preferred",
    "ideal",
    "perfect",
    "dream",
    "paradise",
  ]);

  private negativeWords = new Set([
    "terrible",
    "bad",
    "awful",
    "horrible",
    "poor",
    "mediocre",
    "average",
    "worst",
    "disappointing",
    "overrated",
    "crowded",
    "dirty",
    "noisy",
    "expensive",
    "cheap",
    "boring",
    "ugly",
    "disgusting",
    "hate",
    "dislike",
    "avoid",
    "skip",
  ]);

  private intentKeywords: Record<
    "search" | "preference" | "question" | "complaint" | "praise",
    string[]
  > = {
    search: ["find", "show", "get", "search", "looking", "want", "need"],
    preference: ["prefer", "like", "favorite", "best", "top", "recommend", "suggest", "quiet"],
    question: ["what", "which", "where", "when", "how", "who", "why", "?"],
    complaint: ["terrible", "bad", "awful", "horrible", "poor", "hate", "dislike"],
    praise: ["amazing", "fantastic", "wonderful", "perfect", "excellent", "beautiful", "stunning"],
  };

  private intensityModifiers: Record<"high" | "medium" | "low", string[]> = {
    high: ["extremely", "incredibly", "absolutely", "totally", "completely", "very", "most"],
    medium: ["quite", "rather", "pretty", "fairly", "somewhat"],
    low: ["slightly", "a bit", "kind of", "sort of"],
  };

  private constructor() {
    // Initialize sentiment analyzer
  }

  public static getInstance(): SentimentAnalyzer {
    if (!SentimentAnalyzer.instance) {
      SentimentAnalyzer.instance = new SentimentAnalyzer();
    }
    return SentimentAnalyzer.instance;
  }

  /**
   * Analyze sentiment of text
   */
  public async analyzeSentiment(text: string): Promise<SentimentResult> {
    // Handle null/undefined input gracefully
    if (!text || typeof text !== "string") {
      text = "";
    }

    // Simple text normalization without TextProcessor
    const normalizedText = text.toLowerCase().trim();

    const words = normalizedText.split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let intensity = "low";
    const keywords: string[] = [];

    // Analyze each word
    for (const word of words) {
      if (this.positiveWords.has(word)) {
        positiveScore++;
        keywords.push(word);
      } else if (this.negativeWords.has(word)) {
        negativeScore++;
        keywords.push(word);
      }
    }

    // Determine intensity
    for (const [level, modifiers] of Object.entries(this.intensityModifiers)) {
      if (modifiers.some((modifier) => normalizedText.includes(modifier))) {
        if (level === "high" || level === "medium" || level === "low") {
          intensity = level as "high" | "medium" | "low";
        }
        break;
      }
    }

    // Calculate polarity and confidence
    const totalScore = positiveScore + negativeScore;
    let polarity: "positive" | "negative" | "neutral" = "neutral";
    let confidence = 0.4; // Base confidence for neutral

    if (totalScore > 0) {
      if (positiveScore > negativeScore) {
        polarity = "positive";
        confidence = Math.min(0.9, 0.6 + ((positiveScore - negativeScore) / totalScore) * 0.3);
      } else if (negativeScore > positiveScore) {
        polarity = "negative";
        confidence = Math.min(0.9, 0.6 + ((negativeScore - positiveScore) / totalScore) * 0.3);
      }
    }

    // Determine intent
    const intentAnalysis = this.analyzeIntent(text, polarity);

    return {
      polarity,
      confidence,
      intent: intentAnalysis.primaryIntent,
      intensity: intensity as "high" | "medium" | "low",
      keywords,
    };
  }

  /**
   * Analyze user intent
   */
  public analyzeIntent(
    text: string,
    sentiment?: "positive" | "negative" | "neutral"
  ): IntentAnalysis {
    // Handle null/undefined input gracefully
    if (!text || typeof text !== "string") {
      text = "";
    }

    const normalizedText = text.toLowerCase();
    const intentScores: Record<
      "search" | "preference" | "question" | "complaint" | "praise",
      number
    > = {
      search: 0,
      preference: 0,
      question: 0,
      complaint: 0,
      praise: 0,
    };

    // Score based on keywords with context awareness
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      for (const keyword of keywords) {
        if (normalizedText.includes(keyword)) {
          // Give higher weight to certain keywords
          if (
            intent === "search" &&
            ["find", "show", "get", "search", "looking", "want", "need"].includes(keyword)
          ) {
            intentScores[intent as keyof typeof intentScores] += 2; // Higher weight for clear search intent
          } else if (
            intent === "question" &&
            keyword === "where" &&
            normalizedText.includes("are")
          ) {
            intentScores[intent as keyof typeof intentScores] += 1; // Standard weight for "where are" questions
          } else {
            intentScores[intent as keyof typeof intentScores]++;
          }
        }
      }
    }

    // Adjust scores based on sentiment (smaller adjustments)
    if (sentiment === "positive") {
      intentScores.praise += 0.2;
      intentScores.preference += 0.1;
    } else if (sentiment === "negative") {
      intentScores.complaint += 0.2;
    }

    // Find primary intent
    const primaryIntent = Object.entries(intentScores).reduce(
      (max, [intent, score]) => (score > max.score ? { intent, score } : max),
      { intent: "search", score: 0 }
    );

    // Find secondary intents
    const secondaryIntents = Object.entries(intentScores)
      .filter(([intent, score]) => intent !== primaryIntent.intent && score > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([intent]) => intent);

    // Extract modifiers
    const modifiers: string[] = [];
    for (const [, mods] of Object.entries(this.intensityModifiers)) {
      for (const mod of mods) {
        if (normalizedText.includes(mod)) {
          modifiers.push(mod);
        }
      }
    }

    return {
      primaryIntent: primaryIntent.intent as
        | "search"
        | "preference"
        | "question"
        | "complaint"
        | "praise",
      secondaryIntents,
      confidence: Math.min(0.95, Math.max(0.6, primaryIntent.score / 1.2)), // Higher base confidence
      modifiers,
    };
  }

  /**
   * Detect if query is asking for recommendations
   */
  public isRecommendationQuery(text: string): boolean {
    const recommendationPatterns = [
      /\b(best|top|recommended|suggested|favorite|preferred|recommend|suggest)\b/i,
      /\b(what.*should.*visit|where.*should.*go|which.*best)\b/i,
      /\b(must.*see|must.*visit|worth.*visiting)\b/i,
    ];

    return recommendationPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Detect if query is asking for specific information
   */
  public isInformationQuery(text: string): boolean {
    const questionWords = ["what", "where", "when", "how", "which", "who", "why"];
    const normalizedText = text.toLowerCase();

    return questionWords.some((word) => normalizedText.includes(word)) || text.includes("?");
  }

  /**
   * Detect if query expresses strong preferences
   */
  public hasStrongPreferences(text: string): boolean {
    const strongPreferenceWords = [
      "must",
      "need",
      "require",
      "essential",
      "important",
      "prefer",
      "love",
      "hate",
    ];

    const normalizedText = text.toLowerCase();
    return strongPreferenceWords.some((word) => normalizedText.includes(word));
  }

  /**
   * Extract preference indicators
   */
  public extractPreferences(text: string): string[] {
    const preferences: string[] = [];
    const normalizedText = text.toLowerCase();

    // Look for preference patterns
    const preferencePatterns = [
      /\b(prefer|preference|like|love|want|need)\s+(\w+)/gi,
      /\b(not|don't|don't want|avoid|hate)\s+(\w+)/gi,
      /\b(must|should|need to)\s+(\w+)/gi,
    ];

    for (const pattern of preferencePatterns) {
      const matches = normalizedText.matchAll(pattern);
      for (const match of matches) {
        if (match[2]) {
          preferences.push(match[2]);
        }
      }
    }

    return preferences;
  }

  /**
   * Get sentiment summary for display
   */
  public getSentimentSummary(result: SentimentResult): string {
    const { polarity, intent } = result;

    const summaries = {
      positive: {
        search: "Looking for great beaches",
        preference: "Has positive preferences",
        question: "Asking about good options",
        complaint: "Expressing satisfaction",
        praise: "Praising beach quality",
      },
      negative: {
        search: "Looking for alternatives",
        preference: "Has negative preferences",
        question: "Asking about problems",
        complaint: "Expressing dissatisfaction",
        praise: "Contrasting with negatives",
      },
      neutral: {
        search: "General search query",
        preference: "Neutral preferences",
        question: "Asking for information",
        complaint: "Neutral feedback",
        praise: "Neutral evaluation",
      },
    };

    return summaries[polarity][intent] || "General query";
  }
}
