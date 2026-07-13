/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Money crosses the wire as a decimal *string* ("2500.50"), never a number.
 * Parsing it into a JS number loses cents on large ledgers, so keep it a string
 * until the moment it is formatted for display.
 */
export type TMoney = string;

export type TExpenseStatus = "PENDING" | "PAID" | "CANCELLED";

export type TExpenseCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  workspace_id: string;
  expense_count: number;
  created_at: string;
  updated_at: string;
};

export type TBudget = {
  id: string;
  category: string;
  project: string | null;
  period_start: string;
  period_end: string;
  amount: TMoney;
  currency: string;
  notes: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
};

/** A supporting document (invoice, receipt) attached to an expense. The bytes
 * live in the same bucket as the file library, so the existing PDF/image
 * viewers render it as-is.
 */
export type TExpenseDocument = {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  size: number;
};

export type TExpense = {
  id: string;
  category: string | null;
  category_name: string | null;
  project: string | null;
  documents: TExpenseDocument[];
  amount: TMoney;
  currency: string;
  expense_date: string;
  vendor: string;
  description: string;
  reference: string;
  status: TExpenseStatus;
  paid_at: string | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
};

/** One row of the budgeted-vs-spent summary. Rows are per (category, currency):
 * amounts in different currencies are never added together.
 */
export type TBudgetSummaryRow = {
  category_id: string | null;
  category_name: string | null;
  currency: string;
  budgeted: TMoney;
  spent: TMoney;
  pending: TMoney;
  remaining: TMoney;
};

export type TBudgetSummary = {
  from: string;
  to: string;
  results: TBudgetSummaryRow[];
};

export type TExpenseFilters = {
  categories?: string[];
  statuses?: TExpenseStatus[];
  search?: string;
  from?: string;
  to?: string;
};
