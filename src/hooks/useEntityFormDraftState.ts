import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type DraftEntity = "beach" | "area";

export interface UseEntityFormDraftStateOptions<TDraft> {
  entity: DraftEntity;
  formKey: string;
  defaultDraft: TDraft;
  initialData?: Partial<TDraft>;
  debounceMs?: number;
}

export function useEntityFormDraftState<TDraft>(options: UseEntityFormDraftStateOptions<TDraft>) {
  const { entity, formKey, defaultDraft, initialData, debounceMs = 0 } = options;

  const storageKey = useMemo(() => `${entity}-form-draft-${formKey}`, [entity, formKey]);

  const initialValueRef = useRef<TDraft>(
    Object.assign({}, defaultDraft, initialData || {}) as TDraft
  );

  const [draft, setDraft] = useState<TDraft>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Object.assign({}, defaultDraft, parsed) as TDraft;
      }
    } catch (error) {
      console.warn("Failed to load draft from localStorage:", error);
    }
    return initialValueRef.current;
  });

  const [hasStoredDraft, setHasStoredDraft] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  });

  // Persist changes with optional debounce
  useEffect(() => {
    if (debounceMs > 0) {
      const id = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(draft));
          setHasStoredDraft(true);
        } catch (error) {
          console.warn("Failed to save draft to localStorage:", error);
        }
      }, debounceMs);
      return () => clearTimeout(id);
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setHasStoredDraft(true);
    } catch (error) {
      console.warn("Failed to save draft to localStorage:", error);
    }
  }, [draft, storageKey, debounceMs]);

  const updateDraft = useCallback((updates: Partial<TDraft>) => {
    setDraft((prev) => Object.assign({}, prev, updates));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(Object.assign({}, defaultDraft, initialData || {}) as TDraft);
  }, [defaultDraft, initialData]);

  const clearDraft = useCallback(() => {
    setDraft(defaultDraft);
    setHasStoredDraft(false);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to clear draft from localStorage:", error);
    }
  }, [defaultDraft, storageKey]);

  const hasUnsavedChanges = useCallback(() => {
    const baseline = Object.assign({}, defaultDraft, initialData || {}) as TDraft;
    try {
      return JSON.stringify(draft) !== JSON.stringify(baseline);
    } catch {
      // Fallback if cyclical (should not happen for plain objects)
      return true;
    }
  }, [draft, defaultDraft, initialData]);

  const hasStoredDraftData = useCallback(() => {
    return hasStoredDraft;
  }, [hasStoredDraft]);

  return useMemo(
    () => ({ draft, updateDraft, resetDraft, clearDraft, hasUnsavedChanges, hasStoredDraftData }),
    [draft, updateDraft, resetDraft, clearDraft, hasUnsavedChanges, hasStoredDraftData]
  );
}


