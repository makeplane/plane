import React, { useEffect } from "react";

const useOutsideKeydownDetector = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });
};

export default useOutsideKeydownDetector;
