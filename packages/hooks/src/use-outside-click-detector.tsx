import { useEffect } from "react";

export const useOutsideClickDetector = (
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  useCapture = false
) => {
  const handleClick = (event: MouseEvent) => {
    if (ref.current && event.target instanceof HTMLElement && !ref.current.contains(event.target)) {
      // check for the closest element with attribute name data-prevent-outside-click
      const preventOutsideClickElement = event.target.closest("[data-prevent-outside-click]");
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
