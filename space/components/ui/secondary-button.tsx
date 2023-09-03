interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  outline?: boolean;
  loading?: boolean;
}

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
    className={`${className} border border-custom-border-200 font-medium duration-300 ${
      size === "sm"
        ? "rounded px-3 py-2 text-xs"
        : size === "md"
        ? "rounded-md px-3.5 py-2 text-sm"
        : "rounded-lg px-4 py-2 text-base"
    } ${disabled ? "cursor-not-allowed border-custom-border-200 bg-custom-background-90" : ""} ${
      outline
        ? "bg-transparent hover:bg-custom-background-80"
        : "bg-custom-background-100 hover:border-opacity-70 hover:bg-opacity-70"
    } ${loading ? "cursor-wait" : ""}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {children}
  </button>
);
