import React, { useEffect } from "react";

const usePeekOverviewOutsideClickDetector = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  issueId: string
) => {
  const handleClick = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      let targetElement = event.target as HTMLElement | null;
      while (targetElement) {
        if (targetElement.id === `issue-${issueId}`) {
          return;
        }
        targetElement = targetElement.parentElement;
      }
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  });
};
export default usePeekOverviewOutsideClickDetector;
