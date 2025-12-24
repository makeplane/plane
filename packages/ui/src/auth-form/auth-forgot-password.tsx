import React from "react";
import { cn } from "../utils";

export interface AuthForgotPasswordProps {
  onForgotPassword?: () => void;
  className?: string;
  text?: string;
  disabled?: boolean;
}

export function AuthForgotPassword({
  onForgotPassword,
  className = "",
  text = "Forgot your password?",
  disabled = false,
}: AuthForgotPasswordProps) {
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
        "text-13 text-accent-primary hover:text-accent-secondary transition-colors duration-200",
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
}
