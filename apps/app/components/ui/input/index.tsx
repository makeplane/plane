import * as React from "react";
// common
import { Props } from "./types";
// types

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
      <label htmlFor={id} className="mb-2 text-gray-500">
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
      className={`block rounded-md bg-transparent text-sm focus:outline-none ${
        mode === "primary"
          ? "rounded-md border border-gray-300"
          : mode === "transparent"
          ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-indigo-500"
          : ""
      } ${error ? "border-red-500" : ""} ${error && mode === "primary" ? "bg-red-100" : ""} ${
        fullWidth ? "w-full" : ""
      } ${size === "rg" ? "px-3 py-2" : size === "lg" ? "p-3" : ""} ${className}`}
      {...rest}
    />
    {error?.message && <div className="text-sm text-red-500">{error.message}</div>}
  </>
);
