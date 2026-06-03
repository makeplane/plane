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
    <div className="mb-8 flex flex-col gap-4">
      {/* Total logged hours */}
      <div className="group shadow-sm hover:shadow-md relative flex w-48 transform flex-col justify-center overflow-hidden rounded-xl border border-subtle bg-gradient-to-br from-surface-1 to-surface-2 p-4 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 right-0 h-12 w-12 rounded-bl-[80px] bg-accent-primary/5 transition-all group-hover:bg-accent-primary/10" />
        <span className="text-12 font-medium tracking-wide text-tertiary uppercase">{t("capacity_total_logged")}</span>
        <span className="text-2xl mt-2 font-bold tracking-tight text-primary">
          {formatHours(totalLoggedMinutes)}
          <span className="ml-0.5 text-13 font-medium text-secondary/60">h</span>
        </span>
      </div>

      {/* Category distribution — 2 tables side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
