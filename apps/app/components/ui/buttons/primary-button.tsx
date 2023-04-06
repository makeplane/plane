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
    className={`${className} border border-skin-base font-medium duration-300 ${
      size === "sm"
        ? "rounded px-3 py-2 text-xs"
        : size === "md"
        ? "rounded-md px-3.5 py-2 text-sm"
        : "rounded-lg px-4 py-2 text-base"
    } ${
      disabled
        ? "cursor-not-allowed border-skin-base bg-gray-300 text-skin-base hover:border-skin-base hover:border-opacity-100 hover:bg-gray-300 hover:bg-opacity-100 hover:text-skin-base"
        : "border-skin-accent"
    } ${
      outline
        ? "bg-transparent hover:bg-skin-accent hover:text-white"
        : "bg-skin-accent hover:border-opacity-90 hover:bg-opacity-90"
    } ${!disabled && !outline ? "text-white" : ""} ${loading ? "cursor-wait" : ""}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {children}
  </button>
);
