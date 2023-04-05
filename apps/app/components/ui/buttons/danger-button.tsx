// types
import { ButtonProps } from "./type";

export const DangerButton: React.FC<ButtonProps> = ({
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
    className={`${className} border border-red-500 font-medium duration-300 ${
      size === "sm"
        ? "rounded px-3 py-2 text-xs"
        : size === "md"
        ? "rounded-md px-3.5 py-2 text-sm"
        : "rounded-lg px-4 py-2 text-base"
    } ${
      disabled
        ? "cursor-not-allowed bg-opacity-70 border-opacity-70 hover:bg-opacity-70 hover:border-opacity-70"
        : ""
    } ${
      outline
        ? "bg-transparent text-red-500 hover:bg-red-500 hover:text-white"
        : "text-white bg-red-500 hover:border-opacity-90 hover:bg-opacity-90"
    } ${loading ? "cursor-wait" : ""}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {children}
  </button>
);
