/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { TickOutline } from "@makeplane/propel/icons";

type Props = {
  isChecked: boolean;
  handleChange: (checked: boolean) => void;
};

export function MarketingConsent({ isChecked, handleChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => handleChange(!isChecked)}
        className={`flex size-4 items-center justify-center rounded-sm border-2 ${
          isChecked ? "border-accent-strong bg-accent-primary" : "border-strong"
        }`}
      >
        {isChecked && <TickOutline className="h-3 w-3 text-on-color" />}
      </button>
      <span className="text-13 text-tertiary">{t("web_ui.i_agree_to_plane_marketing_communications")}</span>
    </div>
  );
}
