/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback, useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { LockIcon, ChevronDownIcon } from "@plane/propel/icons";
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

export function SetPasswordRoot({ onPasswordChange, onConfirmPasswordChange, disabled = false }: SetPasswordRootProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [passwordState, setPasswordState] = useState<PasswordState>({
    password: "",
    confirmPassword: "",
  });
  // i18n
  const { t } = useTranslation();

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
      `w-4 h-4 text-placeholder transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-180" : "rotate-0"}`,
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
    <div className={`flex flex-col rounded-lg overflow-hidden transition-all duration-300 ease-in-out bg-surface-2`}>
      <div
        className={cn(
          "flex items-center justify-between transition-colors duration-200 px-3 py-2 text-13",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          isExpanded && "pb-1"
        )}
        onClick={handleToggleExpand}
      >
        <div className="flex items-center gap-1 text-tertiary">
          <LockIcon className="size-3" />
          <span className="font-medium">{t("onboarding.profile.form.password.title")}</span>
          <span>{t("onboarding.profile.form.password.optional")}</span>
        </div>
        <div className="flex items-center gap-2 text-placeholder">
          <ChevronDownIcon className={chevronIconClasses} />
        </div>
      </div>

      <div className={expandedContentClasses}>
        {/* Password input */}
        <div className="flex flex-col gap-2 transform transition-all duration-300 ease-in-out pt-1">
          <PasswordInput
            id="password"
            value={passwordState.password}
            onChange={(value) => handlePasswordChange("password", value)}
            placeholder={t("onboarding.profile.form.password.title")}
            className="transition-all duration-200"
          />
          {passwordState.password.length > 0 && <PasswordStrengthIndicator password={passwordState.password} />}
        </div>

        <div className="flex flex-col gap-2 pb-2">
          {/* Confirm password label */}
          <div className="text-tertiary font-medium transform transition-all duration-300 ease-in-out delay-75 text-13">
            {t("onboarding.profile.form.password.confirm_title")}
          </div>

          {/* Confirm password input */}
          <div className="transform transition-all duration-300 ease-in-out delay-100">
            <PasswordInput
              id="confirm-password"
              value={passwordState.confirmPassword}
              onChange={(value) => handlePasswordChange("confirmPassword", value)}
              placeholder={t("onboarding.profile.form.password.confirm_title")}
              className="transition-all duration-200"
            />
            {hasPasswordMismatch && (
              <p className="text-11 text-danger-primary mt-1">{t("onboarding.profile.form.password.mismatch")}</p>
            )}
            {isPasswordValid && (
              <p className="text-11 text-success-primary mt-1">{t("onboarding.profile.form.password.match")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
