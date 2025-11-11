/**
 * Constants for EnhancedSearchBar component
 * Centralized to eliminate duplication and provide semantic naming
 */

/**
 * AI-powered placeholder examples for desktop users
 * These showcase the natural language query capabilities
 */
export const DESKTOP_PLACEHOLDER_EXAMPLES = [
  "Ask me: 'Show me secluded beaches with crystal clear water near Crete'",
  "Try: 'Find family-friendly beaches with shallow water and lifeguards'",
  "Ask: 'What are the best beaches for windsurfing with strong winds?'",
  "Search: 'Beaches with beach bars and music, not too crowded'",
  "Ask: 'Show me beaches where I can see the sunset with my partner'",
  "Try: 'Find beaches with good snorkeling and marine life'",
  "Ask: 'What beaches have the softest sand and are wheelchair accessible?'",
  "Search: 'Beaches with traditional Greek tavernas right on the sand'",
  "Ask: 'Show me beaches with ancient ruins or historical sites nearby'",
  "Try: 'Find beaches with the bluest water and best for Instagram photos'",
  "Ask: 'What are the quietest beaches away from tourist crowds?'",
  "Search: 'Beaches with beach volleyball courts and water sports'",
];

/**
 * Simplified placeholder examples for mobile users
 * Shorter versions optimized for smaller screens
 */
export const MOBILE_PLACEHOLDER_EXAMPLES = [
  "Ask me: 'Show me sandy beaches with calm waters near Crete'",
  "Try: 'Find family-friendly beaches with lifeguards'",
  "Ask: 'What are the best beaches for windsurfing with strong winds?'",
  "Search: 'Beaches with beach bars and music'",
  "Try: 'Find calm beaches with good snorkeling'",
  "Search: 'Beaches with traditional Greek tavernas in Corfu'",
  "Try: 'Find beaches for Instagram photos'",
  "Search: 'Beaches with water sports'",
];

/**
 * Simple fallback for mobile devices
 */
export const MOBILE_PLACEHOLDER_FALLBACK = "Ask me about beaches...";

/**
 * Timeout for batching filter clear operations
 * Prevents rapid successive state updates
 */
export const FILTER_CLEAR_DEBOUNCE_MS = 100;
