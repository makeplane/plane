import React, { useState, useRef } from "react";
// commons
import { classNames } from "constants/common";
// hooks
import useAutosizeTextArea from "lib/hooks/useAutosizeTextArea";
// types
import { Props } from "./types";

const TextArea: React.FC<Props> = ({
  id,
  label,
  className,
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
  onChange,
  ...rest
}) => {
  const [textareaValue, setTextareaValue] = useState(value ?? "");

  const textAreaRef = useRef<any>(null);

  useAutosizeTextArea(textAreaRef.current, textareaValue);

  return (
    <>
      {label && (
        <label htmlFor={id} className="text-gray-500 mb-2">
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
        className={classNames(
          "w-full outline-none px-3 py-2 bg-transparent",
          mode === "primary" ? "border border-gray-300 rounded-md" : "",
          mode === "transparent"
            ? "bg-transparent border-none transition-all ring-0 focus:ring-1 focus:ring-theme rounded"
            : "",
          error ? "border-red-500" : "",
          error && mode === "primary" ? "bg-red-100" : "",
          className ?? ""
        )}
        {...rest}
      ></textarea>
      {error?.message && <div className="text-red-500 text-sm">{error.message}</div>}
    </>
  );
};

export default TextArea;
