import type React from "react";
import { useEffect } from "react";

export const useOutsideClickDetector = (
  ref: React.RefObject<HTMLElement> | any,
  callback: () => void,
  useCapture = false
) => {
  const handleClick = (event: MouseEvent) => {
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

  useEffect(() => {
    document.addEventListener("mousedown", handleClick, useCapture);
    return () => {
      document.removeEventListener("mousedown", handleClick, useCapture);
    };
  });
};
