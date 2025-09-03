import { useEffect } from "react";

export const usePreventOutsideClick = (
  ref: React.RefObject<HTMLElement> | any,
  callback: (clickedElement: HTMLAnchorElement | null) => void,
  excludeIds: string[] = [],
  useCapture = true
) => {
  const handleClick = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as any)) {
      // Exclude the ids from the excludeIds array
      let targetElement = event.target as HTMLElement | null;
      while (targetElement) {
        if (excludeIds.includes(targetElement.id)) {
          // if the click target is the current issue element, return
          return;
        }
        targetElement = targetElement.parentElement;
      }
      const clickedElement = event.target as HTMLElement;
      // Find nearest anchor element (self or parent) and prevent default and stop propagation
      const linkElement = clickedElement.closest("a") as HTMLAnchorElement | null;
      if (linkElement instanceof HTMLAnchorElement) {
        event.preventDefault();
        event.stopPropagation();
      }
      // check for the closest element with attribute name data-prevent-outside-click
      const preventOutsideClickElement = clickedElement?.closest("[data-prevent-outside-click]");
      // if the closest element with attribute name data-prevent-outside-click is found, return
      if (preventOutsideClickElement) {
        return;
      }
      // pass the linkElementto the callback
      callback(linkElement);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClick, useCapture);
    return () => {
      document.removeEventListener("click", handleClick, useCapture);
    };
  }, []);
};
