/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CheckIcon } from "@plane/propel/icons";

type Props = {
  isChecked: boolean;
  handleChange: (checked: boolean) => void;
};

export function MarketingConsent({ isChecked, handleChange }: Props) {
  // i18n
  const { t } = useTranslation();

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
      <span className="text-13 text-tertiary">{t("onboarding.profile.form.marketing_consent")}</span>
    </div>
  );
}
