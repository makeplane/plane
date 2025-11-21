import React, { useState } from "react";
import type { E_PASSWORD_STRENGTH } from "@plane/constants";
import { cn, getPasswordStrength } from "@plane/utils";
import { PasswordStrengthIndicator } from "../form-fields/password/indicator";
import { AuthInput } from "./auth-input";

export interface AuthPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "autoComplete"> {
  label?: string;
  error?: string;
  showPasswordStrength?: boolean;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  errorClassName?: string;
  autoComplete?: "on" | "off";
  onPasswordChange?: (password: string) => void;
  onPasswordStrengthChange?: (strength: E_PASSWORD_STRENGTH) => void;
}

export function AuthPasswordInput({
  label = "Password",
  error,
  showPasswordStrength = true,
  showPasswordToggle = true,
  containerClassName = "",
  errorClassName = "",
  className = "",
  value = "",
  onChange,
  onPasswordChange,
  onPasswordStrengthChange,
  ...props
}: AuthPasswordInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    onChange?.(e);
    onPasswordChange?.(newPassword);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const passwordStrength = getPasswordStrength(value as string);

  // Notify parent of strength change
  React.useEffect(() => {
    onPasswordStrengthChange?.(passwordStrength);
  }, [passwordStrength, onPasswordStrengthChange]);

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <AuthInput
        {...props}
        type="password"
        label={label}
        error={error}
        showPasswordToggle={showPasswordToggle}
        errorClassName={errorClassName}
        className={className}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="on"
      />
      {showPasswordStrength && value && isFocused && (
        <PasswordStrengthIndicator password={value as string} showCriteria />
      )}
    </div>
  );
}
