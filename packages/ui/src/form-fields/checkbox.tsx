import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  intermediate?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const { id, name, checked, intermediate = false, disabled, className = "", ...rest } = props;

  return (
    <div className={`relative w-full flex gap-2 ${className}`}>
      <input
        id={id}
        ref={ref}
        type="checkbox"
        name={name}
        checked={checked}
        className={`
          appearance-none shrink-0 w-4 h-4 border rounded-[3px] focus:outline-1 focus:outline-offset-4 focus:outline-custom-primary-50
          ${
            disabled
              ? "border-custom-border-200 bg-custom-background-80 cursor-not-allowed"
              : `cursor-pointer ${
                  checked || intermediate
                    ? "border-custom-primary-40 bg-custom-primary-100 hover:bg-custom-primary-200"
                    : "border-custom-border-300 hover:border-custom-border-400 bg-white"
                }`
          }
        `}
        disabled={disabled}
        {...rest}
      />
      <svg
        className={`absolute w-4 h-4 p-0.5 pointer-events-none outline-none ${
          disabled ? "stroke-custom-text-400 opacity-40" : "stroke-white"
        } ${checked ? "block" : "hidden"}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg
        className={`absolute w-4 h-4 p-0.5 pointer-events-none outline-none ${
          disabled ? "stroke-custom-text-400 opacity-40" : "stroke-white"
        } ${intermediate && !checked ? "block" : "hidden"}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.75 4H2.25" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  );
});
Checkbox.displayName = "form-checkbox-field";

export { Checkbox };
