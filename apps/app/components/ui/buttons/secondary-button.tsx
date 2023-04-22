// types
import { forwardRef } from "react";
import { ButtonProps } from "./type";

/**
 *  Secondary Button component displays a button with a secondary color scheme
 */

export const SecondaryButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { className, size, disabled, outline, children, loading, ...rest } = props;

  return (
    <button
      className={`${className} border border-brand-base font-medium duration-300 ${
        size === "sm"
          ? "rounded px-3 py-2 text-xs"
          : size === "md"
          ? "rounded-md px-3.5 py-2 text-sm"
          : "rounded-lg px-4 py-2 text-base"
      } ${
        disabled
          ? "cursor-not-allowed border-brand-base bg-brand-surface-1 hover:border-brand-base hover:border-opacity-100 hover:bg-brand-surface-1 hover:bg-opacity-100"
          : ""
      } ${
        outline
          ? "bg-transparent hover:bg-brand-surface-2"
          : "bg-brand-surface-2 hover:border-opacity-70 hover:bg-opacity-70"
      } ${loading ? "cursor-wait" : ""}`}
      disabled={disabled || loading}
      ref={ref}
      {...rest}
    >
      {children}
    </button>
  );
});

SecondaryButton.defaultProps = {
  className: "",
  size: "sm",
  loading: false,
  type: "button",
  disabled: false,
  outline: false,
};

SecondaryButton.displayName = "SecondaryButton";
