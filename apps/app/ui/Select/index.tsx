import React from "react";
// types
import { Props } from "./types";

const Select: React.FC<Props> = ({
  id,
  label,
  value,
  className,
  name,
  register,
  disabled,
  validations,
  error,
  options,
}) => {
  return (
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
        className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-transparent"
      >
        {options.map((option, index) => (
          <option value={option.value} key={index}>
            {option.label}
          </option>
        ))}
      </select>
      {error?.message && <div className="text-red-500 text-sm">{error.message}</div>}
    </>
  );
};

export default Select;
