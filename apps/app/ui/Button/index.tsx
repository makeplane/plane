import React from "react";

type Props = {
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  theme?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "rg" | "md" | "lg";
  disabled?: boolean;
};

// commons
import { classNames } from "constants/common";

const Button = React.forwardRef<HTMLButtonElement, Props>(
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
        ref={ref}
        onClick={onClick}
        type={type}
        disabled={disabled}
        className={classNames(
          "inline-flex items-center rounded justify-center font-medium",
          theme === "primary"
            ? `${
                disabled ? "opacity-70" : ""
              } text-white shadow-sm bg-theme hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent`
            : theme === "secondary"
            ? "border bg-white hover:bg-gray-100"
            : theme === "success"
            ? `${
                disabled ? "opacity-70" : ""
              } text-white shadow-sm bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500  border border-transparent`
            : `${
                disabled ? "opacity-70" : ""
              } text-white shadow-sm bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 border border-transparent`,
          size === "sm"
            ? "p-2 text-xs"
            : size === "md"
            ? "px-3 py-2 text-base"
            : size === "lg"
            ? "px-4 py-2 text-base"
            : "px-2.5 py-2 text-sm",
          className
        )}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
