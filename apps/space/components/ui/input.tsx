import React, { forwardRef, Ref } from "react";

// types
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  mode?: "primary" | "transparent" | "trueTransparent";
  error?: boolean;
  inputSize?: "rg" | "lg";
  fullWidth?: boolean;
}

export const Input = forwardRef((props: Props, ref: Ref<HTMLInputElement>) => {
  const { mode = "primary", error, className = "", type, fullWidth = true, id, inputSize = "rg", ...rest } = props;

  return (
    <input
      id={id}
      ref={ref}
      type={type}
      className={`block rounded-md bg-transparent text-sm focus:outline-none placeholder-custom-text-400 ${
        mode === "primary"
          ? "rounded-md border border-custom-border-200"
          : mode === "transparent"
          ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-custom-primary"
          : mode === "trueTransparent"
          ? "rounded border-none bg-transparent ring-0"
          : ""
      } ${error ? "border-red-500" : ""} ${error && mode === "primary" ? "bg-red-500/20" : ""} ${
        fullWidth ? "w-full" : ""
      } ${inputSize === "rg" ? "px-3 py-2" : inputSize === "lg" ? "p-3" : ""} ${className}`}
      {...rest}
    />
  );
});

Input.displayName = "Input";

export default Input;
