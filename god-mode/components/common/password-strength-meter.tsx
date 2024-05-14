"use client";

import zxcvbn from "zxcvbn";
// helpers
import { cn } from "@/helpers/common.helper";
// icons
import { CircleCheck } from "lucide-react";

type Props = {
  password: string;
};

export const PasswordStrengthMeter: React.FC<Props> = (props: Props) => {
  const { password } = props;

  // bar colors
  const greyColor = "#F0F0F3";
  const redColor = "#DC3E42";
  const yellowColor = "#FFBA18";
  const greenColor = "#3E9B4F";

  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 8) return 1;

    const result = zxcvbn(password);
    return result.score;
  };

  const renderStrengthBar = () => {
    const strength = getPasswordStrength();
    let bars = [];
    let text = "";
    let textColor = "";

    if (password.length === 0) {
      bars = [`bg-[${greyColor}]`, `bg-[${greyColor}]`, `bg-[${greyColor}]`];
      text = "Password requirements";
    } else if (password.length < 8) {
      bars = [`bg-[${redColor}]`, `bg-[${greyColor}]`, `bg-[${greyColor}]`];
      text = "Password is too short";
      textColor = `text-[${redColor}]`;
    } else if (strength < 3) {
      bars = [`bg-[${yellowColor}]`, `bg-[${yellowColor}]`, `bg-[${greyColor}]`];
      text = "Password is weak";
      textColor = `text-[${yellowColor}]`;
    } else {
      bars = [`bg-[${greenColor}]`, `bg-[${greenColor}]`, `bg-[${greenColor}]`];
      text = "Password is strong";
      textColor = `text-[${greenColor}]`;
    }

    return (
      <>
        <div className="flex w-full gap-1.5">
          {bars.map((color, index) => (
            <div key={index} className={cn("w-full h-1 rounded-full", color)} />
          ))}
        </div>
        <p className={cn("text-xs font-medium py-1", textColor)}>{text}</p>
      </>
    );
  };

  const renderPasswordCriteria = () => {
    const criteria = [
      { label: "Min 8 characters", isValid: password.length >= 8 },
      { label: "Min 1 upper-case letter", isValid: /[A-Z]/.test(password) },
      { label: "Min 1 number", isValid: /\d/.test(password) },
      { label: "Min 1 special character", isValid: /[!@#$%^&*]/.test(password) },
    ];

    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {criteria.map((criterion, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              criterion.isValid ? `text-[${greenColor}]` : "text-custom-text-400"
            )}
          >
            <CircleCheck width={14} height={14} />
            {criterion.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full p-1">
      {renderStrengthBar()}
      {renderPasswordCriteria()}
    </div>
  );
};
