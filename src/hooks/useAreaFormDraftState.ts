import { useState, useEffect, useCallback, useMemo } from 'react';

export interface AreaFormDraft {
  name: string;
  slug: string;
  description: string;
  hero_photo_url: string;
  hero_photo_source: string;
  status: string;
}

const defaultDraft: AreaFormDraft = {
  name: '',
  slug: '',
  description: '',
  hero_photo_url: '',
  hero_photo_source: '',
  status: 'DRAFT',
};

const getStorageKey = (formKey: string) => `area-form-draft-${formKey}`;

const loadFromStorage = (formKey: string): AreaFormDraft | null => {
  try {
    const stored = localStorage.getItem(getStorageKey(formKey));
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all required fields exist with fallbacks
      return {
        ...defaultDraft,
        ...parsed,
      };
    }
  } catch (error) {
    console.warn('Failed to load area form draft from localStorage:', error);
  }
  return null;
};

const saveToStorage = (formKey: string, draft: AreaFormDraft): void => {
  try {
    localStorage.setItem(getStorageKey(formKey), JSON.stringify(draft));
  } catch (error) {
    console.warn('Failed to save area form draft to localStorage:', error);
  }
};

const removeFromStorage = (formKey: string): void => {
  try {
    localStorage.removeItem(getStorageKey(formKey));
  } catch (error) {
    console.warn('Failed to remove area form draft from localStorage:', error);
  }
};

export const useAreaFormDraftState = (formKey: string) => {
  const [draft, setDraft] = useState<AreaFormDraft>(() => {
    const stored = loadFromStorage(formKey);
    return stored || defaultDraft;
  });

  const [lastSaved, setLastSaved] = useState<string>('');

  // Save to localStorage whenever draft changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage(formKey, draft);
      setLastSaved(JSON.stringify(draft));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [draft, formKey]);

  const updateDraft = useCallback((updates: Partial<AreaFormDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(defaultDraft);
    removeFromStorage(formKey);
    setLastSaved('');
  }, [formKey]);

  const hasUnsavedChanges = useCallback(() => {
    const currentSerialized = JSON.stringify(draft);
    return currentSerialized !== lastSaved && JSON.stringify(draft) !== JSON.stringify(defaultDraft);
  }, [draft, lastSaved]);

  const hasStoredDraftData = useCallback(() => {
    return loadFromStorage(formKey) !== null;
  }, [formKey]);

  return useMemo(() => ({
    draft,
    updateDraft,
    clearDraft,
    hasUnsavedChanges,
    hasStoredDraftData,
  }), [draft, updateDraft, clearDraft, hasUnsavedChanges, hasStoredDraftData]);
};