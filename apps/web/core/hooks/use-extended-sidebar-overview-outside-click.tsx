import React, { useEffect } from "react";

const useExtendedSidebarOutsideClickDetector = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  targetId: string
) => {
  const handleClick = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      // check for the closest element with attribute name data-prevent-outside-click
      const preventOutsideClickElement = (event.target as HTMLElement | undefined)?.closest(
        "[data-prevent-outside-click]"
      );
      // if the closest element with attribute name data-prevent-outside-click is found, return
      if (preventOutsideClickElement) {
        return;
      }
      // check if the click target is the current issue element or its children
      let targetElement = event.target as HTMLElement | null;
      while (targetElement) {
        if (targetElement.id === targetId) {
          // if the click target is the current issue element, return
          return;
        }
        targetElement = targetElement.parentElement;
      }
      const delayOutsideClickElement = (event.target as HTMLElement | undefined)?.closest("[data-delay-outside-click]");
      if (delayOutsideClickElement) {
        // if the click target is the closest element with attribute name data-delay-outside-click, delay the callback
        setTimeout(() => {
          callback();
        }, 0);
        return;
      }
      // else, call the callback immediately
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);
};

export default useExtendedSidebarOutsideClickDetector;
