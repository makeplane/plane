/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowRight } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { THelpCategory } from "@/plane-web/types/help-center";

type Props = { category: THelpCategory; onSelect: (categoryId: string) => void };

// "Get started here" — pins the first (lowest sort_order) category prominently
// above the grid so non-technical staff have an obvious entry point. There is
// no dedicated feature flag; the first category is the implicit starting point.
export const HelpCenterFeatured = ({ category, onSelect }: Props) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className="mb-6 flex w-full items-center justify-between gap-4 rounded-lg border border-subtle bg-surface-1 px-5 py-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
    >
      <div className="min-w-0">
        <p className="text-13 font-medium uppercase tracking-wide text-accent-primary">
          {t("help_center.get_started_here")}
        </p>
        <h2 className="mt-1 truncate text-18 font-semibold text-primary">{category.name}</h2>
      </div>
      <ArrowRight className="size-5 shrink-0 text-icon-primary" />
    </button>
  );
};
