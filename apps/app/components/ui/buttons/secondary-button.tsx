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
    className={`${className} border border-brand-base font-medium duration-300 ${
      size === "sm"
        ? "rounded px-3 py-2 text-xs"
        : size === "md"
        ? "rounded-md px-3.5 py-2 text-sm"
        : "rounded-lg px-4 py-2 text-base"
    } ${disabled ? "cursor-not-allowed border-brand-base bg-brand-surface-1" : ""} ${
      outline
        ? "bg-transparent hover:bg-brand-surface-2"
        : "bg-brand-surface-2 hover:border-opacity-70 hover:bg-opacity-70"
    } ${loading ? "cursor-wait" : ""}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {children}
  </button>
);
