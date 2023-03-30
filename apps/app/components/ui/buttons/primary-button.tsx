// types
import { ButtonProps } from "./type";

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  size = "sm",
  outline = false,
}) => (
  <button
    type={type}
    className={`${className} border font-medium duration-300 ${
      size === "sm"
        ? "rounded px-3 py-2 text-xs"
        : size === "md"
        ? "rounded-md px-3.5 py-2 text-sm"
        : "rounded-lg px-4 py-2 text-base"
    } ${
      disabled
        ? "cursor-not-allowed border-gray-300 bg-gray-300 text-black hover:border-gray-300 hover:border-opacity-100 hover:bg-gray-300 hover:bg-opacity-100 hover:text-black"
        : "border-theme"
    } ${
      outline
        ? "bg-transparent hover:bg-theme hover:text-white"
        : "bg-theme hover:border-opacity-90 hover:bg-opacity-90"
    } ${!disabled && !outline ? "text-white" : ""} ${loading ? "cursor-wait" : ""}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {children}
  </button>
);
