import React, { useEffect } from "react";

export const useOutsidePointerClickDetector = (
  ref: React.RefObject<HTMLElement> | any,
  callback: () => void,
  useCapture = false,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const outsideClickEvent = typeof window !== "undefined" && "PointerEvent" in window ? "pointerdown" : "mousedown";
    const handleClick = (event: MouseEvent | PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as any)) {
        // check for the closest element with attribute name data-prevent-outside-click
        const preventOutsideClickElement = (event.target as unknown as HTMLElement | undefined)?.closest(
          "[data-prevent-outside-click]"
        );
        // if the closest element with attribute name data-prevent-outside-click is found, return
        if (preventOutsideClickElement) {
          return;
        }
        // else call the callback
        callback();
      }
    };
    const onDocumentPointerDown = (event: Event) => {
      handleClick(event as MouseEvent | PointerEvent);
    };

    document.addEventListener(outsideClickEvent, onDocumentPointerDown, useCapture);
    return () => {
      document.removeEventListener(outsideClickEvent, onDocumentPointerDown, useCapture);
    };
  }, [enabled, ref, callback, useCapture]);
};
