import { useState, useCallback, useEffect } from 'react';

export interface BeachFormDraft {
  name: string;
  area_id: string; // Changed from 'area' to 'area_id' to match new schema
  latitude: string;
  longitude: string;
  description: string;
  type: string;
  wave_conditions: string;
  organized: boolean;
  parking: string;
  blue_flag: boolean;
  amenities: string[];
  photo_url: string;
  photo_source: string;
  status: string;
  slug: string;
  source: string;
  markVerified: boolean;
}

const DEFAULT_DRAFT: BeachFormDraft = {
  name: '',
  area_id: '', // Changed from 'area' to 'area_id'
  latitude: '',
  longitude: '',
  description: '',
  type: 'OTHER',
  wave_conditions: 'CALM',
  organized: false,
  parking: 'NONE',
  blue_flag: false,
  amenities: [],
  photo_url: '',
  photo_source: '',
  status: 'DRAFT',
  slug: '',
  source: '',
  markVerified: false,
};

export const useFormDraftState = (formKey: string, initialData?: Partial<BeachFormDraft>) => {
  const storageKey = `beach-form-draft-${formKey}`;
  
  // Initialize state from localStorage or initial data
  const [draft, setDraft] = useState<BeachFormDraft>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_DRAFT, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to parse stored draft:', error);
    }
    return { ...DEFAULT_DRAFT, ...initialData };
  });

  // Track if we have a stored draft
  const [hasStoredDraft, setHasStoredDraft] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  });

  // Save to localStorage whenever draft changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  }, [draft, storageKey]);

  // Update draft with partial data
  const updateDraft = useCallback((updates: Partial<BeachFormDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset draft to initial data or default
  const resetDraft = useCallback(() => {
    setDraft({ ...DEFAULT_DRAFT, ...initialData });
  }, [initialData]);

  // Clear draft completely
  const clearDraft = useCallback(() => {
    setDraft(DEFAULT_DRAFT);
    setHasStoredDraft(false);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear draft from localStorage:', error);
    }
  }, [storageKey]);

  // Check if draft has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const current = { ...DEFAULT_DRAFT, ...initialData };
    return JSON.stringify(draft) !== JSON.stringify(current);
  }, [draft, initialData]);

  // Check if we have a stored draft (different from unsaved changes)
  const hasStoredDraftData = useCallback(() => {
    return hasStoredDraft;
  }, [hasStoredDraft]);

  return {
    draft,
    updateDraft,
    resetDraft,
    clearDraft,
    hasUnsavedChanges,
    hasStoredDraftData,
  };
};
