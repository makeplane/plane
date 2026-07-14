/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TAdjustment, TAdjustmentKind, TEmployee, TOffice, TSalary } from "@plane/types";
import { cn } from "@plane/utils";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { formatMoney } from "../shared";
import { AdjustmentModal } from "./adjustment-modal";
import { SalaryModal } from "./salary-modal";

const KIND_STYLES: Record<TAdjustmentKind, string> = {
  BONUS: "bg-success-primary/10 text-success-primary",
  SUPPORT: "bg-accent-primary/10 text-accent-primary",
  DEBT: "bg-danger-primary/10 text-danger-primary",
};

const KIND_KEYS: Record<TAdjustmentKind, string> = {
  BONUS: "payroll.kinds.bonus",
  SUPPORT: "payroll.kinds.support",
  DEBT: "payroll.kinds.debt",
};

type Props = {
  workspaceSlug: string;
  employee: TEmployee;
  offices: TOffice[];
  onChanged: () => void;
  onEdit: () => void;
};

export function EmployeeDetail(props: Props) {
  const { workspaceSlug, employee, offices, onChanged, onEdit } = props;
  const { t } = useTranslation();
  const [isSalaryOpen, setIsSalaryOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  const { data: salaries, mutate: mutateSalaries } = useSWR<TSalary[]>(
    `PAYROLL_SALARIES_${employee.id}`,
    () => payrollService.getSalaries(workspaceSlug, employee.id),
    { revalidateOnFocus: false }
  );
  const { data: adjustments, mutate: mutateAdjustments } = useSWR<TAdjustment[]>(
    `PAYROLL_ADJUSTMENTS_${employee.id}`,
    () => payrollService.getAdjustments(workspaceSlug, employee.id),
    { revalidateOnFocus: false }
  );

  const removeSalary = async (salaryId: string) => {
    try {
      await payrollService.deleteSalary(workspaceSlug, employee.id, salaryId);
      void mutateSalaries();
      onChanged();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("payroll.toasts.error") });
    }
  };

  const removeAdjustment = async (adjustmentId: string) => {
    try {
      await payrollService.deleteAdjustment(workspaceSlug, employee.id, adjustmentId);
      void mutateAdjustments();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("payroll.toasts.error") });
    }
  };

  return (
    <div className="space-y-4 border-t border-subtle bg-layer-2/40 px-3 py-3 sm:px-10">
      <SalaryModal
        workspaceSlug={workspaceSlug}
        employeeId={employee.id}
        isOpen={isSalaryOpen}
        offices={offices}
        onClose={() => setIsSalaryOpen(false)}
        onSaved={() => {
          void mutateSalaries();
          onChanged();
        }}
      />
      <AdjustmentModal
        workspaceSlug={workspaceSlug}
        employeeId={employee.id}
        isOpen={isAdjustmentOpen}
        offices={offices}
        onClose={() => setIsAdjustmentOpen(false)}
        onSaved={() => void mutateAdjustments()}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-11 text-tertiary">
        <span>
          {t("payroll.fields.hire_date")}: {employee.hire_date}
        </span>
        {employee.termination_date && (
          <span>
            {t("payroll.fields.termination_date")}: {employee.termination_date}
          </span>
        )}
        {employee.national_id && <span>{employee.national_id}</span>}
        {employee.email && <span>{employee.email}</span>}
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto flex items-center gap-1 rounded-sm px-1.5 py-0.5 hover:bg-layer-1-hover hover:text-primary"
        >
          <Pencil className="size-3" />
          {t("payroll.employees.edit")}
        </button>
      </div>

      {/* Salary history: a raise appends a row, so the old rate stays visible */}
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h4 className="text-11 font-medium text-tertiary uppercase">{t("payroll.employees.salaries")}</h4>
          <button
            type="button"
            onClick={() => setIsSalaryOpen(true)}
            className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-11 text-tertiary hover:bg-layer-1-hover hover:text-primary"
          >
            <Plus className="size-3" />
            {t("payroll.employees.new_salary")}
          </button>
        </div>
        {(salaries?.length ?? 0) === 0 ? (
          <p className="py-2 text-12 text-tertiary">—</p>
        ) : (
          <ul className="space-y-1">
            {salaries?.map((salary) => (
              <li
                key={salary.id}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-1 text-12",
                  salary.is_current ? "bg-layer-1" : "text-tertiary"
                )}
              >
                <span className="w-28 shrink-0 truncate">{salary.office_name}</span>
                <span className="w-28 shrink-0 tabular-nums">{formatMoney(salary.amount, salary.currency)}</span>
                <span className="w-20 shrink-0 text-11">
                  {t(`payroll.periodicity.${salary.periodicity.toLowerCase()}`)}
                </span>
                <span className="flex-1 text-11">
                  {salary.effective_from} → {salary.effective_to ?? "—"}
                </span>
                {salary.is_current && (
                  <span className="shrink-0 rounded-full bg-accent-primary/10 px-2 py-0.5 text-11 text-accent-primary">
                    {t("payroll.employees.current")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void removeSalary(salary.id)}
                  className="shrink-0 text-tertiary hover:text-danger-primary"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h4 className="text-11 font-medium text-tertiary uppercase">{t("payroll.employees.adjustments")}</h4>
          <button
            type="button"
            onClick={() => setIsAdjustmentOpen(true)}
            className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-11 text-tertiary hover:bg-layer-1-hover hover:text-primary"
          >
            <Plus className="size-3" />
            {t("payroll.employees.new_adjustment")}
          </button>
        </div>
        {(adjustments?.length ?? 0) === 0 ? (
          <p className="py-2 text-12 text-tertiary">—</p>
        ) : (
          <ul className="space-y-1">
            {adjustments?.map((adjustment) => (
              <li key={adjustment.id} className="flex items-center gap-2 rounded-sm px-2 py-1 text-12">
                <span
                  className={cn(
                    "w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-11",
                    KIND_STYLES[adjustment.kind]
                  )}
                >
                  {t(KIND_KEYS[adjustment.kind])}
                </span>
                <span className="w-28 shrink-0 tabular-nums">
                  {formatMoney(adjustment.amount, adjustment.currency)}
                </span>
                <span className="w-24 shrink-0 text-11 text-tertiary">{adjustment.effective_date}</span>
                <span className="min-w-0 flex-1 truncate text-11 text-tertiary">
                  {adjustment.office_name ?? "—"}
                  {adjustment.description && ` · ${adjustment.description}`}
                </span>
                <button
                  type="button"
                  onClick={() => void removeAdjustment(adjustment.id)}
                  className="shrink-0 text-tertiary hover:text-danger-primary"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
