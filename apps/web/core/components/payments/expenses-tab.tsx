/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Tags, Wallet } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TBudgetSummary, TExpense, TExpenseCategory, TExpenseStatus } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// services
import { financeService } from "@/services/finance.service";
// local imports
import { BudgetModal } from "./budget-modal";
import { CategoriesModal } from "./categories-modal";
import { DocumentViewer } from "./document-viewer";
import { ExpenseTable } from "./expense-table";
import { ExpenseModal } from "./expense-modal";
import { currentQuarter } from "./shared";
import { BudgetSummary } from "./summary";

const STATUSES: TExpenseStatus[] = ["PENDING", "PAID", "CANCELLED"];
const FIELD = "h-8 rounded-sm border border-subtle bg-layer-1 px-2 text-12 outline-none focus:border-accent-primary";

type Props = {
  workspaceSlug: string;
};

export function ExpensesTab(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  // The window every number on this page is reported for
  const [period, setPeriod] = useState(currentQuarter());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TExpenseStatus[]>([]);
  // modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TExpense | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typing must not fire a request per keystroke
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const { data: categories, mutate: mutateCategories } = useSWR<TExpenseCategory[]>(
    `PAYMENT_CATEGORIES_${workspaceSlug}`,
    () => financeService.getCategories(workspaceSlug),
    { revalidateOnFocus: false }
  );

  const { data: summary, mutate: mutateSummary } = useSWR<TBudgetSummary>(
    `PAYMENT_SUMMARY_${workspaceSlug}_${period.from}_${period.to}`,
    () => financeService.getSummary(workspaceSlug, period.from, period.to),
    { revalidateOnFocus: false }
  );

  const filters = useMemo(
    () => ({ from: period.from, to: period.to, search: search || undefined, statuses: statusFilter }),
    [period.from, period.to, search, statusFilter]
  );

  const {
    data: expenses,
    mutate: mutateExpenses,
    isLoading,
  } = useSWR<TExpense[]>(
    `PAYMENT_EXPENSES_${workspaceSlug}_${JSON.stringify(filters)}`,
    () => financeService.getExpenses(workspaceSlug, filters),
    { revalidateOnFocus: false }
  );

  // An expense changes both the ledger and the totals it rolls into
  const refresh = () => {
    void mutateExpenses();
    void mutateSummary();
  };

  const toggleStatus = (status: TExpenseStatus) =>
    setStatusFilter((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status]
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await financeService.deleteExpense(workspaceSlug, deleteTarget.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payments.toasts.deleted") });
      setDeleteTarget(null);
      refresh();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("payments.toasts.error") });
    } finally {
      setIsDeleting(false);
    }
  };

  // The viewer opens on one document but pages through all of the expense's, so
  // it needs the whole set plus the index that was clicked
  const [viewing, setViewing] = useState<{ expense: TExpense; index: number } | null>(null);

  return (
    <div className="flex h-full flex-col">
      <ExpenseModal
        workspaceSlug={workspaceSlug}
        isOpen={isExpenseModalOpen}
        categories={categories ?? []}
        expense={editingExpense}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSaved={refresh}
      />
      <BudgetModal
        workspaceSlug={workspaceSlug}
        isOpen={isBudgetModalOpen}
        categories={categories ?? []}
        defaultPeriod={period}
        onClose={() => setIsBudgetModalOpen(false)}
        onSaved={mutateSummary}
      />
      <CategoriesModal
        workspaceSlug={workspaceSlug}
        isOpen={isCategoriesModalOpen}
        categories={categories ?? []}
        onClose={() => setIsCategoriesModalOpen(false)}
        onChanged={() => {
          void mutateCategories();
          refresh();
        }}
      />
      <AlertModalCore
        isOpen={deleteTarget !== null}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={() => void handleDelete()}
        isSubmitting={isDeleting}
        title={t("payments.delete_expense_title")}
        content={t("payments.delete_expense_description")}
      />
      <DocumentViewer
        workspaceSlug={workspaceSlug}
        expenseId={viewing?.expense.id ?? null}
        documents={viewing?.expense.documents ?? []}
        initialIndex={viewing?.index ?? null}
        onClose={() => setViewing(null)}
      />

      {/* toolbar: the reporting window plus the three ways in */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-2 py-1.5 sm:px-4">
        <div className="flex items-center gap-1.5">
          <span className="text-11 text-tertiary uppercase">{t("payments.filters.from")}</span>
          <input
            type="date"
            className={FIELD}
            value={period.from}
            onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))}
          />
          <span className="text-11 text-tertiary uppercase">{t("payments.filters.to")}</span>
          <input
            type="date"
            className={FIELD}
            value={period.to}
            onChange={(event) => setPeriod((current) => ({ ...current, to: event.target.value }))}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-tertiary" />
            <input
              className={cn(FIELD, "w-40 pl-7")}
              placeholder={t("payments.filters.search")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className={cn(
                "h-8 rounded-sm border border-subtle px-2 text-12 hover:bg-layer-1-hover",
                statusFilter.includes(status) && "border-accent-primary text-accent-primary"
              )}
            >
              {t(`payments.status.${status.toLowerCase()}`)}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsCategoriesModalOpen(true)}
            className="flex h-8 items-center gap-1 rounded-sm border border-subtle px-2 text-12 hover:bg-layer-1-hover"
          >
            <Tags className="size-3.5" />
            <span className="hidden lg:inline">{t("payments.categories")}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBudgetModalOpen(true)}
            disabled={(categories?.length ?? 0) === 0}
            title={t("payments.new_budget")}
            className="flex h-8 items-center gap-1 rounded-sm border border-subtle px-2 text-12 hover:bg-layer-1-hover disabled:opacity-50"
          >
            <Wallet className="size-3.5" />
            <span className="hidden lg:inline">{t("payments.new_budget")}</span>
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            {t("payments.new_expense")}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-2 sm:p-4">
        <BudgetSummary rows={summary?.results ?? []} />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-tertiary" />
          </div>
        ) : (
          <ExpenseTable
            expenses={expenses ?? []}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setIsExpenseModalOpen(true);
            }}
            onDelete={setDeleteTarget}
            onPreview={(expense, index) => setViewing({ expense, index })}
          />
        )}
      </div>
    </div>
  );
}
