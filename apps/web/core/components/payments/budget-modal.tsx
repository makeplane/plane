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
import type { TBudget, TExpenseCategory } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { financeService } from "@/services/finance.service";
// local imports
import { CURRENCIES } from "./shared";

const FIELD =
  "w-full rounded-sm border border-subtle bg-layer-1 px-2 py-1.5 text-13 outline-none focus:border-accent-primary";
const LABEL = "mb-1 block text-11 font-medium uppercase text-tertiary";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  categories: TExpenseCategory[];
  /** Prefills the period with the window currently on screen */
  defaultPeriod: { from: string; to: string };
  onClose: () => void;
  onSaved: () => void;
};

export function BudgetModal(props: Props) {
  const { workspaceSlug, isOpen, categories, defaultPeriod, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [periodStart, setPeriodStart] = useState(defaultPeriod.from);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.to);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCategory(categories[0]?.id ?? "");
    setAmount("");
    setCurrency(CURRENCIES[0]);
    setPeriodStart(defaultPeriod.from);
    setPeriodEnd(defaultPeriod.to);
  }, [isOpen, categories, defaultPeriod.from, defaultPeriod.to]);

  const handleSubmit = async () => {
    if (!category || !amount.trim()) return;
    setIsSubmitting(true);
    try {
      await financeService.createBudget(workspaceSlug, {
        category,
        amount,
        currency,
        period_start: periodStart,
        period_end: periodEnd,
      } as Partial<TBudget>);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payments.toasts.created") });
      onSaved();
      onClose();
    } catch (error: any) {
      // The API answers 409 when this bucket is already budgeted for the period
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payments.toasts.error"),
        message: error?.error ?? t("payments.toasts.duplicate_budget"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPeriodInverted = Boolean(periodStart && periodEnd && periodEnd < periodStart);

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="p-4">
        <h3 className="text-15 mb-4 font-medium">{t("payments.new_budget")}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={LABEL}>{t("payments.fields.category")}</label>
            <select className={FIELD} value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>{t("payments.fields.amount")}</label>
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
            <label className={LABEL}>{t("payments.fields.currency")}</label>
            <select className={FIELD} value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {CURRENCIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>{t("payments.fields.period_start")}</label>
            <input
              type="date"
              className={FIELD}
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>{t("payments.fields.period_end")}</label>
            <input
              type="date"
              className={FIELD}
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("payments.actions.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={!category || !amount.trim() || isPeriodInverted}
          >
            {t("payments.actions.save")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
