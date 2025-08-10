import React from "react";
import { cn } from "../utils";

export interface AuthForgotPasswordProps {
  onForgotPassword?: () => void;
  className?: string;
  text?: string;
  disabled?: boolean;
}

export const AuthForgotPassword: React.FC<AuthForgotPasswordProps> = ({
  onForgotPassword,
  className = "",
  text = "Forgot your password?",
  disabled = false,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && onForgotPassword) {
      onForgotPassword();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "text-sm text-custom-primary-100 hover:text-custom-primary-200 transition-colors duration-200",
        {
          "opacity-50 cursor-not-allowed": disabled,
          "cursor-pointer": !disabled,
        },
        className
      )}
    >
      {text}
    </button>
  );
};
