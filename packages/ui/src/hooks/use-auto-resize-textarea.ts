import { useLayoutEffect } from "react";

export const useAutoResizeTextArea = (
  textAreaRef: React.RefObject<HTMLTextAreaElement>,
  value: string | number | readonly string[]
) => {
  useLayoutEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    // We need to reset the height momentarily to get the correct scrollHeight for the textarea
    textArea.style.height = "0px";
    const scrollHeight = textArea.scrollHeight;
    textArea.style.height = scrollHeight + "px";
  }, [textAreaRef, value]);
};
