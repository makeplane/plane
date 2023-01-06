import React from "react";
// commons
import { classNames } from "constants/common";

type Props = {
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  theme?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "rg" | "md" | "lg";
  disabled?: boolean;
};

const OutlineButton = React.forwardRef<HTMLButtonElement, Props>(
  (
    {
      children,
      onClick,
      type = "button",
      size = "sm",
      className = "",
      theme = "primary",
      disabled = false,
    },
    ref
  ) => {
    return (
      <button
        type={type}
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={classNames(
          className,
          "inline-flex items-center justify-center rounded font-medium duration-300",
          theme === "primary"
            ? `${
                disabled ? "opacity-70" : ""
              } border border-theme text-white shadow-sm hover:bg-theme focus:outline-none`
            : theme === "secondary"
            ? "border bg-transparent hover:bg-gray-100"
            : theme === "success"
            ? `${
                disabled ? "opacity-70" : ""
              } border border-transparent bg-green-500 text-white shadow-sm hover:bg-green-600 focus:outline-none  focus:ring-2 focus:ring-green-500`
            : `${
                disabled ? "opacity-70" : ""
              } border border-red-500 text-red-500 shadow-sm hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500`,
          size === "sm"
            ? "p-2 text-xs"
            : size === "md"
            ? "text-md px-3 py-2"
            : size === "lg"
            ? "text-md px-4 py-2"
            : "px-2.5 py-2 text-sm"
        )}
      >
        {children}
      </button>
    );
  }
);

OutlineButton.displayName = "Button";

export default OutlineButton;
