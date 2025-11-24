import { useCallback, useEffect, useState } from "react";

type TArgs = {
  elementId: string;
  pathname: string;
  scrollDelay?: number;
};

type TReturnType = {
  isHashMatch: boolean;
  hashIds: string[];
  scrollToElement: () => boolean;
};

/**
 * Custom hook for handling hash-based scrolling to a specific element
 * Supports multiple IDs in URL hash (comma-separated, space-separated, or other delimiters)
 *
 * @param {TArgs} args - The ID of the element to scroll to
 * @returns {TReturnType} Object containing hash match status and scroll function
 */
export const useHashScroll = (args: TArgs): TReturnType => {
  const { elementId, pathname, scrollDelay = 200 } = args;
  // State to track if the current hash contains the provided element ID
  const [isHashMatch, setIsHashMatch] = useState(false);
  // State to track all IDs found in the hash
  const [hashIds, setHashIds] = useState<string[]>([]);

  /**
   * Scrolls to the element with the provided ID
   * @returns {boolean} - Whether the scroll was successful
   */
  const scrollToElement = useCallback((): boolean => {
    try {
      const element = document.getElementById(elementId);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, scrollDelay);

        return true;
      }

      return false;
    } catch (error) {
      console.warn("Hash scroll error:", error);
      return false;
    }
  }, [elementId, scrollDelay]);

  /**
   * Extracts multiple IDs from hash string
   * Supports various delimiters: comma, space, pipe, semicolon
   * @param {string} hashString - The hash part of the URL
   * @returns {string[]} - Array of clean ID strings
   */
  const extractIdsFromHash = (hashString: string | null): string[] => {
    if (!hashString) return [];

    // Split by common delimiters and clean up
    return hashString
      .split(/[,\s|;]+/) // Split by comma, space, pipe, or semicolon
      .map((id) => id.trim()) // Remove whitespace
      .filter((id) => id.length > 0); // Remove empty strings
  };

  /**
   * Get current hash from window.location
   * @returns {string | null} - Current hash without the # symbol
   */
  const getCurrentHash = (): string | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    return hash ? hash.slice(1) : null; // Remove the # symbol
  };

  // Effect to handle hash changes and initial load
  useEffect(() => {
    if (!elementId) {
      setIsHashMatch(false);
      setHashIds([]);
      return;
    }

    const handleHashChange = () => {
      const hash = getCurrentHash();

      // Extract all IDs from the hash
      const idsInHash = extractIdsFromHash(hash);
      setHashIds(idsInHash);

      // Check if provided element ID is present in the hash
      const hashMatches = idsInHash.includes(elementId);
      setIsHashMatch(hashMatches);

      // If hash matches, attempt to scroll to the element
      if (hashMatches) {
        scrollToElement();
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [elementId, pathname, scrollToElement]); // Include pathname to handle route changes

  // Return object with hash match status and utility functions
  return {
    // Whether the current URL hash contains the provided element ID
    isHashMatch,

    // Array of all IDs found in the current hash
    hashIds,

    // Manually trigger scroll to the element
    scrollToElement,
  };
};
