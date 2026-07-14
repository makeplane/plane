/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader2 } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TAguinaldoReport } from "@plane/types";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { formatMoney } from "../shared";

type Props = {
  workspaceSlug: string;
  year: number;
};

export function AguinaldoTab(props: Props) {
  const { workspaceSlug, year } = props;
  const { t } = useTranslation();

  const { data, isLoading } = useSWR<TAguinaldoReport>(
    `PAYROLL_AGUINALDO_${workspaceSlug}_${year}`,
    () => payrollService.getAguinaldo(workspaceSlug, year),
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
        {t("payroll.aguinaldo.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-11 text-tertiary">{t("payroll.aguinaldo.explainer")}</p>

      <div className="overflow-x-auto rounded-md border border-subtle">
        <table className="w-full min-w-[720px] text-13">
          <thead className="border-b border-subtle text-11 text-tertiary uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.employee")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.office")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.aguinaldo.days_worked")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.aguinaldo.daily_salary")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.aguinaldo.days")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("payroll.aguinaldo.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.results.flatMap((row) =>
              // One line per office: someone paid by two companies is owed
              // aguinaldo by each, on that company's own terms
              row.entries.map((entry, index) => (
                <tr
                  key={`${row.employee_id}_${entry.office_id}`}
                  className="border-b border-subtle last:border-0 hover:bg-layer-1-hover"
                >
                  <td className="max-w-48 truncate px-3 py-2">
                    {/* Only name the employee once when they span several offices */}
                    {index === 0 ? row.employee_name : ""}
                  </td>
                  <td className="px-3 py-2 text-secondary">{entry.office_name}</td>
                  <td className="px-3 py-2 text-right text-secondary tabular-nums">{entry.days_worked}</td>
                  <td className="px-3 py-2 text-right text-secondary tabular-nums">
                    {formatMoney(entry.daily_salary, entry.currency)}
                  </td>
                  <td className="px-3 py-2 text-right text-secondary tabular-nums">{entry.aguinaldo_days}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {formatMoney(entry.amount, entry.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
