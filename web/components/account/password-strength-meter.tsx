// icons
import { CircleCheck } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
import { getPasswordStrength } from "@/helpers/password.helper";

type Props = {
  password: string;
};

export const PasswordStrengthMeter: React.FC<Props> = (props: Props) => {
  const { password } = props;

  const strength = getPasswordStrength(password);
  let bars = [];
  let text = "";
  let textColor = "";

  if (password.length === 0) {
    bars = [`bg-[#F0F0F3]`, `bg-[#F0F0F3]`, `bg-[#F0F0F3]`];
    text = "Password requirements";
  } else if (password.length < 8) {
    bars = [`bg-[#DC3E42]`, `bg-[#F0F0F3]`, `bg-[#F0F0F3]`];
    text = "Password is too short";
    textColor = `text-[#DC3E42]`;
  } else if (strength < 3) {
    bars = [`bg-[#DC3E42]`, `bg-[#F0F0F3]`, `bg-[#F0F0F3]`];
    text = "Password is weak";
    textColor = `text-[#DC3E42]`;
  } else {
    bars = [`bg-[#3E9B4F]`, `bg-[#3E9B4F]`, `bg-[#3E9B4F]`];
    text = "Password is strong";
    textColor = `text-[#3E9B4F]`;
  }

  const criteria = [
    { label: "Min 8 characters", isValid: password.length >= 8 },
    { label: "Min 1 upper-case letter", isValid: /[A-Z]/.test(password) },
    { label: "Min 1 number", isValid: /\d/.test(password) },
    { label: "Min 1 special character", isValid: /[!@#$%^&*]/.test(password) },
  ];

  return (
    <div className="w-full p-1">
      <div className="flex w-full gap-1.5">
        {bars.map((color, index) => (
          <div key={index} className={cn("w-full h-1 rounded-full", color)} />
        ))}
      </div>
      <p className={cn("text-xs font-medium py-1", textColor)}>{text}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {criteria.map((criterion, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              criterion.isValid ? `text-[#3E9B4F]` : "text-custom-text-400"
            )}
          >
            <CircleCheck width={14} height={14} />
            {criterion.label}
          </div>
        ))}
      </div>
    </div>
  );
};
