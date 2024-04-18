import { useEffect } from "react";

export const useAutoResizeTextArea = (textAreaRef: React.RefObject<HTMLTextAreaElement>) => {
  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const resizeTextArea = () => {
      textArea.style.height = "auto";
      const computedHeight = textArea.scrollHeight + "px";
      textArea.style.height = computedHeight;
    };

    const handleInput = () => resizeTextArea();

    // resize on mount
    resizeTextArea();

    textArea.addEventListener("input", handleInput);
    return () => {
      textArea.removeEventListener("input", handleInput);
    };
  }, [textAreaRef]);
};
