import * as React from "react";

// types
import { Props } from "./types";

export const Input: React.FC<Props> = ({
  label,
  value,
  name,
  register,
  validations,
  error,
  mode = "primary",
  onChange,
  className = "",
  type,
  id,
  size = "rg",
  fullWidth = true,
  ...rest
}) => (
  <>
    {label && (
      <label htmlFor={id} className="text-custom-text-200 mb-2">
        {label}
      </label>
    )}
    <input
      type={type}
      id={id}
      value={value}
      {...(register && register(name, validations))}
      onChange={(e) => {
        register && register(name).onChange(e);
        onChange && onChange(e);
      }}
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
      } ${size === "rg" ? "px-3 py-2" : size === "lg" ? "p-3" : ""} ${className}`}
      {...rest}
    />
    {error?.message && <div className="text-sm text-red-500">{error.message}</div>}
  </>
);
