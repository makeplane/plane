"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Lock, ChevronDown } from "lucide-react";
import { PasswordInput, PasswordStrengthIndicator } from "@plane/ui";
import { cn } from "@plane/utils";

interface PasswordState {
  password: string;
  confirmPassword: string;
}

interface SetPasswordRootProps {
  onPasswordChange?: (password: string) => void;
  onConfirmPasswordChange?: (confirmPassword: string) => void;
  disabled?: boolean;
}

export const SetPasswordRoot: React.FC<SetPasswordRootProps> = ({
  onPasswordChange,
  onConfirmPasswordChange,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [passwordState, setPasswordState] = useState<PasswordState>({
    password: "",
    confirmPassword: "",
  });

  const handleToggleExpand = useCallback(() => {
    if (disabled) return;
    setIsExpanded((prev) => !prev);
  }, [disabled]);

  const handlePasswordChange = useCallback(
    (field: keyof PasswordState, value: string) => {
      setPasswordState((prev) => {
        const newState = { ...prev, [field]: value };

        // Notify parent component when password changes
        if (field === "password" && onPasswordChange) {
          onPasswordChange(value);
        }
        if (field === "confirmPassword" && onConfirmPasswordChange) {
          onConfirmPasswordChange(value);
        }

        return newState;
      });
    },
    [onPasswordChange, onConfirmPasswordChange]
  );

  const isPasswordValid = useMemo(() => {
    const { password, confirmPassword } = passwordState;
    return password.length >= 8 && password === confirmPassword;
  }, [passwordState]);

  const hasPasswordMismatch = useMemo(() => {
    const { password, confirmPassword } = passwordState;
    return confirmPassword.length > 0 && password !== confirmPassword;
  }, [passwordState]);

  const chevronIconClasses = useMemo(
    () =>
      `w-4 h-4 text-custom-text-400 transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-180" : "rotate-0"}`,
    [isExpanded]
  );

  const expandedContentClasses = useMemo(
    () =>
      `flex flex-col gap-4 transition-all duration-300 ease-in-out overflow-hidden px-3 ${
        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`,
    [isExpanded]
  );

  return (
    <div
      className={`flex flex-col rounded-lg overflow-hidden transition-all duration-300 ease-in-out bg-custom-background-90`}
    >
      <div
        className={cn(
          "flex items-center justify-between transition-colors duration-200 px-3 py-2 text-sm",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          isExpanded && "pb-1"
        )}
        onClick={handleToggleExpand}
      >
        <div className="flex items-center gap-1 text-custom-text-300">
          <Lock className="size-3" />
          <span className="font-medium">Set a password</span>
          <span>{`(Optional)`}</span>
        </div>
        <div className="flex items-center gap-2 text-custom-text-400">
          <ChevronDown className={chevronIconClasses} />
        </div>
      </div>

      <div className={expandedContentClasses}>
        {/* Password input */}
        <div className="flex flex-col gap-2 transform transition-all duration-300 ease-in-out pt-1">
          <PasswordInput
            id="password"
            value={passwordState.password}
            onChange={(value) => handlePasswordChange("password", value)}
            placeholder="Set a password"
            className="transition-all duration-200"
          />
          {passwordState.password.length > 0 && <PasswordStrengthIndicator password={passwordState.password} />}
        </div>

        <div className="flex flex-col gap-2 pb-2">
          {/* Confirm password label */}
          <div className="text-custom-text-300 font-medium transform transition-all duration-300 ease-in-out delay-75 text-sm">
            Confirm password
          </div>

          {/* Confirm password input */}
          <div className="transform transition-all duration-300 ease-in-out delay-100">
            <PasswordInput
              id="confirm-password"
              value={passwordState.confirmPassword}
              onChange={(value) => handlePasswordChange("confirmPassword", value)}
              placeholder="Confirm password"
              className="transition-all duration-200"
            />
            {hasPasswordMismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            {isPasswordValid && <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
