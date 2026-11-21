/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FloatingFocusManager, FloatingOverlay, useFloating } from "@floating-ui/react";
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { AddOutline, CloseOutline, DownloadOutline, MinusOutline, NewTabOutline } from "@makeplane/propel/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@makeplane/propel/elements/toolbar";
import { cn } from "@plane/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_SPEED = 0.05;
const ZOOM_STEPS = [0.5, 1, 1.5, 2];

type Props = {
  openerRef?: RefObject<HTMLButtonElement | null>;
  aspectRatio: number;
  downloadSrc: string;
  isFullScreenEnabled: boolean;
  isTouchDevice: boolean;
  src: string;
  toggleFullScreenMode: (val: boolean) => void;
  width: string;
};

function ImageFullScreenModalWithoutPortal(props: Props) {
  const { aspectRatio, isFullScreenEnabled, isTouchDevice, downloadSrc, src, toggleFullScreenMode, width, openerRef } =
    props;
  const {
    refs: { setFloating },
    context,
  } = useFloating({ open: isFullScreenEnabled });
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [lockScroll] = useState(() => {
    const { overflowX, overflowY } = getComputedStyle(document.body);
    return overflowX !== "hidden" || overflowY !== "hidden";
  });
  // refs
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  const [magnification, setMagnification] = useState<number>(1);
  const [initialMagnification, setInitialMagnification] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const widthInNumber = useMemo(() => {
    if (!width) return 0;
    return Number(width.replace("px", ""));
  }, [width]);

  const setImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || !isFullScreenEnabled) return;

      imgRef.current = node;

      const viewportWidth = window.innerWidth * 0.9;
      const viewportHeight = window.innerHeight * 0.75;
      const imageWidth = widthInNumber;
      const imageHeight = imageWidth / aspectRatio;

      const widthRatio = viewportWidth / imageWidth;
      const heightRatio = viewportHeight / imageHeight;

      setInitialMagnification(Math.min(widthRatio, heightRatio));
      setMagnification(1);

      // Reset image position
      node.style.left = "0px";
      node.style.top = "0px";
    },
    [isFullScreenEnabled, widthInNumber, aspectRatio]
  );

  const handleClose = useCallback(() => {
    if (isDragging) return;
    toggleFullScreenMode(false);
    setMagnification(1);
    setInitialMagnification(1);
  }, [isDragging, toggleFullScreenMode]);

  const handleMagnification = useCallback((direction: "increase" | "decrease") => {
    setMagnification((prev) => {
      // Find the appropriate target zoom level based on current magnification
      let targetZoom: number;
      if (direction === "increase") {
        targetZoom = ZOOM_STEPS.find((step) => step > prev) ?? MAX_ZOOM;
      } else {
        // Reverse the array to find the next lower step
        targetZoom = [...ZOOM_STEPS].reverse().find((step) => step < prev) ?? MIN_ZOOM;
      }

      // Reset position when zoom matches initial magnification
      if (targetZoom === 1 && imgRef.current) {
        imgRef.current.style.left = "0px";
        imgRef.current.style.top = "0px";
      }

      return targetZoom;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent | ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" || e.key === "+" || e.key === "=" || e.key === "-") {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") handleClose();
        if (e.key === "+" || e.key === "=") handleMagnification("increase");
        if (e.key === "-") handleMagnification("decrease");
      }
    },
    [handleClose, handleMagnification]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imgRef.current) return;

    const imgWidth = imgRef.current.offsetWidth * magnification;
    const imgHeight = imgRef.current.offsetHeight * magnification;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (imgWidth > viewportWidth || imgHeight > viewportHeight) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragOffset.current = {
        x: parseInt(imgRef.current.style.left || "0"),
        y: parseInt(imgRef.current.style.top || "0"),
      };
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !imgRef.current) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      // Apply the scale factor to the drag movement
      const scaledDx = dx / magnification;
      const scaledDy = dy / magnification;

      imgRef.current.style.left = `${dragOffset.current.x + scaledDx}px`;
      imgRef.current.style.top = `${dragOffset.current.y + scaledDy}px`;
    },
    [isDragging, magnification]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !imgRef.current) return;
    setIsDragging(false);
  }, [isDragging]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!imgRef.current || !isFullScreenEnabled) return;

      e.preventDefault();

      // Handle pinch-to-zoom
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY;
        setMagnification((prev) => {
          const newZoom = prev * (1 - delta * ZOOM_SPEED);
          const clampedZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

          // Reset position when zoom matches initial magnification
          if (clampedZoom === 1 && imgRef.current) {
            imgRef.current.style.left = "0px";
            imgRef.current.style.top = "0px";
          }

          return clampedZoom;
        });
        return;
      }
    },
    [isFullScreenEnabled]
  );

  // Event listeners
  useEffect(() => {
    if (!isFullScreenEnabled) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [isFullScreenEnabled, handleMouseMove, handleMouseUp, handleWheel]);

  const setModalRef = useCallback(
    (node: HTMLDivElement | null) => {
      modalRef.current = node;
      setFloating(node);
    },
    [setFloating]
  );

  if (!isFullScreenEnabled) return null;

  return (
    <FloatingOverlay
      // Preserve a scroll lock already owned by the containing UI.
      lockScroll={lockScroll}
      className={cn("pointer-events-none fixed inset-0 z-50 size-full bg-black/90 opacity-0 transition-opacity", {
        "editor-image-full-screen-modal pointer-events-auto opacity-100": isFullScreenEnabled,
        "cursor-default": !isDragging,
        "cursor-grabbing": isDragging,
      })}
    >
      <FloatingFocusManager
        context={context}
        initialFocus={closeButtonRef}
        returnFocus={openerRef ?? true}
        restoreFocus
        outsideElementsInert
      >
        <div
          ref={setModalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image viewer"
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => {
            if (e.target !== modalRef.current) return;
            e.preventDefault();
            handleClose();
          }}
          className="relative grid size-full place-items-center overflow-hidden"
        >
          <div className="absolute top-10 right-10 z-10">
            <IconButton
              ref={closeButtonRef}
              type="button"
              variant="secondary"
              size="md"
              aria-label="Close image viewer"
              showTooltip={false}
              icon={<Icon icon={CloseOutline} />}
              onClick={handleClose}
            />
          </div>
          <img
            ref={setImageRef}
            src={src}
            alt="Preview"
            className="read-only-image rounded-lg"
            style={{
              width: `${widthInNumber * initialMagnification}px`,
              maxWidth: "none",
              maxHeight: "none",
              aspectRatio,
              position: "relative",
              transform: `scale(${magnification})`,
              transformOrigin: "center",
              transition: "width 0.2s ease, transform 0.2s ease",
            }}
            onMouseDown={handleMouseDown}
          />
          <div className="fixed bottom-10 left-1/2 z-10 -translate-x-1/2">
            <Toolbar size="md" elevation="raised" role="group" aria-label="Image viewer controls">
              <ToolbarGroup role="group" aria-label="Image zoom">
                <ToolbarButton
                  type="button"
                  size="md"
                  labeled={false}
                  onClick={(e) => {
                    if (isTouchDevice) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    handleMagnification("decrease");
                  }}
                  disabled={magnification <= MIN_ZOOM}
                  aria-label="Zoom out"
                >
                  <Icon icon={MinusOutline} />
                </ToolbarButton>
                <span className="w-12 text-center text-body-xs-regular text-secondary tabular-nums">
                  {Math.round(100 * magnification)}%
                </span>
                <ToolbarButton
                  type="button"
                  size="md"
                  labeled={false}
                  onClick={(e) => {
                    if (isTouchDevice) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    handleMagnification("increase");
                  }}
                  disabled={magnification >= MAX_ZOOM}
                  aria-label="Zoom in"
                >
                  <Icon icon={AddOutline} />
                </ToolbarButton>
              </ToolbarGroup>
              {!isTouchDevice && <ToolbarSeparator />}
              {!isTouchDevice && (
                <ToolbarButton
                  type="button"
                  size="md"
                  labeled={false}
                  onClick={() => window.open(downloadSrc, "_blank")}
                  aria-label="Download image"
                >
                  <Icon icon={DownloadOutline} />
                </ToolbarButton>
              )}
              {!isTouchDevice && (
                <ToolbarButton
                  type="button"
                  size="md"
                  labeled={false}
                  onClick={() => window.open(src, "_blank")}
                  aria-label="Open image in new tab"
                >
                  <Icon icon={NewTabOutline} />
                </ToolbarButton>
              )}
            </Toolbar>
          </div>
        </div>
      </FloatingFocusManager>
    </FloatingOverlay>
  );
}

export function ImageFullScreenModal(props: Props) {
  if (!props.isFullScreenEnabled) return null;

  let modal = <ImageFullScreenModalWithoutPortal {...props} />;
  const portal =
    props.openerRef?.current?.closest('[role="dialog"], [role="alertdialog"]') ??
    document.querySelector("#editor-portal");
  if (portal) {
    modal = ReactDOM.createPortal(modal, portal);
  } else {
    console.warn("Portal element #editor-portal not found. Rendering in document.body");
    if (typeof document !== "undefined" && document.body) {
      modal = ReactDOM.createPortal(modal, document.body);
    }
  }
  return modal;
}
