import * as React from "react";

export interface InputProps {
  type: string;
  id: string;
  value: string;
  name: string;
  onChange: () => void;
  className?: string;
  mode?: "primary" | "transparent" | "true-transparent";
  size?: "sm" | "md" | "lg";
  hasError?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    id,
    type,
    value,
    name,
    onChange,
    className = "",
    mode = "primary",
    size = "md",
    hasError = false,
    placeholder = "",
    disabled = false,
  } = props;

  return (
    <input
      id={id}
      ref={ref}
      type={type}
      value={value}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`block rounded-md bg-transparent text-sm focus:outline-none placeholder-custom-text-400 ${
        mode === "primary"
          ? "rounded-md border border-custom-border-200"
          : mode === "transparent"
          ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-custom-primary"
          : mode === "true-transparent"
          ? "rounded border-none bg-transparent ring-0"
          : ""
      } ${hasError ? "border-red-500" : ""} ${
        hasError && mode === "primary" ? "bg-red-500/20" : ""
      } ${
        size === "sm" ? "px-3 py-2" : size === "lg" ? "p-3" : ""
      } ${className}`}
    />
  );
});

Input.displayName = "form-input-field";

export { Input };
