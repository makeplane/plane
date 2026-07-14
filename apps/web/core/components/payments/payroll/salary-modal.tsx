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
import type { TOffice, TPeriodicity, TSalary } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { CURRENCIES, FIELD, LABEL, PERIODICITIES, todayIso } from "./shared";

type Props = {
  workspaceSlug: string;
  employeeId: string;
  isOpen: boolean;
  offices: TOffice[];
  onClose: () => void;
  onSaved: () => void;
};

export function SalaryModal(props: Props) {
  const { workspaceSlug, employeeId, isOpen, offices, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [office, setOffice] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [periodicity, setPeriodicity] = useState<TPeriodicity>("MONTHLY");
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOffice(offices[0]?.id ?? "");
    setAmount("");
    setCurrency(CURRENCIES[0]);
    setPeriodicity("MONTHLY");
    setEffectiveFrom(todayIso());
  }, [isOpen, offices]);

  const handleSubmit = async () => {
    if (!office || !amount.trim()) return;
    setIsSubmitting(true);
    try {
      // Posting a salary for an office that already has one is a *raise*: the
      // API closes the previous row and opens this one, keeping the history.
      await payrollService.createSalary(workspaceSlug, employeeId, {
        office,
        amount,
        currency,
        periodicity,
        effective_from: effectiveFrom,
      } as Partial<TSalary>);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payroll.toasts.saved") });
      onSaved();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payroll.toasts.error"),
        message: error?.effective_from?.[0] ?? error?.office?.[0] ?? undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="p-4">
        <h3 className="text-15 mb-4 font-medium">{t("payroll.employees.new_salary")}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={LABEL}>{t("payroll.fields.office")}</label>
            <select className={FIELD} value={office} onChange={(event) => setOffice(event.target.value)}>
              {offices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
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
          <div>
            <label className={LABEL}>{t("payroll.fields.periodicity")}</label>
            <select
              className={FIELD}
              value={periodicity}
              onChange={(event) => setPeriodicity(event.target.value as TPeriodicity)}
            >
              {PERIODICITIES.map((item) => (
                <option key={item} value={item}>
                  {t(`payroll.periodicity.${item.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>{t("payroll.fields.effective_from")}</label>
            <input
              type="date"
              className={FIELD}
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
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
            disabled={!office || !amount.trim()}
          >
            {t("payroll.actions.save")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
