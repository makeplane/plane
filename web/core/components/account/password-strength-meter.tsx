"use client";

import { FC, useMemo } from "react";
import { useTranslation } from "@plane/i18n";
// import { CircleCheck } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
import {
  E_PASSWORD_STRENGTH,
  // PASSWORD_CRITERIA,
  getPasswordStrength,
} from "@/helpers/password.helper";

type TPasswordStrengthMeter = {
  password: string;
  isFocused?: boolean;
};

export const PasswordStrengthMeter: FC<TPasswordStrengthMeter> = (props) => {
  const { password, isFocused = false } = props;
  const { t } = useTranslation();
  // derived values
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthBars = useMemo(() => {
    switch (strength) {
      case E_PASSWORD_STRENGTH.EMPTY: {
        return {
          bars: [`bg-custom-text-100`, `bg-custom-text-100`, `bg-custom-text-100`],
          text: t("auth.common.password.errors.empty"),
          textColor: "text-custom-text-100",
        };
      }
      case E_PASSWORD_STRENGTH.LENGTH_NOT_VALID: {
        return {
          bars: [`bg-red-500`, `bg-custom-text-100`, `bg-custom-text-100`],
          text: t("auth.common.password.errors.length"),
          textColor: "text-red-500",
        };
      }
      case E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID: {
        return {
          bars: [`bg-red-500`, `bg-custom-text-100`, `bg-custom-text-100`],
          text: t("auth.common.password.errors.strength.weak"),
          textColor: "text-red-500",
        };
      }
      case E_PASSWORD_STRENGTH.STRENGTH_VALID: {
        return {
          bars: [`bg-green-500`, `bg-green-500`, `bg-green-500`],
          text: t("auth.common.password.errors.strength.strong"),
          textColor: "text-green-500",
        };
      }
      default: {
        return {
          bars: [`bg-custom-text-100`, `bg-custom-text-100`, `bg-custom-text-100`],
          text: t("auth.common.password.errors.empty"),
          textColor: "text-custom-text-100",
        };
      }
    }
  }, [strength,t]);

  const isPasswordMeterVisible = isFocused ? true : strength === E_PASSWORD_STRENGTH.STRENGTH_VALID ? false : true;

  if (!isPasswordMeterVisible) return <></>;
  return (
    <div className="w-full space-y-2 pt-2">
      <div className="space-y-1.5">
        <div className="relative flex items-center gap-2">
          {strengthBars?.bars.map((color, index) => (
            <div key={`${color}-${index}`} className={cn("w-full h-1 rounded-full", color)} />
          ))}
        </div>
        <div className={cn(`text-xs font-medium text-custom-text-100`, strengthBars?.textColor)}>
          {strengthBars?.text}
        </div>
      </div>

      {/* <div className="relative flex flex-wrap gap-x-4 gap-y-2">
        {PASSWORD_CRITERIA.map((criteria) => (
          <div
            key={criteria.key}
            className={cn(
              "relative flex items-center gap-1 text-xs",
              criteria.isCriteriaValid(password) ? `text-green-500/70` : "text-custom-text-300"
            )}
          >
            <CircleCheck width={14} height={14} />
            {criteria.label}
          </div>
        ))}
      </div> */}
    </div>
  );
};
