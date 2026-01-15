import React, { useState } from "react";
import { cn } from "@plane/utils";
import { AuthInput } from "./auth-input";

export interface AuthConfirmPasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "autoComplete"
> {
  password: string;
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  autoComplete?: "on" | "off";
  onPasswordMatchChange?: (matches: boolean) => void;
}

export function AuthConfirmPasswordInput({
  password,
  label = "Confirm Password",
  error,
  showPasswordToggle = true,
  containerClassName = "",
  errorClassName = "",
  className = "",
  value = "",
  onChange,
  onPasswordMatchChange,
  ...props
}: AuthConfirmPasswordInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const confirmPassword = value as string;
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const showMatchError =
    confirmPassword.length > 0 && !passwordsMatch && (!isFocused || confirmPassword.length >= password.length);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    onChange?.(e);
    onPasswordMatchChange?.(password === newConfirmPassword && password.length > 0);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getError = () => {
    if (error) return error;
    if (showMatchError) return "Passwords don't match";
    return "";
  };

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <AuthInput
        {...props}
        type="password"
        label={label}
        error={getError()}
        showPasswordToggle={showPasswordToggle}
        errorClassName={errorClassName}
        className={className}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="on"
      />
      {confirmPassword && passwordsMatch && <p className="text-13 text-success-primary">Passwords match</p>}
    </div>
  );
}
