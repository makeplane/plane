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

import {
  autoUpdate,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  FloatingOverlay,
  FloatingPortal,
} from "@floating-ui/react";
import type { FC } from "react";
import { useEffect } from "react";
// types
import { UpgradeNowModal } from "@/plane-editor/components/modal/upgrade-modal";
import type { TMathModalBaseProps } from "../types";
// components
import { MathInputModal } from "./input-modal";

type TFloatingMathModalProps = TMathModalBaseProps & {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  referenceElement: HTMLElement | null;
  onPreview?: (latex: string, isValid: boolean, errorMessage?: string) => void;
  isFlagged?: boolean;
};
export function FloatingMathModal({
  isOpen,
  setIsOpen,
  referenceElement,
  latex,
  onSave,
  onClose,
  onPreview,
  nodeType,
  editor,
  getPos,
  isFlagged,
}: TFloatingMathModalProps) {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: {
      reference: referenceElement,
    },
    middleware: [
      flip({
        fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"],
      }),
      shift({
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !referenceElement) return null;

  return (
    <FloatingPortal>
      {/* Backdrop */}
      <FloatingOverlay
        lockScroll
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
        style={{ zIndex: 99 }}
      />

      {/* Modal content */}
      <div
        ref={refs.setFloating}
        style={{ ...floatingStyles, zIndex: 100 }}
        {...getFloatingProps()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {isFlagged ? (
          <UpgradeNowModal />
        ) : (
          <MathInputModal
            latex={latex}
            onSave={onSave}
            onClose={onClose}
            onPreview={onPreview}
            nodeType={nodeType}
            editor={editor}
            getPos={getPos}
          />
        )}
      </div>
    </FloatingPortal>
  );
}
