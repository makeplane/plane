import React, { useRef } from "react";
// helpers
import { useAutoResizeTextArea } from "../hooks/use-auto-resize-textarea";
import { cn } from "../utils";
// hooks

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  mode?: "primary" | "transparent" | "true-transparent";
  textAreaSize?: "xs" | "sm" | "md";
  hasError?: boolean;
  className?: string;
}

const TextArea = React.forwardRef(function TextArea(
  props: TextAreaProps,
  ref: React.ForwardedRef<HTMLTextAreaElement>
) {
  const {
    id,
    name,
    value = "",
    mode = "primary",
    textAreaSize = "sm",
    hasError = false,
    className = "",
    ...rest
  } = props;
  // refs
  const textAreaRef = useRef<any>(ref);
  // auto re-size
  useAutoResizeTextArea(textAreaRef, value);

  return (
    <textarea
      id={id}
      name={name}
      ref={textAreaRef}
      value={value}
      className={cn(
        "no-scrollbar w-full bg-layer-2 placeholder-(--text-color-placeholder) outline-none",
        {
          "rounded-md border-[0.5px] border-subtle-1": mode === "primary",
          "focus:ring-theme rounded-sm border-none bg-transparent ring-0 transition-all focus:ring-1":
            mode === "transparent",
          "rounded-sm border-none bg-transparent ring-0": mode === "true-transparent",
          "px-1.5 py-1": textAreaSize === "xs",
          "px-3 py-2": textAreaSize === "sm",
          "p-3": textAreaSize === "md",
          "border-danger-strong": hasError,
          "bg-danger-subtle": hasError && mode === "primary",
        },
        className
      )}
      {...rest}
    />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
