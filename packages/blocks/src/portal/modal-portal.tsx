/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { useDialogDismissal } from "@plane/hooks";
import { cn } from "@plane/utils";
import { PORTAL_WIDTH_CLASSES, PORTAL_POSITION_CLASSES, DEFAULT_PORTAL_ID, MODAL_Z_INDEX } from "./constants";
import type { PortalWidth, PortalPosition } from "./constants";
import { PortalWrapper } from "./portal-wrapper";

export type ModalPortalProps = {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
  portalId?: string;
  overlayClassName?: string;
  contentClassName?: string;
  width?: PortalWidth;
  position?: PortalPosition;
  fullScreen?: boolean;
  showOverlay?: boolean;
  closeOnEscape?: boolean;
  /** Called on outside click; omit to keep the modal open. */
  onOutsideClick?: () => void;
};

/**
 * @param children - The modal content to render
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to call when modal should close
 * @param portalId - The ID of the DOM element to render into
 * @param className - Custom className for the modal container
 * @param overlayClassName - Custom className for the overlay
 * @param contentClassName - Custom className for the content area
 * @param width - Predefined width option from PortalWidth
 * @param position - Position option from PortalPosition
 * @param fullScreen - Whether to render in fullscreen mode
 * @param showOverlay - Whether to show background overlay
 * @param closeOnEscape - Whether pressing Escape closes modal
 * @param onOutsideClick - Called on outside click; omit to keep the modal open
 */
export function ModalPortal({
  children,
  isOpen,
  onClose,
  portalId = DEFAULT_PORTAL_ID,
  className,
  overlayClassName,
  contentClassName,
  width = "half",
  position = "right",
  fullScreen = false,
  showOverlay = true,
  closeOnEscape = true,
  onOutsideClick,
}: ModalPortalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useDialogDismissal({
    isOpen,
    handleClose: closeOnEscape ? onClose : undefined,
    onOutsideClick,
    panelRef: contentRef,
  });

  // Memoized style classes
  const modalClasses = useMemo(() => {
    const widthClass = fullScreen ? "w-full h-full" : PORTAL_WIDTH_CLASSES[width];
    const positionClass = fullScreen ? "" : PORTAL_POSITION_CLASSES[position];

    return cn(
      "shadow-lg absolute top-0 h-full bg-white transition-transform duration-300 ease-out",
      widthClass,
      positionClass,
      contentClassName
    );
  }, [fullScreen, width, position, contentClassName]);

  if (!isOpen) return null;

  const content = (
    <div
      className={cn("absolute inset-0 h-full w-full overflow-y-auto", className)}
      style={{ zIndex: MODAL_Z_INDEX }}
      role="dialog"
    >
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-300",
          {
            "bg-black/50": showOverlay,
          },
          overlayClassName
        )}
        aria-hidden="true"
      />

      <div ref={contentRef} className={cn(modalClasses)} style={{ zIndex: MODAL_Z_INDEX + 1 }} role="document">
        {children}
      </div>
    </div>
  );

  return <PortalWrapper portalId={portalId}>{content}</PortalWrapper>;
}
