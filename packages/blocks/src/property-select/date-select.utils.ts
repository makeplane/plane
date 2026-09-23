/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** The default trigger label format — a short, unambiguous day. Overridden by `formatToken`. */
export const DEFAULT_DATE_FORMAT_TOKEN = "MMM dd, yyyy";

/**
 * Turns a `minDate` / `maxDate` pair into propel `Calendar` day matchers. Both bounds are
 * inclusive, so they become "before min" / "after max" exclusions rather than the bounds
 * themselves. Typed structurally — react-day-picker's `Matcher` reaches this package only through
 * propel, so it is not imported here.
 */
export function buildDisabledMatchers(
  minDate?: Date,
  maxDate?: Date
): ({ before: Date } | { after: Date })[] | undefined {
  if (!minDate && !maxDate) return undefined;
  const matchers: ({ before: Date } | { after: Date })[] = [];
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });
  return matchers;
}
