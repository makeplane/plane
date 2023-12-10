import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mode?: "primary" | "transparent" | "true-transparent";
  inputSize?: "sm" | "md";
  hasError?: boolean;
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { id, type, name, mode = "primary", inputSize = "sm", hasError = false, className = "", ...rest } = props;

  return (
    <input
      id={id}
      ref={ref}
      type={type}
      name={name}
      className={`block rounded-md bg-transparent text-sm placeholder-custom-text-400 focus:outline-none ${
        mode === "primary"
          ? "rounded-md border-[0.5px] border-custom-border-200"
          : mode === "transparent"
            ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-custom-primary"
            : mode === "true-transparent"
              ? "rounded border-none bg-transparent ring-0"
              : ""
      } ${hasError ? "border-red-500" : ""} ${hasError && mode === "primary" ? "bg-red-500/20" : ""} ${
        inputSize === "sm" ? "px-3 py-2" : inputSize === "md" ? "p-3" : ""
      } ${className}`}
      {...rest}
    />
  );
});

Input.displayName = "form-input-field";

export { Input };
