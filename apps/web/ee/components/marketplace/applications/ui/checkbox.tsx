import React from "react";
import { cn } from "@plane/utils";

interface CustomCheckboxProps {
  label: string;
  checked: boolean;
  className?: string;
  onChange: (value: boolean) => void;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ label, checked, className = "", onChange }) => {
  const handleClick = (value: boolean) => {
    onChange(value);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => handleClick(!checked)}>
        <div
          className={cn(
            "flex-shrink-0 w-4 h-4 p-1 relative flex justify-center items-center border border-custom-border-300 overflow-hidden rounded-sm transition-all",
            { "border-custom-primary-100": checked }
          )}
        >
          <div
            className={cn("w-full h-full bg-custom-background-80 transition-all", {
              "bg-custom-primary-100": checked,
            })}
          />
        </div>
        <div className="text-sm text-custom-text-300">{label}</div>
      </div>
    </div>
  );
};
