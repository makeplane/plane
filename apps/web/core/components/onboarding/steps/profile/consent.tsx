import type { FC } from "react";

import { CheckIcon } from "@plane/propel/icons";

type Props = {
  isChecked: boolean;
  handleChange: (checked: boolean) => void;
};

export function MarketingConsent({ isChecked, handleChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => handleChange(!isChecked)}
        className={`size-4 rounded-sm border-2 flex items-center justify-center ${
          isChecked ? "bg-accent-primary border-accent-strong" : "border-strong"
        }`}
      >
        {isChecked && <CheckIcon className="w-3 h-3 text-on-color" />}
      </button>
      <span className="text-13 text-tertiary">I agree to Plane marketing communications</span>
    </div>
  );
}
