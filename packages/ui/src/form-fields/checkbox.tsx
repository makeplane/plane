import * as React from "react";
// helpers
import { cn } from "../../helpers";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  iconClassName?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const {
    id,
    name,
    checked,
    indeterminate = false,
    disabled,
    containerClassName,
    iconClassName,
    className,
    ...rest
  } = props;

  return (
    <div className={cn("relative flex-shrink-0 flex gap-2", containerClassName)}>
      <input
        id={id}
        ref={ref}
        type="checkbox"
        name={name}
        checked={checked}
        className={cn(
          "appearance-none shrink-0 size-4 border rounded-[3px] focus:outline-1 focus:outline-offset-4 focus:outline-custom-primary-50 cursor-pointer",
          {
            "border-custom-border-200 bg-custom-background-80 cursor-not-allowed": disabled,
            "border-custom-border-300 hover:border-custom-border-400 bg-transparent": !disabled,
            "border-custom-primary-40 hover:border-custom-primary-40 bg-custom-primary-100 hover:bg-custom-primary-200":
              !disabled && (checked || indeterminate),
          },
          className
        )}
        disabled={disabled}
        {...rest}
      />
      <svg
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 p-0.5 pointer-events-none outline-none hidden stroke-white",
          {
            block: checked,
            "stroke-custom-text-400 opacity-40": disabled,
          },
          iconClassName
        )}
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
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 p-0.5 pointer-events-none outline-none stroke-white hidden",
          {
            "stroke-custom-text-400 opacity-40": disabled,
            block: indeterminate && !checked,
          },
          iconClassName
        )}
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
