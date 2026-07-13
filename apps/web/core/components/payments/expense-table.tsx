/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FileText, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TExpense, TExpenseStatus } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { formatMoney } from "./shared";

const STATUS_STYLES: Record<TExpenseStatus, string> = {
  PAID: "bg-success-primary/10 text-success-primary",
  PENDING: "bg-warning-primary/10 text-warning-primary",
  CANCELLED: "bg-layer-2 text-tertiary",
};

const STATUS_KEYS: Record<TExpenseStatus, string> = {
  PAID: "payments.status.paid",
  PENDING: "payments.status.pending",
  CANCELLED: "payments.status.cancelled",
};

const isImage = (type: string) => (type ?? "").startsWith("image/");

type Props = {
  expenses: TExpense[];
  onEdit: (expense: TExpense) => void;
  onDelete: (expense: TExpense) => void;
  /** The viewer pages through the whole expense, so it needs which one was clicked */
  onPreview: (expense: TExpense, index: number) => void;
};

export function ExpenseTable(props: Props) {
  const { expenses, onEdit, onDelete, onPreview } = props;
  const { t } = useTranslation();

  if (expenses.length === 0) {
    return (
      <div className="rounded-md border border-subtle px-4 py-8 text-center text-13 text-tertiary">
        {t("payments.empty.expenses")}
      </div>
    );
  }

  return (
    // The table scrolls inside its own box so the page never scrolls sideways
    <div className="overflow-x-auto rounded-md border border-subtle">
      <table className="w-full min-w-[720px] text-13">
        <thead className="border-b border-subtle text-11 text-tertiary uppercase">
          <tr>
            <th className="px-3 py-2 text-left font-medium">{t("payments.fields.date")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("payments.fields.vendor")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("payments.fields.category")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("payments.fields.reference")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("payments.fields.status")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("payments.fields.documents")}</th>
            {/* Money is right-aligned so the decimal points line up down the column */}
            <th className="px-3 py-2 text-right font-medium">{t("payments.fields.amount")}</th>
            <th className="w-20 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b border-subtle last:border-0 hover:bg-layer-1-hover">
              <td className="px-3 py-2 whitespace-nowrap text-secondary">{expense.expense_date}</td>
              <td className="max-w-48 truncate px-3 py-2">{expense.vendor || "—"}</td>
              <td className="px-3 py-2 text-secondary">{expense.category_name ?? "—"}</td>
              <td className="px-3 py-2 text-secondary">{expense.reference || "—"}</td>
              <td className="px-3 py-2">
                <span className={cn("rounded-full px-2 py-0.5 text-11", STATUS_STYLES[expense.status])}>
                  {t(STATUS_KEYS[expense.status])}
                </span>
              </td>
              {/* One chip per document — click opens the PDF/image viewer */}
              <td className="px-3 py-2">
                {expense.documents.length === 0 ? (
                  <span className="text-tertiary">—</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1">
                    {expense.documents.map((document, index) => (
                      <button
                        key={document.asset_id}
                        type="button"
                        onClick={() => onPreview(expense, index)}
                        title={document.name}
                        className="flex max-w-32 items-center gap-1 rounded-full bg-layer-2 px-2 py-0.5 text-11 text-secondary hover:bg-layer-1-hover hover:text-primary"
                      >
                        {isImage(document.type) ? (
                          <ImageIcon className="size-3 shrink-0" />
                        ) : (
                          <FileText className="size-3 shrink-0" />
                        )}
                        <span className="truncate">{document.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-medium whitespace-nowrap tabular-nums",
                  expense.status === "CANCELLED" && "text-tertiary line-through"
                )}
              >
                {formatMoney(expense.amount, expense.currency)}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(expense)}
                    title={t("payments.edit_expense")}
                    className="rounded-sm p-1 text-tertiary hover:bg-layer-1-hover hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(expense)}
                    title={t("payments.actions.delete")}
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
  );
}
