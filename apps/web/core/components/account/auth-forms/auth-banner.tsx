/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Info } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
// helpers
import type React from "react";

type TAuthBanner = {
  message: React.ReactNode;
  handleBannerData?: (bannerData: undefined) => void;
};

export function AuthBanner(props: TAuthBanner) {
  const { message, handleBannerData } = props;
  // translation
  const { t } = useTranslation();

  if (!message) return <></>;
  return (
    <div
      role="alert"
      className="relative flex items-center gap-2 rounded-md border border-accent-strong/50 bg-accent-primary/10 p-2"
    >
      <div className="grid size-4 flex-shrink-0 place-items-center">
        <Info size={16} className="text-accent-primary" />
      </div>
      <p className="w-full text-13 font-medium text-accent-primary">{message}</p>
      <button
        type="button"
        className="relative ml-auto grid size-6 place-items-center rounded-xs text-accent-primary/80 transition-all hover:bg-accent-primary/20"
        onClick={() => handleBannerData?.(undefined)}
        aria-label={t("aria_labels.auth_forms.close_alert")}
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
