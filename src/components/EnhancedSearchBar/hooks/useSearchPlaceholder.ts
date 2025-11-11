/**
 * Custom hook to generate dynamic AI-powered placeholder text
 * Rotates through examples and adapts to mobile/desktop
 */

import { useState, useEffect } from "react";
import {
  DESKTOP_PLACEHOLDER_EXAMPLES,
  MOBILE_PLACEHOLDER_EXAMPLES,
  MOBILE_PLACEHOLDER_FALLBACK,
} from "../constants";

/**
 * Selects a random placeholder example from the provided array
 */
function getRandomPlaceholder(examples: string[]): string {
  return examples[Math.floor(Math.random() * examples.length)];
}

/**
 * Generates initial placeholder based on mobile/desktop context
 */
function getInitialPlaceholder(isMobile: boolean): string {
  if (isMobile) {
    return MOBILE_PLACEHOLDER_FALLBACK;
  }
  return getRandomPlaceholder(DESKTOP_PLACEHOLDER_EXAMPLES);
}

interface UseSearchPlaceholderProps {
  isMobile: boolean;
  searchInput: string;
}

/**
 * Manages the dynamic AI placeholder text
 * Rotates to a new example whenever the search input is cleared
 * @param isMobile - Whether the user is on a mobile device
 * @param searchInput - Current search input value (to detect clearing)
 * @returns Current placeholder text
 */
export function useSearchPlaceholder({ isMobile, searchInput }: UseSearchPlaceholderProps): string {
  const [placeholder, setPlaceholder] = useState(() => getInitialPlaceholder(isMobile));

  // Rotate placeholder when search input becomes empty (user cleared search)
  useEffect(() => {
    if (searchInput.length === 0) {
      if (isMobile) {
        setPlaceholder(MOBILE_PLACEHOLDER_FALLBACK);
      } else {
        const examples = isMobile ? MOBILE_PLACEHOLDER_EXAMPLES : DESKTOP_PLACEHOLDER_EXAMPLES;
        setPlaceholder(getRandomPlaceholder(examples));
      }
    }
  }, [searchInput, isMobile]);

  return placeholder;
}
