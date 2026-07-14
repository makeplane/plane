/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TEmployee, TOffice, TPayrollPayment, TPayrollStatus } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { formatMoney } from "../shared";
import { PayrollPaymentModal } from "./payment-modal";

const STATUS_STYLES: Record<TPayrollStatus, string> = {
  PAID: "bg-success-primary/10 text-success-primary",
  PENDING: "bg-warning-primary/10 text-warning-primary",
  CANCELLED: "bg-layer-2 text-tertiary",
};

type Props = {
  workspaceSlug: string;
  offices: TOffice[];
};

export function PayrollPaymentsTab(props: Props) {
  const { workspaceSlug, offices } = props;
  const { t } = useTranslation();
  // "Upcoming" is not another table — it is the PENDING rows
  const [view, setView] = useState<"upcoming" | "given">("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TPayrollPayment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: employees } = useSWR<TEmployee[]>(
    `PAYROLL_EMPLOYEES_${workspaceSlug}`,
    () => payrollService.getEmployees(workspaceSlug),
    { revalidateOnFocus: false }
  );

  const {
    data: payments,
    mutate,
    isLoading,
  } = useSWR<TPayrollPayment[]>(
    `PAYROLL_PAYMENTS_${workspaceSlug}_${view}`,
    () =>
      view === "upcoming"
        ? payrollService.getPayments(workspaceSlug, { upcoming: true })
        : payrollService.getPayments(workspaceSlug, { status: ["PAID"] }),
    { revalidateOnFocus: false }
  );

  const markPaid = async (payment: TPayrollPayment) => {
    try {
      // The API stamps paid_at itself — a payment marked paid with no date
      // leaves the ledger unable to say when it was settled
      await payrollService.updatePayment(workspaceSlug, payment.id, { status: "PAID" });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payroll.toasts.saved") });
      void mutate();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("payroll.toasts.error") });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await payrollService.deletePayment(workspaceSlug, deleteTarget.id);
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
      <PayrollPaymentModal
        workspaceSlug={workspaceSlug}
        isOpen={isModalOpen}
        employees={employees ?? []}
        offices={offices}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => void mutate()}
      />
      <AlertModalCore
        isOpen={deleteTarget !== null}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={() => void handleDelete()}
        isSubmitting={isDeleting}
        title={t("payroll.payments.delete_title")}
        content={t("payroll.payments.delete_description")}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(["upcoming", "given"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={cn(
                "h-8 rounded-sm border border-subtle px-3 text-12 hover:bg-layer-1-hover",
                view === option && "border-accent-primary text-accent-primary"
              )}
            >
              {t(`payroll.payments.${option}`)}
            </button>
          ))}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={(employees?.length ?? 0) === 0}
        >
          <Plus className="size-3.5" />
          {t("payroll.payments.new")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-tertiary" />
        </div>
      ) : (payments?.length ?? 0) === 0 ? (
        <div className="rounded-md border border-subtle px-4 py-8 text-center text-13 text-tertiary">
          {t(view === "upcoming" ? "payroll.payments.empty_upcoming" : "payroll.payments.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-subtle">
          <table className="w-full min-w-[720px] text-13">
            <thead className="border-b border-subtle text-11 text-tertiary uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.employee")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.office")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.concept")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.scheduled_date")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("payroll.fields.status")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("payroll.fields.amount")}</th>
                <th className="w-20 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment) => (
                <tr key={payment.id} className="border-b border-subtle last:border-0 hover:bg-layer-1-hover">
                  <td className="max-w-48 truncate px-3 py-2">{payment.employee_name}</td>
                  <td className="px-3 py-2 text-secondary">{payment.office_name}</td>
                  <td className="px-3 py-2 text-secondary">{t(`payroll.concepts.${payment.concept.toLowerCase()}`)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-secondary">{payment.scheduled_date}</td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-11", STATUS_STYLES[payment.status])}>
                      {t(`payroll.status.${payment.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium whitespace-nowrap tabular-nums">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {payment.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => void markPaid(payment)}
                          title={t("payroll.payments.mark_paid")}
                          className="rounded-sm p-1 text-tertiary hover:bg-layer-1-hover hover:text-success-primary"
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(payment)}
                        title={t("payroll.actions.delete")}
                        className="rounded-sm p-1 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
