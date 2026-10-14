/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { InputField } from "@makeplane/propel/components/input-field";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { ShowOutline, HideOutline } from "@makeplane/propel/icons";

type TPasswordInputProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showToggle?: boolean;
  error?: boolean;
  autoComplete?: React.HTMLInputAutoCompleteAttribute;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  className,
  showToggle = true,
  error = false,
  autoComplete = "off",
}: TPasswordInputProps) {
  // plane hooks
  const { t } = useTranslation();
  // states
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className={className}>
      <InputField
        size="xl"
        orientation="vertical"
        label={label}
        aria-label={label ? undefined : placeholder}
        data-invalid={error || undefined}
        aria-invalid={error || undefined}
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        endIcon={
          showToggle && (
            <Tooltip
              label={t(showPassword ? "aria_labels.auth_forms.hide_password" : "aria_labels.auth_forms.show_password")}
              side="top"
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex shrink-0 items-center text-secondary transition-colors duration-200 hover:text-primary"
                aria-label={t(
                  showPassword ? "aria_labels.auth_forms.hide_password" : "aria_labels.auth_forms.show_password"
                )}
              >
                <div className="relative h-4 w-4">
                  <ShowOutline
                    className={cn(
                      "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out",
                      showPassword ? "scale-75 rotate-12 opacity-0" : "scale-100 rotate-0 opacity-100"
                    )}
                  />
                  <HideOutline
                    className={cn(
                      "absolute inset-0 h-4 w-4 transition-all duration-300 ease-in-out",
                      showPassword ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-12 opacity-0"
                    )}
                  />
                </div>
              </button>
            </Tooltip>
          )
        }
      />
    </div>
  );
}
