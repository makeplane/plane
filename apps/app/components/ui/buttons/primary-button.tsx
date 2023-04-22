// types
import { forwardRef } from "react";
import type { ButtonProps } from "./type";

/**
 *  Primary Button component displays a button with a primary color scheme
 */

export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { className, size, disabled, outline, children, loading, ...rest } = props;
  return (
    <button
      className={`${className} border border-brand-accent font-medium duration-300 ${
        size === "sm"
          ? "rounded px-3 py-2 text-xs"
          : size === "md"
          ? "rounded-md px-3.5 py-2 text-sm"
          : "rounded-lg px-4 py-2 text-base"
      } ${
        disabled
          ? "cursor-not-allowed border-opacity-70 bg-opacity-70 hover:border-opacity-70 hover:bg-opacity-70"
          : ""
      } ${
        outline
          ? "bg-transparent text-brand-accent hover:bg-brand-accent hover:text-white"
          : "bg-brand-accent text-white hover:border-opacity-90 hover:bg-opacity-90"
      }  ${loading ? "cursor-wait" : ""}`}
      disabled={disabled || loading}
      ref={ref}
      {...rest}
    >
      {children}
    </button>
  );
});

PrimaryButton.defaultProps = {
  className: "",
  size: "sm",
  loading: false,
  type: "button",
  disabled: false,
  outline: false,
};

PrimaryButton.displayName = "PrimaryButton";
