/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
        className={`flex size-4 items-center justify-center rounded-sm border-2 ${
          isChecked ? "border-accent-strong bg-accent-primary" : "border-strong"
        }`}
      >
        {isChecked && <CheckIcon className="h-3 w-3 text-on-color" />}
      </button>
      <span className="text-13 text-tertiary">I agree to Plane marketing communications</span>
    </div>
  );
}
