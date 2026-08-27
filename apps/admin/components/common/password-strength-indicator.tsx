/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CircleCheck } from "lucide-react";
// plane internal packages
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { cn, getPasswordCriteria, getPasswordStrength } from "@plane/utils";

interface StrengthInfo {
  message: string;
  textColor: string;
  activeFragments: number;
}

/**
 * Get strength information including message, color, and active fragments
 */
const getStrengthInfo = (strength: E_PASSWORD_STRENGTH): StrengthInfo => {
  switch (strength) {
    case E_PASSWORD_STRENGTH.EMPTY:
      return {
        message: "Please enter your password",
        textColor: "text-primary",
        activeFragments: 0,
      };
    case E_PASSWORD_STRENGTH.LENGTH_NOT_VALID:
      return {
        message: "Password is too short",
        textColor: "text-danger-primary",
        activeFragments: 1,
      };
    case E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID:
      return {
        message: "Password is weak",
        textColor: "text-orange-500",
        activeFragments: 2,
      };
    case E_PASSWORD_STRENGTH.STRENGTH_VALID:
      return {
        message: "Password is strong",
        textColor: "text-success-primary",
        activeFragments: 3,
      };
    default:
      return {
        message: "Please enter your password",
        textColor: "text-primary",
        activeFragments: 0,
      };
  }
};

/**
 * Get fragment color based on position and active state
 */
const getFragmentColor = (fragmentIndex: number, activeFragments: number): string => {
  if (fragmentIndex >= activeFragments) {
    return "bg-layer-1";
  }

  switch (activeFragments) {
    case 1:
      return "bg-danger-primary";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-success-primary";
    default:
      return "bg-layer-1";
  }
};

export interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
  isFocused?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showCriteria = true,
  isFocused = false,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);
  const criteria = getPasswordCriteria(password);
  const strengthInfo = getStrengthInfo(strength);

  const isPasswordMeterVisible = isFocused ? true : strength === E_PASSWORD_STRENGTH.STRENGTH_VALID ? false : true;

  if ((!password && !showCriteria) || !isPasswordMeterVisible) {
    return null;
  }

  return (
    <div className={cn("space-y-3")}>
      {/* Strength Indicator */}
      <div className="space-y-2">
        <div className="flex w-full gap-1 transition-all duration-300 ease-linear">
          {[0, 1, 2].map((fragmentIndex) => (
            <div
              key={fragmentIndex}
              className={cn(
                "h-1 flex-1 rounded-xs transition-all duration-300 ease-in-out",
                getFragmentColor(fragmentIndex, strengthInfo.activeFragments)
              )}
            />
          ))}
        </div>

        {/* Strength Message */}
        {password && <p className={cn("!text-13 font-medium", strengthInfo.textColor)}>{strengthInfo.message}</p>}
      </div>

      {/* Criteria list */}
      {showCriteria && (
        <div className="flex flex-wrap gap-2">
          {criteria.map((criterion) => (
            <div key={criterion.key} className="flex items-center gap-1.5">
              <div className="flex items-center justify-center p-0.5">
                <CircleCheck
                  className={cn("h-3 w-3 flex-shrink-0", {
                    "text-success-primary": criterion.isValid,
                    "text-primary": !criterion.isValid,
                  })}
                />
              </div>
              <span
                className={cn("!text-11", {
                  "text-success-primary": criterion.isValid,
                  "text-primary": !criterion.isValid,
                })}
              >
                {criterion.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
