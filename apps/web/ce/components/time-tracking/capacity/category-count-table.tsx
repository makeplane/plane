/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Simple table showing issue count per category name.
 * Used in the Capacity tab to replace the placeholder pie chart.
 */

import type { FC } from "react";
import { useTranslation } from "@plane/i18n";
import type { ICategoryCount } from "@plane/types";

interface CategoryCountTableProps {
  title: string;
  categories: ICategoryCount[];
  isLoading?: boolean;
}

export const CategoryCountTable: FC<CategoryCountTableProps> = ({ title, categories, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-subtle bg-surface-1 p-4">
      <span className="text-12 font-medium tracking-wide uppercase text-tertiary">{title}</span>
      {isLoading ? (
        <div className="py-4 text-center text-12 text-tertiary animate-pulse">{t("common.loading")}</div>
      ) : categories.length === 0 ? (
        <div className="py-4 text-center text-12 text-tertiary">{t("capacity_no_data")}</div>
      ) : (
        <div className="flex flex-col divide-y divide-subtle">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between py-2">
              <span className="text-13 text-primary truncate">{cat.name}</span>
              <span className="text-13 font-semibold text-secondary">{cat.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
