import { useCallback, useRef, useState } from "react";
import { useOutsideClickDetector } from "@plane/hooks";

type UseExpandableSearchOptions = {
  onClose?: () => void;
};

/**
 * Custom hook for expandable search input behavior
 * Handles focus management to prevent unwanted opening on programmatic focus restoration
 */
export const useExpandableSearch = (options?: UseExpandableSearchOptions) => {
  const { onClose } = options || {};

  // states
  const [isOpen, setIsOpen] = useState(false);

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasClickedRef = useRef<boolean>(false);

  // Handle close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    inputRef.current?.blur();
    onClose?.();
  }, [onClose]);

  // Outside click handler - memoized to prevent unnecessary re-registrations
  const handleOutsideClick = useCallback(() => {
    if (isOpen) {
      handleClose();
    }
  }, [isOpen, handleClose]);

  // Outside click detection
  useOutsideClickDetector(containerRef, handleOutsideClick);

  // Track explicit clicks
  const handleMouseDown = useCallback(() => {
    wasClickedRef.current = true;
  }, []);

  // Only open on explicit clicks, not programmatic focus
  const handleFocus = useCallback(() => {
    if (wasClickedRef.current) {
      setIsOpen(true);
      wasClickedRef.current = false;
    }
  }, []);

  // Helper to open panel (for typing/onChange)
  const openPanel = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  return {
    // State
    isOpen,
    setIsOpen,

    // Refs
    containerRef,
    inputRef,

    // Handlers
    handleClose,
    handleMouseDown,
    handleFocus,
    openPanel,
  };
};
