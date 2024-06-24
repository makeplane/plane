import { useEffect, useRef } from "react";
import { debounce } from "lodash"; // You can use lodash or implement your own debounce function

const AUTO_SAVE_TIME = 10000;

const useAutoSave = (handleSaveDescription: () => void) => {
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const handleSaveDescriptionRef = useRef(handleSaveDescription);

  // Update the ref to always point to the latest handleSaveDescription
  useEffect(() => {
    handleSaveDescriptionRef.current = handleSaveDescription;
  }, [handleSaveDescription]);

  // Set up the interval to run every 10 seconds
  useEffect(() => {
    intervalIdRef.current = setInterval(() => {
      handleSaveDescriptionRef.current();
    }, AUTO_SAVE_TIME);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // Debounced save function for manual save (Ctrl+S or Cmd+S)
  useEffect(() => {
    const debouncedSave = debounce(() => {
      handleSaveDescriptionRef.current();

      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = setInterval(() => {
          handleSaveDescriptionRef.current();
        }, AUTO_SAVE_TIME);
      }
    }, 500);

    const handleSave = (e: KeyboardEvent) => {
      const { ctrlKey, metaKey, key } = e;
      const cmdClicked = ctrlKey || metaKey;

      if (cmdClicked && key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        debouncedSave();
      }
    };

    window.addEventListener("keydown", handleSave);

    return () => {
      window.removeEventListener("keydown", handleSave);
    };
  }, []);
};

export default useAutoSave;
