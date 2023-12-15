import * as React from "react";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  mode?: "primary" | "transparent";
  hasError?: boolean;
  className?: string;
}

// Updates the height of a <textarea> when the value changes.
const useAutoSizeTextArea = (textAreaRef: HTMLTextAreaElement | null, value: any) => {
  React.useEffect(() => {
    if (textAreaRef) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;

      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will product an incorrect value.
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};

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

  const textAreaRef = React.useRef<any>(ref);

  useAutoSizeTextArea(textAreaRef?.current, value);

  return (
    <textarea
      id={id}
      name={name}
      ref={textAreaRef}
      value={value}
      rows={rows}
      cols={cols}
      className={`no-scrollbar w-full bg-transparent px-3 py-2 placeholder-custom-text-400 outline-none ${
        mode === "primary"
          ? "rounded-md border-[0.5px] border-custom-border-200"
          : mode === "transparent"
            ? "focus:ring-theme rounded border-none bg-transparent ring-0 transition-all focus:ring-1"
            : ""
      } ${hasError ? "border-red-500" : ""} ${hasError && mode === "primary" ? "bg-red-100" : ""} ${className}`}
      {...rest}
    />
  );
});

TextArea.displayName = "TextArea";

export { TextArea };
