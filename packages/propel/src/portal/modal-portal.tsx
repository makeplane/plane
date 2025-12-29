import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { cn } from "../utils";
import {
  EPortalWidth,
  EPortalPosition,
  PORTAL_WIDTH_CLASSES,
  PORTAL_POSITION_CLASSES,
  DEFAULT_PORTAL_ID,
  MODAL_Z_INDEX,
} from "./constants";
import { PortalWrapper } from "./portal-wrapper";
import type { ModalPortalProps } from "./types";

/**
 * @param children - The modal content to render
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to call when modal should close
 * @param portalId - The ID of the DOM element to render into
 * @param className - Custom className for the modal container
 * @param overlayClassName - Custom className for the overlay
 * @param contentClassName - Custom className for the content area
 * @param width - Predefined width options using EPortalWidth enum
 * @param position - Position of the modal using EPortalPosition enum
 * @param fullScreen - Whether to render in fullscreen mode
 * @param showOverlay - Whether to show background overlay
 * @param closeOnOverlayClick - Whether clicking overlay closes modal
 * @param closeOnEscape - Whether pressing Escape closes modal
 */
export function ModalPortal({
  children,
  isOpen,
  onClose,
  portalId = DEFAULT_PORTAL_ID,
  className,
  overlayClassName,
  contentClassName,
  width = EPortalWidth.HALF,
  position = EPortalPosition.RIGHT,
  fullScreen = false,
  showOverlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalPortalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Memoized overlay click handler
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && onClose && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  // close on escape
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && onClose && e.key === "Escape") {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // add event listener for escape
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Memoized style classes
  const modalClasses = useMemo(() => {
    const widthClass = fullScreen ? "w-full h-full" : PORTAL_WIDTH_CLASSES[width];
    const positionClass = fullScreen ? "" : PORTAL_POSITION_CLASSES[position];

    return cn(
      "top-0 h-full bg-white shadow-lg absolute transition-transform duration-300 ease-out",
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
      {showOverlay && (
        <div
          className={cn("absolute inset-0 bg-black/50 transition-colors duration-300", overlayClassName)}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
      <div ref={contentRef} className={cn(modalClasses)} style={{ zIndex: MODAL_Z_INDEX + 1 }} role="document">
        {children}
      </div>
    </div>
  );

  return <PortalWrapper portalId={portalId}>{content}</PortalWrapper>;
}
