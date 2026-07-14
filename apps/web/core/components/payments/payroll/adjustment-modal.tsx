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
import type { TAdjustment, TAdjustmentKind, TOffice } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { ADJUSTMENT_KINDS, CURRENCIES, FIELD, LABEL, todayIso } from "./shared";

type Props = {
  workspaceSlug: string;
  employeeId: string;
  isOpen: boolean;
  offices: TOffice[];
  onClose: () => void;
  onSaved: () => void;
};

export function AdjustmentModal(props: Props) {
  const { workspaceSlug, employeeId, isOpen, offices, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [kind, setKind] = useState<TAdjustmentKind>("BONUS");
  const [office, setOffice] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setKind("BONUS");
    setOffice(offices[0]?.id ?? "");
    setAmount("");
    setCurrency(CURRENCIES[0]);
    setEffectiveDate(todayIso());
    setDescription("");
  }, [isOpen, offices]);

  const handleSubmit = async () => {
    if (!amount.trim()) return;
    setIsSubmitting(true);
    try {
      // The amount is always positive — `kind` decides whether it adds or
      // subtracts. A debt is not a negative bonus.
      await payrollService.createAdjustment(workspaceSlug, employeeId, {
        kind,
        office: office || null,
        amount,
        currency,
        effective_date: effectiveDate,
        description,
      } as Partial<TAdjustment>);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payroll.toasts.saved") });
      onSaved();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payroll.toasts.error"),
        message: error?.amount?.[0] ?? undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="p-4">
        <h3 className="text-15 mb-4 font-medium">{t("payroll.employees.new_adjustment")}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={LABEL}>{t("payroll.fields.kind")}</label>
            <div className="flex gap-1.5">
              {ADJUSTMENT_KINDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setKind(item)}
                  className={`h-8 flex-1 rounded-sm border text-12 ${
                    kind === item
                      ? "border-accent-primary text-accent-primary"
                      : "border-subtle text-secondary hover:bg-layer-1-hover"
                  }`}
                >
                  {t(`payroll.kinds.${item.toLowerCase()}`)}
                </button>
              ))}
            </div>
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
            <label className={LABEL}>{t("payroll.fields.office")}</label>
            <select className={FIELD} value={office} onChange={(event) => setOffice(event.target.value)}>
              <option value="">—</option>
              {offices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>{t("payroll.fields.date")}</label>
            <input
              type="date"
              className={FIELD}
              value={effectiveDate}
              onChange={(event) => setEffectiveDate(event.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className={LABEL}>{t("payroll.fields.description")}</label>
            <textarea
              className={FIELD}
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
            disabled={!amount.trim()}
          >
            {t("payroll.actions.save")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
