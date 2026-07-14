/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TOffice, TPayrollAccess } from "@plane/types";
import { cn } from "@plane/utils";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { ExpensesTab } from "./expenses-tab";
import { AguinaldoTab } from "./payroll/aguinaldo-tab";
import { AnnualCostTab } from "./payroll/annual-cost-tab";
import { EmployeesTab } from "./payroll/employees";
import { PayrollPaymentsTab } from "./payroll/payments-tab";

type Tab = "expenses" | "employees" | "payments" | "aguinaldo" | "annual_cost";

type Props = {
  workspaceSlug: string;
};

export function PaymentsRoot(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("expenses");
  const [year, setYear] = useState(new Date().getFullYear());

  // Whether *this* caller may see the annual cost. The API is the real gate —
  // it 404s for anyone without the grant, admin or not. This only decides
  // whether the tab is worth rendering.
  const { data: access } = useSWR<TPayrollAccess>(
    `PAYROLL_ACCESS_${workspaceSlug}`,
    () => payrollService.getAccess(workspaceSlug),
    { revalidateOnFocus: false }
  );

  const { data: offices, mutate: mutateOffices } = useSWR<TOffice[]>(
    `PAYROLL_OFFICES_${workspaceSlug}`,
    () => payrollService.getOffices(workspaceSlug),
    { revalidateOnFocus: false }
  );

  const tabs: Tab[] = ["expenses", "employees", "payments", "aguinaldo"];
  if (access?.can_view_annual_cost) tabs.push("annual_cost");

  // The reporting year only means something to the two computed tabs
  const showsYear = tab === "aguinaldo" || tab === "annual_cost";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-2 sm:px-4">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-13 whitespace-nowrap",
                tab === item
                  ? "border-accent-primary font-medium text-accent-primary"
                  : "border-transparent text-tertiary hover:text-primary"
              )}
            >
              {t(`payroll.tabs.${item}`)}
            </button>
          ))}
        </nav>

        {showsYear && (
          <div className="flex items-center gap-1.5 py-1.5">
            <span className="text-11 text-tertiary uppercase">{t("payroll.year")}</span>
            <input
              type="number"
              className="focus:border-accent-primary h-8 w-24 rounded-sm border border-subtle bg-layer-1 px-2 text-12 outline-none"
              value={year}
              onChange={(event) => setYear(Number(event.target.value) || new Date().getFullYear())}
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Expenses keeps its own toolbar, so it renders edge-to-edge */}
        {tab === "expenses" ? (
          <ExpensesTab workspaceSlug={workspaceSlug} />
        ) : (
          <div className="p-2 sm:p-4">
            {tab === "employees" && (
              <EmployeesTab
                workspaceSlug={workspaceSlug}
                offices={offices ?? []}
                onOfficesChanged={() => void mutateOffices()}
              />
            )}
            {tab === "payments" && <PayrollPaymentsTab workspaceSlug={workspaceSlug} offices={offices ?? []} />}
            {tab === "aguinaldo" && <AguinaldoTab workspaceSlug={workspaceSlug} year={year} />}
            {tab === "annual_cost" && access?.can_view_annual_cost && (
              <AnnualCostTab workspaceSlug={workspaceSlug} year={year} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
