/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Building2, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TEmployee, TOffice } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { formatMoney } from "../shared";
import { EmployeeDetail } from "./employee-detail";
import { EmployeeModal } from "./employee-modal";
import { OfficesModal } from "./offices-modal";

type Props = {
  workspaceSlug: string;
  offices: TOffice[];
  onOfficesChanged: () => void;
};

export function EmployeesTab(props: Props) {
  const { workspaceSlug, offices, onOfficesChanged } = props;
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editing, setEditing] = useState<TEmployee | null>(null);
  const [isOfficesOpen, setIsOfficesOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TEmployee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: employees,
    mutate,
    isLoading,
  } = useSWR<TEmployee[]>(`PAYROLL_EMPLOYEES_${workspaceSlug}`, () => payrollService.getEmployees(workspaceSlug), {
    revalidateOnFocus: false,
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await payrollService.deleteEmployee(workspaceSlug, deleteTarget.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payroll.toasts.deleted") });
      setDeleteTarget(null);
      void mutate();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("payroll.toasts.error") });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <EmployeeModal
        workspaceSlug={workspaceSlug}
        isOpen={isEmployeeModalOpen}
        employee={editing}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditing(null);
        }}
        onSaved={() => void mutate()}
      />
      <OfficesModal
        workspaceSlug={workspaceSlug}
        isOpen={isOfficesOpen}
        offices={offices}
        onClose={() => setIsOfficesOpen(false)}
        onChanged={onOfficesChanged}
      />
      <AlertModalCore
        isOpen={deleteTarget !== null}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={() => void handleDelete()}
        isSubmitting={isDeleting}
        title={t("payroll.employees.delete_title")}
        content={t("payroll.employees.delete_description")}
      />

      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setIsOfficesOpen(true)}
          className="flex h-8 items-center gap-1 rounded-sm border border-subtle px-2 text-12 hover:bg-layer-1-hover"
        >
          <Building2 className="size-3.5" />
          {t("payroll.offices.title")}
        </button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setIsEmployeeModalOpen(true);
          }}
          // Without an office there is nowhere to hang a salary
          disabled={offices.length === 0}
        >
          <Plus className="size-3.5" />
          {t("payroll.employees.new")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-tertiary" />
        </div>
      ) : (employees?.length ?? 0) === 0 ? (
        <div className="rounded-md border border-subtle px-4 py-8 text-center text-13 text-tertiary">
          {offices.length === 0 ? t("payroll.offices.empty") : t("payroll.employees.empty")}
        </div>
      ) : (
        <div className="divide-y divide-subtle rounded-md border border-subtle">
          {employees?.map((employee) => {
            const isExpanded = expandedId === employee.id;
            return (
              <div key={employee.id}>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-layer-1-hover">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : employee.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 shrink-0 text-tertiary" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-tertiary" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-13 font-medium">{employee.full_name}</p>
                      <p className="truncate text-11 text-tertiary">
                        {employee.position || "—"}
                        {!employee.is_active && ` · ${t("payroll.employees.inactive")}`}
                      </p>
                    </div>
                  </button>

                  {/* One chip per office they draw a salary from */}
                  <div className="hidden flex-wrap items-center justify-end gap-1 sm:flex">
                    {employee.current_salaries.map((salary) => (
                      <span
                        key={salary.id}
                        className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-secondary"
                        title={salary.office_name}
                      >
                        {salary.office_name}: {formatMoney(salary.amount, salary.currency)}
                      </span>
                    ))}
                  </div>

                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-11",
                      employee.is_active ? "bg-success-primary/10 text-success-primary" : "bg-layer-2 text-tertiary"
                    )}
                  >
                    {t(employee.is_active ? "payroll.employees.active" : "payroll.employees.inactive")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(employee)}
                    className="shrink-0 rounded-sm p-1 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                    title={t("payroll.actions.delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {isExpanded && (
                  <EmployeeDetail
                    workspaceSlug={workspaceSlug}
                    employee={employee}
                    offices={offices}
                    onChanged={() => void mutate()}
                    onEdit={() => {
                      setEditing(employee);
                      setIsEmployeeModalOpen(true);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
