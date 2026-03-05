/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useOutsideClickDetector } from "@plane/hooks";

type UseExpandableSearchOptions = {
  onClose?: () => void;
};

/**
 * Custom hook for expandable search input behavior
 * Handles focus management to prevent unwanted opening on programmatic focus restoration
 * Opens on click, typing, or keyboard shortcut (via PowerK Cmd+F)
 */
export const useExpandableSearch = (options?: UseExpandableSearchOptions) => {
  const { onClose } = options || {};

  // states
  const [isOpen, setIsOpen] = useState(false);

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasClickedRef = useRef<boolean>(false);
  const wasKeyboardTriggeredRef = useRef<boolean>(false);

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

  // Track keyboard shortcuts that trigger focus ("/")
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        // Mark as keyboard triggered so handleFocus knows to open
        wasKeyboardTriggeredRef.current = true;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Track explicit clicks
  const handleMouseDown = useCallback(() => {
    wasClickedRef.current = true;
  }, []);

  // Open on explicit clicks or keyboard shortcut, not programmatic focus restoration
  const handleFocus = useCallback(() => {
    if (wasClickedRef.current || wasKeyboardTriggeredRef.current) {
      setIsOpen(true);
      wasClickedRef.current = false;
      wasKeyboardTriggeredRef.current = false;
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
