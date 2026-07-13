/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TMoney } from "@plane/types";

/** Formats a decimal-string amount for display.
 *
 * The string stays the source of truth everywhere else — it is only turned into
 * a Number here, at the last step before pixels, because Intl needs one. Never
 * do arithmetic on the result.
 */
export const formatMoney = (amount: TMoney, currency: string, locale = "es-MX"): string => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  } catch {
    // Unknown ISO code — show the number and the raw code rather than throwing
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(value)} ${currency}`;
  }
};

/** Spent as a share of budget, clamped for the bar's width. Returns null when
 * there is no budget to compare against — 0/0 is not 0%, it's "no budget".
 */
export const spentRatio = (spent: TMoney, budgeted: TMoney): number | null => {
  const budget = Number(budgeted);
  if (!Number.isFinite(budget) || budget <= 0) return null;
  return Number(spent) / budget;
};

/** YYYY-MM-DD in the *local* calendar. toISOString() would shift the date across
 * midnight for anyone west of UTC, filing an expense on the wrong day.
 */
export const toIsoDate = (value: Date): string =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

export const todayIso = (): string => toIsoDate(new Date());

/** The quarter containing `date`, as the default reporting window. */
export const currentQuarter = (date = new Date()): { from: string; to: string } => {
  const quarter = Math.floor(date.getMonth() / 3);
  return {
    from: toIsoDate(new Date(date.getFullYear(), quarter * 3, 1)),
    // Day 0 of the next month = the last day of this one
    to: toIsoDate(new Date(date.getFullYear(), quarter * 3 + 3, 0)),
  };
};

export const CURRENCIES = ["MXN", "USD", "EUR"];
