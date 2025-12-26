import { CircleCheck } from "lucide-react";
import React from "react";
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { cn, getPasswordStrength, getPasswordCriteria } from "@plane/utils";
import { getStrengthInfo, getFragmentColor } from "./helper";

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
        <div className="flex gap-1 w-full transition-all duration-300 ease-linear">
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
