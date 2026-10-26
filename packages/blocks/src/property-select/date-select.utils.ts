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

/**
 * d2m-plane: propel's calendar pins the month navigation with `inset-e-0`, a utility this app's
 * Tailwind build does not emit — the prev / next chevrons ended up stacked over the month caption and
 * were unreachable, so a range could not be extended into the next month. Pin the nav to the right.
 */
export const CALENDAR_NAV_FIX_CLASSNAME = "[&_nav]:right-0 [&_nav]:left-auto";
