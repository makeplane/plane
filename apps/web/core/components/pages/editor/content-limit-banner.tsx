/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { TriangleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  onDismiss?: () => void;
};

export function ContentLimitBanner({ className, onDismiss }: Props) {
  const { t } = useTranslation();
  return (
    <div className={cn("text-sm flex items-center gap-2 border-b border-subtle-1 bg-layer-2 px-4 py-2.5", className)}>
      <div className="mx-auto flex items-center gap-2 text-secondary">
        <span className="text-amber-500">
          <TriangleAlert />
        </span>
        <span className="font-medium">
          {t("page_ui.content_limit_banner.message")}
        </span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto text-placeholder hover:text-secondary"
          aria-label={t("page_ui.content_limit_banner.dismiss")}
        >
          ✕
        </button>
      )}
    </div>
  );
}
