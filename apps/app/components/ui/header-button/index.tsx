import * as React from "react";

type HeaderButtonProps = {
  Icon: any;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  position?: "normal" | "reverse";
};

export const HeaderButton = ({
  Icon,
  label,
  disabled = false,
  onClick,
  className = "",
  position = "normal",
}: HeaderButtonProps) => (
  <>
    <button
      type="button"
      className={`whitespace-nowraps flex w-min items-center gap-x-1 whitespace-nowrap rounded-md border p-2 text-xs font-medium text-gray-600 outline-none hover:bg-gray-100 hover:text-gray-900 ${
        position === "reverse" && "flex-row-reverse"
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  </>
);
