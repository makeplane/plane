import React from "react";
// types
import { Props } from "./types";

export const Select: React.FC<Props> = ({
  id,
  label,
  value,
  className = "",
  name,
  register,
  disabled,
  validations,
  error,
  options,
  size = "rg",
  fullWidth = true,
}) => (
    <>
      {label && (
        <label htmlFor={id} className="text-gray-500 mb-2">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        {...(register && register(name, validations))}
        disabled={disabled}
        className={`mt-1 block text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-transparent ${
          fullWidth ? "w-full" : ""
        } ${
          size === "rg" ? "px-3 py-2" : size === "lg" ? "p-3" : ""
        } ${className}`}
      >
        {options.map((option, index) => (
          <option value={option.value} key={index}>
            {option.label}
          </option>
        ))}
      </select>
      {error?.message && (
        <div className="text-red-500 text-sm">{error.message}</div>
      )}
    </>
  );
