import React, { useRef } from "react";
// helpers
import { cn } from "../../helpers";
// hooks
import { useAutoResizeTextArea } from "../hooks/use-auto-resize-textarea";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  mode?: "primary" | "transparent";
  hasError?: boolean;
  className?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => {
  const {
    id,
    name,
    value = "",
    rows = 1,
    cols = 1,
    mode = "primary",
    hasError = false,
    className = "",
    ...rest
  } = props;
  // refs
  const textAreaRef = useRef<any>(ref);
  // auto re-size
  useAutoResizeTextArea(textAreaRef);

  return (
    <textarea
      id={id}
      name={name}
      ref={textAreaRef}
      value={value}
      rows={rows}
      cols={cols}
      className={cn(
        "no-scrollbar w-full bg-transparent px-3 py-2 placeholder-custom-text-400 outline-none",
        {
          "rounded-md border-[0.5px] border-custom-border-200": mode === "primary",
          "focus:ring-theme rounded border-none bg-transparent ring-0 transition-all focus:ring-1":
            mode === "transparent",
          "border-red-500": hasError,
          "bg-red-100": hasError && mode === "primary",
        },
        className
      )}
      {...rest}
    />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
