import { useEffect, useRef } from "react";
import { debounce } from "lodash";

const AUTO_SAVE_TIME = 10000;

const useAutoSave = (handleSaveDescription: (forceSync?: boolean, yjsAsUpdate?: Uint8Array) => void) => {
  const intervalIdRef = useRef<any>(null);
  const handleSaveDescriptionRef = useRef(handleSaveDescription);

  // Update the ref to always point to the latest handleSaveDescription
  useEffect(() => {
    handleSaveDescriptionRef.current = handleSaveDescription;
  }, [handleSaveDescription]);

  // Set up the interval to run every 10 seconds
  useEffect(() => {
    intervalIdRef.current = setInterval(() => {
      try {
        handleSaveDescriptionRef.current(true);
      } catch (error) {
        console.error("Autosave before manual save failed:", error);
      }
    }, AUTO_SAVE_TIME);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // Debounced save function for manual save (Ctrl+S or Cmd+S) and clearing the
  // interval for auto save and setting up the interval again
  useEffect(() => {
    const debouncedSave = debounce(() => {
      try {
        handleSaveDescriptionRef.current();
      } catch (error) {
        console.error("Manual save failed:", error);
      }

      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = setInterval(() => {
          try {
            handleSaveDescriptionRef.current(true);
          } catch (error) {
            console.error("Autosave after manual save failed:", error);
          }
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
