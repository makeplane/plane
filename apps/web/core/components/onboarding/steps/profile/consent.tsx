"use client";

import type { FC } from "react";
import { Check } from "lucide-react";

type Props = {
  isChecked: boolean;
  handleChange: (checked: boolean) => void;
};

export const MarketingConsent: FC<Props> = ({ isChecked, handleChange }) => (
  <div className="flex items-center justify-center gap-1.5">
    <button
      type="button"
      onClick={() => handleChange(!isChecked)}
      className={`size-4 rounded border-2 flex items-center justify-center ${
        isChecked ? "bg-custom-primary-100 border-custom-primary-100" : "border-custom-border-300"
      }`}
    >
      {isChecked && <Check className="w-3 h-3 text-white" />}
    </button>
    <span className="text-sm text-custom-text-300">I agree to Plane marketing communications</span>
  </div>
);
