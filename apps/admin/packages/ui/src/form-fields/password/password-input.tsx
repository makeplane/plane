import { Eye, EyeClosed } from "lucide-react";
import React, { useState } from "react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showToggle?: boolean;
  error?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  placeholder = "Enter your password",
  className,
  showToggle = true,
  error = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 pr-10 text-custom-text-200 border rounded-md bg-custom-background-100 focus:outline-none focus:ring-2 focus:ring-custom-primary-100 placeholder:text-custom-text-400 focus:border-transparent transition-all duration-200",
          {
            "border-custom-border-300": !error,
            "border-red-500": error,
          },
          className
        )}
        placeholder={placeholder}
      />
      {showToggle && (
        <Tooltip tooltipContent={showPassword ? "Hide password" : "Show password"} position="top">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-custom-text-200 hover:text-custom-text-100 transition-colors duration-200"
          >
            <div className="relative w-4 h-4">
              <Eye
                className={cn(
                  "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out",
                  showPassword ? "opacity-0 scale-75 rotate-12" : "opacity-100 scale-100 rotate-0"
                )}
              />
              <EyeClosed
                className={cn(
                  "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out",
                  showPassword ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-12"
                )}
              />
            </div>
          </button>
        </Tooltip>
      )}
    </div>
  );
};
