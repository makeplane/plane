import * as React from "react";
import { Input as BaseInput } from "@base-ui-components/react/input";
// helpers
import { cn } from "../utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mode?: "primary" | "transparent" | "true-transparent";
  inputSize?: "xs" | "sm" | "md";
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    id,
    type,
    name,
    mode = "primary",
    inputSize = "sm",
    hasError = false,
    className = "",
    autoComplete = "off",
    ...rest
  } = props;

  return (
    <BaseInput
      id={id}
      ref={ref}
      type={type}
      name={name}
      className={cn(
        "block rounded-md bg-transparent text-sm placeholder-custom-text-400 focus:outline-none",
        {
          "rounded-md border-[0.5px] border-custom-border-200": mode === "primary",
          "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-custom-primary":
            mode === "transparent",
          "rounded border-none bg-transparent ring-0": mode === "true-transparent",
          "border-red-500": hasError,
          "px-1.5 py-1": inputSize === "xs",
          "px-3 py-2": inputSize === "sm",
          "p-3": inputSize === "md",
        },
        className
      )}
      aria-invalid={hasError || undefined}
      autoComplete={autoComplete}
      {...rest}
    />
  );
});

Input.displayName = "form-input-field";

export { Input };
