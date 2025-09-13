import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export const useDebouncedSearch = (
  initialValue: string,
  onSearchChange: (value: string) => void,
  delay: number = 250
) => {
  const [searchInput, setSearchInput] = useState(initialValue);
  const debouncedSearch = useDebounce(searchInput, delay);

  // Update parent when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== initialValue) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, initialValue, onSearchChange]);

  // Update local input when parent value changes
  useEffect(() => {
    setSearchInput(initialValue);
  }, [initialValue]);

  return {
    searchInput,
    setSearchInput,
    debouncedSearch,
  };
};
