import React, { useState, useRef, useEffect } from "react";

// types
import { Props } from "./types";

// Updates the height of a <textarea> when the value changes.
const useAutoSizeTextArea = (textAreaRef: HTMLTextAreaElement | null, value: any) => {
  useEffect(() => {
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

export const TextArea: React.FC<Props> = ({
  id,
  label,
  className = "",
  value,
  placeholder,
  name,
  register,
  mode = "primary",
  rows,
  cols,
  disabled,
  error,
  validations,
  noPadding = false,
  onChange,
  ...rest
}) => {
  const [textareaValue, setTextareaValue] = useState(value ?? "");

  const textAreaRef = useRef<any>(null);

  useAutoSizeTextArea(textAreaRef.current, textareaValue);

  return (
    <>
      {label && (
        <label htmlFor={id} className="mb-2 text-custom-text-200">
          {label}
        </label>
      )}
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        rows={rows}
        cols={cols}
        disabled={disabled}
        {...(register && register(name, validations))}
        ref={(e) => {
          textAreaRef.current = e;
          if (register) register(name).ref(e);
        }}
        onChange={(e) => {
          register && register(name).onChange(e);
          onChange && onChange(e);
          setTextareaValue(e.target.value);
        }}
        className={`no-scrollbar w-full bg-transparent placeholder-custom-text-400 ${
          noPadding ? "" : "px-3 py-2"
        } outline-none ${
          mode === "primary"
            ? "rounded-md border border-custom-border-200"
            : mode === "transparent"
            ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-theme"
            : ""
        } ${error ? "border-red-500" : ""} ${error && mode === "primary" ? "bg-red-100" : ""} ${className}`}
        {...rest}
      />
      {error?.message && <div className="text-sm text-red-500">{error.message}</div>}
    </>
  );
};
