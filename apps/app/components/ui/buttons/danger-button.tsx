// types
import { ButtonProps } from "./type";
import { forwardRef } from "react";

/**
 *  Danger Button component displays a button with a danger color scheme
 */

export const DangerButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { className, size, disabled, outline, children, loading, ...rest } = props;

  return (
    <button
      className={`${className} border border-red-500 font-medium duration-300 ${
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
          ? "bg-transparent text-red-500 hover:bg-red-500 hover:text-white"
          : "bg-red-500 text-white hover:border-opacity-90 hover:bg-opacity-90"
      } ${loading ? "cursor-wait" : ""}`}
      disabled={disabled || loading}
      ref={ref}
      {...rest}
    >
      {children}
    </button>
  );
});

DangerButton.defaultProps = {
  className: "",
  size: "sm",
  loading: false,
  type: "button",
  disabled: false,
  outline: false,
};

DangerButton.displayName = "DangerButton";
