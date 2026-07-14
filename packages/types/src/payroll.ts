/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TMoney } from "./finance";

export type TPeriodicity = "MONTHLY" | "BIWEEKLY" | "WEEKLY" | "DAILY";
export type TAdjustmentKind = "BONUS" | "DEBT" | "SUPPORT";
export type TPayrollStatus = "PENDING" | "PAID" | "CANCELLED";
export type TPayrollConcept = "SALARY" | "AGUINALDO" | "BONUS" | "OTHER";

/** A company someone is paid from (Seanalytics, Latin...). Holds its own
 * aguinaldo days — one company may be more generous than the legal 15.
 */
export type TOffice = {
  id: string;
  name: string;
  aguinaldo_days: number;
  workspace_id: string;
  employee_count: number;
  created_at: string;
  updated_at: string;
};

/** The salary in force right now, in one office. An employee can hold several
 * at once — one per company they work for.
 */
export type TCurrentSalary = {
  id: string;
  office_id: string;
  office_name: string;
  amount: TMoney;
  currency: string;
  periodicity: TPeriodicity;
  effective_from: string;
};

/** A person on payroll. Deliberately not a Plane user account. */
export type TEmployee = {
  id: string;
  full_name: string;
  email: string;
  national_id: string;
  position: string;
  hire_date: string;
  termination_date: string | null;
  is_active: boolean;
  notes: string;
  current_salaries: TCurrentSalary[];
  workspace_id: string;
  created_at: string;
  updated_at: string;
};

/** One row of the salary history. A raise appends a row and closes the previous
 * one (effective_to); it never overwrites, so the past stays answerable.
 */
export type TSalary = {
  id: string;
  employee: string;
  office: string;
  office_name: string;
  amount: TMoney;
  currency: string;
  periodicity: TPeriodicity;
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
  workspace_id: string;
  created_at: string;
};

/** A bonus, a debt or a support payment. The kind carries the direction — the
 * amount is always positive.
 */
export type TAdjustment = {
  id: string;
  employee: string;
  office: string | null;
  office_name: string | null;
  kind: TAdjustmentKind;
  amount: TMoney;
  currency: string;
  effective_date: string;
  description: string;
  workspace_id: string;
  created_at: string;
};

/** A payroll disbursement — already paid, or still due. "Upcoming" is just the
 * PENDING rows, so a plan and its payment can never disagree.
 */
export type TPayrollPayment = {
  id: string;
  employee: string;
  employee_name: string;
  office: string;
  office_name: string;
  concept: TPayrollConcept;
  amount: TMoney;
  currency: string;
  period_start: string;
  period_end: string;
  scheduled_date: string;
  status: TPayrollStatus;
  paid_at: string | null;
  notes: string;
  workspace_id: string;
  created_at: string;
};

export type TAguinaldoEntry = {
  office_id: string;
  office_name: string;
  currency: string;
  aguinaldo_days: number;
  days_worked: number;
  daily_salary: TMoney;
  amount: TMoney;
};

export type TAguinaldoRow = {
  employee_id: string;
  employee_name: string;
  hire_date: string;
  termination_date: string | null;
  entries: TAguinaldoEntry[];
};

export type TAguinaldoReport = {
  year: number;
  results: TAguinaldoRow[];
};

/** The restricted report: what the workforce costs per year, per office. */
export type TAnnualCostRow = {
  office_id: string;
  office_name: string;
  currency: string;
  headcount: number;
  salaries: TMoney;
  aguinaldo: TMoney;
  bonuses: TMoney;
  support: TMoney;
  debts: TMoney;
  total: TMoney;
};

export type TAnnualCostReport = {
  year: number;
  results: TAnnualCostRow[];
};

/** Read-only. Granted in the database, never from the app — the people it hides
 * the annual cost from are admins themselves.
 */
export type TPayrollAccess = {
  can_view_annual_cost: boolean;
};
