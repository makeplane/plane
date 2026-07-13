/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TExpense, TExpenseCategory, TExpenseDocument, TExpenseStatus } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { fileLibraryService } from "@/services/file-library.service";
import { financeService } from "@/services/finance.service";
// local imports
import { CURRENCIES, todayIso } from "./shared";

const FIELD =
  "w-full rounded-sm border border-subtle bg-layer-1 px-2 py-1.5 text-13 outline-none focus:border-accent-primary";
const LABEL = "mb-1 block text-11 font-medium uppercase text-tertiary";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  categories: TExpenseCategory[];
  /** null = creating a new expense */
  expense: TExpense | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  category: string;
  amount: string;
  currency: string;
  expense_date: string;
  vendor: string;
  reference: string;
  description: string;
  status: TExpenseStatus;
};

const emptyForm = (): FormState => ({
  category: "",
  amount: "",
  currency: CURRENCIES[0],
  expense_date: todayIso(),
  vendor: "",
  reference: "",
  description: "",
  status: "PENDING",
});

const isImage = (type: string) => (type ?? "").startsWith("image/");

export function ExpenseModal(props: Props) {
  const { workspaceSlug, isOpen, categories, expense, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Documents already attached to the expense (edit mode)
  const [documents, setDocuments] = useState<TExpenseDocument[]>([]);
  // Files picked but not uploaded yet. A new expense has no id to attach them
  // to, so they wait here until the expense exists. Each carries its own id:
  // two files can share a name, and the list must still track them apart.
  const [queued, setQueued] = useState<{ id: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQueued([]);
    setDocuments(expense?.documents ?? []);
    setForm(
      expense
        ? {
            category: expense.category ?? "",
            amount: expense.amount,
            currency: expense.currency,
            expense_date: expense.expense_date,
            vendor: expense.vendor,
            reference: expense.reference,
            description: expense.description,
            status: expense.status,
          }
        : emptyForm()
    );
  }, [isOpen, expense]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []).map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));
    if (picked.length > 0) setQueued((current) => [...current, ...picked]);
    // Reset so re-picking the same file still fires onChange
    event.target.value = "";
  };

  /** Detaches a document that is already saved. The file itself stays in the
   * library — it may be wanted on its own or linked from elsewhere.
   */
  const handleDetach = async (document: TExpenseDocument) => {
    if (!expense) return;
    setDocuments((current) => current.filter((item) => item.asset_id !== document.asset_id));
    try {
      await financeService.detachDocument(workspaceSlug, expense.id, document.asset_id);
      onSaved();
    } catch {
      // Put it back — the server still has it
      setDocuments((current) => [...current, document]);
      setToast({ type: TOAST_TYPE.ERROR, title: t("payments.toasts.error") });
    }
  };

  const handleSubmit = async () => {
    if (!form.amount.trim() || !form.expense_date) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        // The API takes null, not "", for the optional relation
        category: form.category || null,
        // Recording something as paid without a date leaves the ledger unable to
        // say when it was settled
        paid_at: form.status === "PAID" ? form.expense_date : null,
      };
      const saved = expense
        ? await financeService.updateExpense(workspaceSlug, expense.id, payload as Partial<TExpense>)
        : await financeService.createExpense(workspaceSlug, payload as Partial<TExpense>);

      if (queued.length > 0) {
        // The bytes go to the bucket through the library's presigned upload, so
        // the invoice is an ordinary library file: same storage, same viewers.
        const uploads = await Promise.all(
          queued.map((item) => fileLibraryService.uploadFile(workspaceSlug, item.file))
        );
        await financeService.attachDocuments(
          workspaceSlug,
          saved.id,
          uploads.map((upload) => upload.asset_id)
        );
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t(expense ? "payments.toasts.updated" : "payments.toasts.created"),
      });
      onSaved();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payments.toasts.error"),
        message: error?.amount?.[0] ?? error?.error ?? undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="p-4">
        <h3 className="text-15 mb-4 font-medium">{t(expense ? "payments.edit_expense" : "payments.new_expense")}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payments.fields.amount")}</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(event) => set("amount", event.target.value)}
              placeholder="0.00"
              className="w-full"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payments.fields.currency")}</label>
            <select className={FIELD} value={form.currency} onChange={(event) => set("currency", event.target.value)}>
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payments.fields.date")}</label>
            <input
              type="date"
              className={FIELD}
              value={form.expense_date}
              onChange={(event) => set("expense_date", event.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payments.fields.status")}</label>
            <select
              className={FIELD}
              value={form.status}
              onChange={(event) => set("status", event.target.value as TExpenseStatus)}
            >
              <option value="PENDING">{t("payments.status.pending")}</option>
              <option value="PAID">{t("payments.status.paid")}</option>
              <option value="CANCELLED">{t("payments.status.cancelled")}</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payments.fields.category")}</label>
            <select className={FIELD} value={form.category} onChange={(event) => set("category", event.target.value)}>
              <option value="">—</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payments.fields.vendor")}</label>
            <Input value={form.vendor} onChange={(event) => set("vendor", event.target.value)} className="w-full" />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payments.fields.reference")}</label>
            <Input
              value={form.reference}
              onChange={(event) => set("reference", event.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>{t("payments.fields.description")}</label>
            <textarea
              className={FIELD}
              rows={2}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>

          {/* Supporting documents — several per expense */}
          <div className="col-span-2">
            <label className={LABEL}>{t("payments.fields.documents")}</label>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handlePick}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:border-accent-primary flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-subtle py-2 text-12 text-tertiary hover:text-accent-primary"
            >
              <Paperclip className="size-3.5" />
              {t("payments.fields.add_files")}
            </button>

            {(documents.length > 0 || queued.length > 0) && (
              <ul className="mt-2 space-y-1">
                {documents.map((document) => (
                  <li
                    key={document.asset_id}
                    className="flex items-center gap-2 rounded-sm bg-layer-2 px-2 py-1 text-12"
                  >
                    {isImage(document.type) ? (
                      <ImageIcon className="size-3.5 shrink-0 text-tertiary" />
                    ) : (
                      <FileText className="size-3.5 shrink-0 text-tertiary" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{document.name}</span>
                    <button
                      type="button"
                      onClick={() => void handleDetach(document)}
                      className="shrink-0 text-tertiary hover:text-danger-primary"
                      title={t("payments.actions.delete")}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
                {/* Queued files are not uploaded until the expense is saved */}
                {queued.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-sm border border-dashed border-subtle px-2 py-1 text-12 text-tertiary"
                  >
                    <Paperclip className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
                    <button
                      type="button"
                      onClick={() => setQueued((current) => current.filter((queuedItem) => queuedItem.id !== item.id))}
                      className="shrink-0 hover:text-danger-primary"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
            disabled={!form.amount.trim() || !form.expense_date}
          >
            {t("payments.actions.save")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
