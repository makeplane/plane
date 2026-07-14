/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader2, Lock } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TAnnualCostReport } from "@plane/types";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { formatMoney } from "../shared";

type Props = {
  workspaceSlug: string;
  year: number;
};

/** The restricted report. The tab that renders this is only shown to a caller
 * the API says may see it — and the API answers 404 to everyone else, admins
 * included. Hiding the tab is convenience; the API is the actual gate.
 */
export function AnnualCostTab(props: Props) {
  const { workspaceSlug, year } = props;
  const { t } = useTranslation();

  const { data, isLoading } = useSWR<TAnnualCostReport>(
    `PAYROLL_ANNUAL_COST_${workspaceSlug}_${year}`,
    () => payrollService.getAnnualCost(workspaceSlug, year),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-tertiary" />
      </div>
    );
  }

  if ((data?.results.length ?? 0) === 0) {
    return (
      <div className="rounded-md border border-subtle px-4 py-8 text-center text-13 text-tertiary">
        {t("payroll.annual_cost.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-11 text-tertiary">
        <Lock className="size-3" />
        {t("payroll.annual_cost.restricted")}
      </p>

      <div className="overflow-x-auto rounded-md border border-subtle">
        <table className="w-full min-w-[860px] text-13">
          <thead className="border-b border-subtle text-11 text-tertiary uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.office")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.annual_cost.headcount")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.annual_cost.salaries")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.annual_cost.aguinaldo")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.annual_cost.bonuses")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.annual_cost.support")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.annual_cost.debts")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.annual_cost.total")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.results.map((row) => (
              // One row per (office, currency): totals across currencies are
              // never added together
              <tr
                key={`${row.office_id}_${row.currency}`}
                className="border-b border-subtle last:border-0 hover:bg-layer-1-hover"
              >
                <td className="px-3 py-2">
                  {row.office_name}
                  <span className="ml-1.5 text-11 text-tertiary">{row.currency}</span>
                </td>
                <td className="px-3 py-2 text-right text-secondary tabular-nums">{row.headcount}</td>
                <td className="px-3 py-2 text-right text-secondary tabular-nums">
                  {formatMoney(row.salaries, row.currency)}
                </td>
                <td className="px-3 py-2 text-right text-secondary tabular-nums">
                  {formatMoney(row.aguinaldo, row.currency)}
                </td>
                <td className="px-3 py-2 text-right text-secondary tabular-nums">
                  {formatMoney(row.bonuses, row.currency)}
                </td>
                <td className="px-3 py-2 text-right text-secondary tabular-nums">
                  {formatMoney(row.support, row.currency)}
                </td>
                <td className="px-3 py-2 text-right text-danger-primary tabular-nums">
                  −{formatMoney(row.debts, row.currency)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {formatMoney(row.total, row.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
