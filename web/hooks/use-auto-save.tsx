import { useEffect, useRef } from "react";
import { debounce } from "lodash"; // You can use lodash or implement your own debounce function

const AUTO_SAVE_TIME = 10000;

const useAutoSave = (handleSaveDescription: () => void) => {
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const handleSaveDescriptionRef = useRef(handleSaveDescription);

  // Update the ref to the latest handleSaveDescription function
  useEffect(() => {
    handleSaveDescriptionRef.current = handleSaveDescription;
  }, [handleSaveDescription]);

  useEffect(() => {
    const intervalCallback = () => {
      handleSaveDescriptionRef.current();
    };

    intervalIdRef.current = setInterval(intervalCallback, AUTO_SAVE_TIME);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // debounce the function so that excessive calls to handleSaveDescription don't cause multiple calls to the server
    const debouncedSave = debounce(() => {
      handleSaveDescriptionRef.current();

      if (intervalIdRef.current) {
        // clear the interval after saving manually
        clearInterval(intervalIdRef.current);
        // then reset the interval for auto-save to keep working
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
