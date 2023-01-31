import * as React from "react";

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  theme?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "rg" | "md" | "lg";
  disabled?: boolean;
  largePadding?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      onClick,
      type = "button",
      size = "sm",
      className = "",
      theme = "primary",
      disabled = false,
      largePadding,
    },
    ref
  ) => (
    <button
      ref={ref}
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded font-medium duration-300 ${
        theme === "primary"
          ? `${
              disabled ? "opacity-70" : ""
            } border border-transparent bg-gray-200 shadow-sm hover:bg-gray-300 focus:outline-none`
          : theme === "secondary"
          ? "border border-gray-300 bg-transparent hover:bg-gray-200"
          : theme === "success"
          ? `${
              disabled ? "opacity-70" : ""
            } border border-transparent bg-green-500 text-white shadow-sm hover:bg-green-600 focus:outline-none  focus:ring-2 focus:ring-green-500`
          : `${
              disabled ? "opacity-70" : ""
            } border border-transparent bg-red-500 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500`
      } ${
        size === "sm"
          ? "p-2 text-xs"
          : size === "md"
          ? "text-md px-3 py-2"
          : size === "lg"
          ? "text-md px-4 py-2"
          : "px-2.5 py-2 text-sm"
      } ${largePadding ? "px-8" : ""} ${className}`}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";
