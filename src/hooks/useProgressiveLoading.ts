import { useState, useEffect, useCallback } from 'react';

interface ProgressiveLoadingState {
  contentLoaded: boolean;
  imageLoaded: boolean;
  isFullyLoaded: boolean;
  showContent: boolean;
  showImage: boolean;
}

interface ProgressiveLoadingOptions {
  contentDelay?: number; // Delay before showing content (ms)
  imageDelay?: number;   // Delay before starting image load (ms)
  enableProgressiveMode?: boolean;
}

export const useProgressiveLoading = (
  isLoading: boolean,
  hasImage: boolean,
  options: ProgressiveLoadingOptions = {}
) => {
  const {
    contentDelay = 0,
    imageDelay = 100,
    enableProgressiveMode = true
  } = options;

  const [state, setState] = useState<ProgressiveLoadingState>({
    contentLoaded: false,
    imageLoaded: false,
    isFullyLoaded: false,
    showContent: false,
    showImage: false,
  });

  // Handle content loading
  useEffect(() => {
    if (!isLoading && enableProgressiveMode) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          contentLoaded: true,
          showContent: true,
        }));
      }, contentDelay);

      return () => clearTimeout(timer);
    } else if (!isLoading && !enableProgressiveMode) {
      // If progressive mode is disabled, show everything immediately
      setState(prev => ({
        ...prev,
        contentLoaded: true,
        showContent: true,
        showImage: true,
      }));
    }
  }, [isLoading, contentDelay, enableProgressiveMode]);

  // Handle image loading
  useEffect(() => {
    if (state.contentLoaded && hasImage && enableProgressiveMode) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          showImage: true,
        }));
      }, imageDelay);

      return () => clearTimeout(timer);
    }
  }, [state.contentLoaded, hasImage, imageDelay, enableProgressiveMode]);

  // Handle image load completion
  const handleImageLoad = useCallback(() => {
    setState(prev => ({
      ...prev,
      imageLoaded: true,
      isFullyLoaded: true,
    }));
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setState(prev => ({
      ...prev,
      imageLoaded: false,
      isFullyLoaded: prev.contentLoaded, // Still fully loaded if content is ready
    }));
  }, []);

  // Reset state when loading starts
  useEffect(() => {
    if (isLoading) {
      setState({
        contentLoaded: false,
        imageLoaded: false,
        isFullyLoaded: false,
        showContent: false,
        showImage: false,
      });
    }
  }, [isLoading]);

  return {
    ...state,
    handleImageLoad,
    handleImageError,
    // Helper methods
    shouldShowContent: state.showContent,
    shouldShowImage: state.showImage,
    shouldShowImageSkeleton: state.showImage && !state.imageLoaded,
    isContentReady: state.contentLoaded,
    isImageReady: state.imageLoaded,
  };
};
