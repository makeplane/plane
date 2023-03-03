type TButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
};

export const PrimaryButton: React.FC<TButtonProps> = (props) => {
  const { children, className, onClick, type, disabled, loading, size = "md" } = props;

  return (
    <button
      type={type}
      className={`hover:bg-opacity-90 transition-colors text-white rounded-lg ${
        size === "sm"
          ? "px-2.5 py-1.5 text-sm"
          : size === "md"
          ? "px-3 py-2 text-base"
          : "px-4 py-3 text-lg"
      } ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-theme"} ${className || ""} ${
        loading ? "cursor-wait" : ""
      }`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <div className="flex items-center">{children}</div>
    </button>
  );
};
