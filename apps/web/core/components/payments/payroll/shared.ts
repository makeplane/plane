/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export { formatMoney, todayIso, toIsoDate, CURRENCIES } from "../shared";

export const FIELD =
  "w-full rounded-sm border border-subtle bg-layer-1 px-2 py-1.5 text-13 outline-none focus:border-accent-primary";
export const LABEL = "mb-1 block text-11 font-medium uppercase text-tertiary";

export const PERIODICITIES = ["MONTHLY", "BIWEEKLY", "WEEKLY", "DAILY"] as const;
export const ADJUSTMENT_KINDS = ["BONUS", "DEBT", "SUPPORT"] as const;
export const PAYROLL_CONCEPTS = ["SALARY", "AGUINALDO", "BONUS", "OTHER"] as const;
