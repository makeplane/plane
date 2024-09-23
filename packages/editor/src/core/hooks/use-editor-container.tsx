import { useState, useEffect, RefObject } from "react";

interface UseEditorContainerWidthOptions {
  maxRetries?: number;
  retryInterval?: number;
}

export const useEditorContainerWidth = (
  containerRef: RefObject<HTMLElement>,
  options: UseEditorContainerWidthOptions = {}
): number => {
  const { maxRetries = 5, retryInterval = 100 } = options;
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    let retryCount = 0;

    const checkEditorContainer = (): void => {
      if (containerRef.current) {
        const editorContainer = containerRef.current.closest(".editor-container") as HTMLElement | null;
        if (editorContainer) {
          setWidth(editorContainer.clientWidth);
          return;
        }
      }

      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkEditorContainer, retryInterval);
      }
    };

    checkEditorContainer();
  }, [containerRef, maxRetries, retryInterval]);

  return width;
};
