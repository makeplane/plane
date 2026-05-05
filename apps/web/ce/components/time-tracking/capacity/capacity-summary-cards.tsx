/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Summary cards for the Capacity tab:
 *   - Total logged hours card
 *   - Main Task Category count table
 *   - Sub Task Category count table
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { ICapacityCategoriesResponse } from "@plane/types";
import { CategoryCountTable } from "./category-count-table";

interface ICapacitySummaryCardsProps {
  totalLoggedMinutes: number;
  categoriesData: ICapacityCategoriesResponse | null;
  isCategoriesLoading?: boolean;
}

export const CapacitySummaryCards = observer((props: ICapacitySummaryCardsProps) => {
  const { totalLoggedMinutes, categoriesData, isCategoriesLoading } = props;
  const { t } = useTranslation();

  const formatHours = (minutes: number) => (minutes / 60).toFixed(1);

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Total logged hours */}
      <div className="group relative flex flex-col justify-center rounded-xl overflow-hidden border border-subtle bg-gradient-to-br from-surface-1 to-surface-2 p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 w-48">
        <div className="absolute top-0 right-0 w-12 h-12 bg-accent-primary/5 rounded-bl-[80px] transition-all group-hover:bg-accent-primary/10" />
        <span className="text-12 tracking-wide font-medium uppercase text-tertiary">{t("capacity_total_logged")}</span>
        <span className="text-2xl font-bold text-primary mt-2 tracking-tight">
          {formatHours(totalLoggedMinutes)}
          <span className="text-13 font-medium text-secondary/60 ml-0.5">h</span>
        </span>
      </div>

      {/* Category distribution — 2 tables side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryCountTable
          title={t("capacity_main_task_category")}
          categories={categoriesData?.main_task_categories ?? []}
          isLoading={isCategoriesLoading}
        />
        <CategoryCountTable
          title={t("capacity_sub_task_category")}
          categories={categoriesData?.sub_task_categories ?? []}
          isLoading={isCategoriesLoading}
        />
      </div>
    </div>
  );
});
