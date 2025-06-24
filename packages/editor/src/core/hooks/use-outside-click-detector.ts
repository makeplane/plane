import React, { useCallback, useEffect } from "react";

export const useOutsideClickDetector = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  useCapture = false
) => {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
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
    },
    [callback, ref]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClick, useCapture);
    return () => {
      document.removeEventListener("mousedown", handleClick, useCapture);
    };
  }, [handleClick, useCapture]);
};
