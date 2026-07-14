/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TEmployee, TOffice, TPayrollConcept, TPayrollPayment } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { CURRENCIES, FIELD, LABEL, PAYROLL_CONCEPTS, todayIso } from "./shared";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  employees: TEmployee[];
  offices: TOffice[];
  onClose: () => void;
  onSaved: () => void;
};

export function PayrollPaymentModal(props: Props) {
  const { workspaceSlug, isOpen, employees, offices, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [employee, setEmployee] = useState("");
  const [office, setOffice] = useState("");
  const [concept, setConcept] = useState<TPayrollConcept>("SALARY");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [periodStart, setPeriodStart] = useState(todayIso());
  const [periodEnd, setPeriodEnd] = useState(todayIso());
  const [scheduledDate, setScheduledDate] = useState(todayIso());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setEmployee(employees[0]?.id ?? "");
    setOffice(offices[0]?.id ?? "");
    setConcept("SALARY");
    setAmount("");
    setCurrency(CURRENCIES[0]);
    setPeriodStart(todayIso());
    setPeriodEnd(todayIso());
    setScheduledDate(todayIso());
  }, [isOpen, employees, offices]);

  const handleSubmit = async () => {
    if (!employee || !office || !amount.trim()) return;
    setIsSubmitting(true);
    try {
      // Created PENDING: it shows up under "upcoming" until someone marks it
      // paid, which is the same row, not a second one.
      await payrollService.createPayment(workspaceSlug, {
        employee,
        office,
        concept,
        amount,
        currency,
        period_start: periodStart,
        period_end: periodEnd,
        scheduled_date: scheduledDate,
      } as Partial<TPayrollPayment>);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payroll.toasts.saved") });
      onSaved();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payroll.toasts.error"),
        message: error?.period_end?.[0] ?? error?.amount?.[0] ?? undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPeriodInverted = Boolean(periodStart && periodEnd && periodEnd < periodStart);

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="p-4">
        <h3 className="text-15 mb-4 font-medium">{t("payroll.payments.new")}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.employee")}</label>
            <select className={FIELD} value={employee} onChange={(event) => setEmployee(event.target.value)}>
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.office")}</label>
            <select className={FIELD} value={office} onChange={(event) => setOffice(event.target.value)}>
              {offices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.concept")}</label>
            <select
              className={FIELD}
              value={concept}
              onChange={(event) => setConcept(event.target.value as TPayrollConcept)}
            >
              {PAYROLL_CONCEPTS.map((item) => (
                <option key={item} value={item}>
                  {t(`payroll.concepts.${item.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-1">
            <div>
              <label className={LABEL}>{t("payroll.fields.amount")}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full"
              />
            </div>
            <div>
              <label className={LABEL}>{t("payroll.fields.currency")}</label>
              <select className={FIELD} value={currency} onChange={(event) => setCurrency(event.target.value)}>
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.period_start")}</label>
            <input
              type="date"
              className={FIELD}
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.period_end")}</label>
            <input
              type="date"
              className={FIELD}
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.scheduled_date")}</label>
            <input
              type="date"
              className={FIELD}
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("payroll.actions.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={!employee || !office || !amount.trim() || isPeriodInverted}
          >
            {t("payroll.actions.save")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
