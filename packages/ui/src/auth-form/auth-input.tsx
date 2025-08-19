import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { Input } from "../form-fields/input";
import { cn } from "../utils";

export interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "autoComplete"> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  errorClassName?: string;
  autoComplete?: "on" | "off";
}

const baseContainerClassName = "flex flex-col gap-1.5";

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  showPasswordToggle = false,
  errorClassName = "",
  className = "",
  type = "text",
  ...props
}) => {
  const { id } = props;
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";

  const inputType = isPasswordType && showPasswordToggle && showPassword ? "text" : type;

  return (
    <div className={cn(baseContainerClassName)}>
      {label && (
        <label htmlFor={id} className={cn("text-sm font-semibold text-custom-text-300")}>
          {label}
        </label>
      )}
      <div
        className={cn("relative flex items-center rounded-md border border-custom-border-300 py-2 px-3 transition-all")}
      >
        <Input
          {...props}
          type={inputType}
          className={cn(
            "rounded-md disable-autofill-style h-6 w-full placeholder:text-base placeholder:text-custom-text-400 p-0 border-none",
            {
              "border-red-500": error,
            },
            className
          )}
        />
        {showPasswordToggle && isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>

      {error && <p className={cn("text-sm text-red-500", errorClassName)}>{error}</p>}
    </div>
  );
};
