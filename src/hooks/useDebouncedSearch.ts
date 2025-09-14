import { useState, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

export const useDebouncedSearch = (
  initialValue: string,
  onSearchChange: (value: string) => void,
  delay: number = 250
) => {
  const [searchInput, setSearchInput] = useState(initialValue);
  const debouncedSearch = useDebounce(searchInput, delay);
  const lastInitialValue = useRef(initialValue);
  const isUserTyping = useRef(false);

  // Update parent when debounced search changes (only for user typing)
  useEffect(() => {
    if (isUserTyping.current && debouncedSearch !== initialValue) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, initialValue, onSearchChange]);

  // Update local input when parent value changes (programmatic changes)
  useEffect(() => {
    if (initialValue !== lastInitialValue.current) {
      lastInitialValue.current = initialValue;
      setSearchInput(initialValue);
      isUserTyping.current = false; // Reset typing flag for programmatic changes
    }
  }, [initialValue]);

  // Track when user is typing
  const handleSearchInputChange = (value: string) => {
    isUserTyping.current = true;
    setSearchInput(value);
  };

  // Programmatic clear that bypasses user typing flag
  const clearSearchInput = () => {
    isUserTyping.current = false;
    setSearchInput('');
  };

  return {
    searchInput,
    setSearchInput: handleSearchInputChange,
    clearSearchInput,
    debouncedSearch,
  };
};
