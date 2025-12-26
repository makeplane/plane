import * as React from "react";
// helpers
import { cn } from "../utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  iconClassName?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef(function Checkbox(props: CheckboxProps, ref: React.ForwardedRef<HTMLInputElement>) {
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
          "appearance-none shrink-0 size-4 border rounded-[3px] focus:outline-1 focus:outline-offset-4 focus:outline-accent-strong cursor-pointer",
          {
            "border-subtle bg-layer-1 cursor-not-allowed": disabled,
            "border-strong hover:border-strong-1 bg-transparent": !disabled,
            "border-accent-strong-40 hover:border-accent-strong-40 bg-accent-primary hover:bg-accent-primary/80":
              !disabled && (checked || indeterminate),

            "border-none": checked,
          },
          className
        )}
        disabled={disabled}
        {...rest}
      />
      <svg
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 p-0.5 pointer-events-none outline-none hidden text-on-color",
          {
            block: checked,
            "text-placeholder opacity-40": disabled,
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
            "stroke-placeholder opacity-40": disabled,
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
        <path d="M5.75 4H2.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});
Checkbox.displayName = "form-checkbox-field";

export { Checkbox };
