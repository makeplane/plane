import { useEffect } from "react";

const useKeypress = (key: string, callback: (event: KeyboardEvent) => void) => {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === key) {
        callback(event);
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [key, callback]);
};

export default useKeypress;
