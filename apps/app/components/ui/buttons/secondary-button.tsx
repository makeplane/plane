// types
import { ButtonProps } from "./type";

export const SecondaryButton: React.FC<ButtonProps> = ({
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
        ? "cursor-not-allowed border-skin-base bg-skin-surface-1 hover:border-skin-base hover:border-opacity-100 hover:bg-skin-surface-1 hover:bg-opacity-100"
        : ""
    } ${
      outline
        ? "bg-transparent hover:bg-gray-300"
        : "bg-skin-surface-2 hover:border-opacity-70 hover:bg-opacity-70"
    } ${loading ? "cursor-wait" : ""}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {children}
  </button>
);
