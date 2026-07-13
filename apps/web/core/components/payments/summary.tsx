/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBudgetSummaryRow } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { formatMoney, spentRatio } from "./shared";

type Props = {
  rows: TBudgetSummaryRow[];
};

export function BudgetSummary(props: Props) {
  const { rows } = props;
  const { t } = useTranslation();

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-subtle px-4 py-6 text-center text-13 text-tertiary">
        {t("payments.empty.summary")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const ratio = spentRatio(row.spent, row.budgeted);
        const isOverBudget = ratio !== null && ratio > 1;
        return (
          <div
            // A category appears once per currency, so the id alone is not unique
            key={`${row.category_id ?? "none"}_${row.currency}`}
            className="rounded-md border border-subtle p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-13 font-medium">{row.category_name ?? "—"}</span>
              <span className="shrink-0 text-11 text-tertiary">{row.currency}</span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={cn("text-16 font-semibold", isOverBudget && "text-danger-primary")}>
                {formatMoney(row.spent, row.currency)}
              </span>
              <span className="text-12 text-tertiary">
                / {ratio === null ? t("payments.no_budget") : formatMoney(row.budgeted, row.currency)}
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-layer-2">
              {ratio !== null && (
                <div
                  className={cn("h-full rounded-full", isOverBudget ? "bg-danger-primary" : "bg-accent-primary")}
                  // Clamped so an overrun fills the bar instead of overflowing it
                  style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                />
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-11">
              {isOverBudget ? (
                <span className="flex items-center gap-1 text-danger-primary">
                  <AlertTriangle className="size-3" />
                  {t("payments.over_budget")}
                </span>
              ) : (
                <span className="text-tertiary">
                  {t("payments.remaining")}: {formatMoney(row.remaining, row.currency)}
                </span>
              )}
              {Number(row.pending) > 0 && (
                <span className="text-tertiary">
                  {t("payments.pending")}: {formatMoney(row.pending, row.currency)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
