/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { useEffect, useRef } from "react";
import { useOutsideClickDetector } from "./use-outside-click-detector";

type Props<T extends HTMLElement> = {
  isOpen: boolean;
  handleClose?: () => void;
  onOutsideClick?: () => void;
  panelRef: React.RefObject<T | null>;
};

// Tracks open dialogs so Escape only closes the topmost one (mirrors Headless UI's nesting behavior).
const openDialogStack: symbol[] = [];

/** Escape closes only the topmost dialog; outside click only fires `onOutsideClick` if provided. */
export const useDialogDismissal = <T extends HTMLElement = HTMLElement>(props: Props<T>) => {
  const { isOpen, handleClose, onOutsideClick, panelRef } = props;
  const idRef = useRef<symbol>(Symbol());

  useEffect(() => {
    if (!isOpen) return;
    const id = idRef.current;
    openDialogStack.push(id);
    return () => {
      const index = openDialogStack.indexOf(id);
      if (index !== -1) openDialogStack.splice(index, 1);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const isTopmost = openDialogStack[openDialogStack.length - 1] === idRef.current;
      if (!isTopmost) return;
      event.preventDefault();
      event.stopPropagation();
      handleClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useOutsideClickDetector(panelRef, () => onOutsideClick?.(), false, isOpen && !!onOutsideClick);
};
