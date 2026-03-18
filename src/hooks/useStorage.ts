import { useState, useEffect, useCallback } from 'react';
import type { Highlight } from '../types';

/**
 * Custom hook for Chrome storage integration
 * Manages highlights for the current URL
 */
export function useStorage(url: string) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHighlights = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(['highlights']);
      const allHighlights = result.highlights || {};
      const urlHighlights = allHighlights[url] || [];
      setHighlights(urlHighlights);
    } catch (error) {
      console.error('Error loading highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // Load highlights for the current URL and listen for cross-tab changes
  useEffect(() => {
    loadHighlights();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.highlights) {
        const newValue = changes.highlights.newValue || {};
        const urlHighlights = newValue[url] || [];
        setHighlights(urlHighlights);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [url, loadHighlights]);

  // Save a new highlight
  const saveHighlight = useCallback(async (highlight: Highlight) => {
    try {
      const result = await chrome.storage.local.get(['highlights']);
      const allHighlights = result.highlights || {};
      const urlHighlights = allHighlights[url] || [];

      const updatedHighlights = [...urlHighlights, highlight];
      allHighlights[url] = updatedHighlights;

      await chrome.storage.local.set({ highlights: allHighlights });
      setHighlights(updatedHighlights);

      return highlight;
    } catch (error) {
      console.error('Error saving highlight:', error);
      throw error;
    }
  }, [url]);

  // Update an existing highlight (for adding/editing notes)
  const updateHighlight = useCallback(async (id: string, updates: Partial<Highlight>) => {
    try {
      const result = await chrome.storage.local.get(['highlights']);
      const allHighlights = result.highlights || {};
      const urlHighlights = allHighlights[url] || [];

      const updatedHighlights = urlHighlights.map((h: Highlight) =>
        h.id === id ? { ...h, ...updates, updatedAt: Date.now() } : h
      );

      allHighlights[url] = updatedHighlights;
      await chrome.storage.local.set({ highlights: allHighlights });
      setHighlights(updatedHighlights);
    } catch (error) {
      console.error('Error updating highlight:', error);
      throw error;
    }
  }, [url]);

  // Delete a highlight
  const deleteHighlight = useCallback(async (id: string) => {
    try {
      const result = await chrome.storage.local.get(['highlights']);
      const allHighlights = result.highlights || {};
      const urlHighlights = allHighlights[url] || [];

      const updatedHighlights = urlHighlights.filter((h: Highlight) => h.id !== id);
      allHighlights[url] = updatedHighlights;

      await chrome.storage.local.set({ highlights: allHighlights });
      setHighlights(updatedHighlights);
    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  }, [url]);

  return {
    highlights,
    isLoading,
    saveHighlight,
    updateHighlight,
    deleteHighlight,
    reload: loadHighlights,
  };
}
