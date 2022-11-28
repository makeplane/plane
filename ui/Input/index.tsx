import React from "react";
// common
import { classNames } from "constants/common";
// types
import { Props } from "./types";

const Input: React.FC<Props> = ({
  label,
  value,
  name,
  register,
  validations,
  error,
  mode = "primary",
  onChange,
  className,
  type,
  id,
  ...rest
}) => {
  return (
    <>
      {label && (
        <label htmlFor={id} className="text-gray-500 mb-2">
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
        className={classNames(
          "mt-1 block w-full px-3 py-2 text-base focus:outline-none sm:text-sm rounded-md bg-transparent",
          mode === "primary" ? "border border-gray-300 rounded-md" : "",
          mode === "transparent"
            ? "bg-transparent border-none transition-all ring-0 focus:ring-1 focus:ring-indigo-500 rounded"
            : "",
          error ? "border-red-500" : "",
          error && mode === "primary" ? "bg-red-100" : "",
          className ?? ""
        )}
        {...rest}
      />
      {error?.message && <div className="text-red-500 text-sm">{error.message}</div>}
    </>
  );
};

export default Input;
