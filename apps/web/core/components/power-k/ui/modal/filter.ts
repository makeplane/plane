/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Prefix marking a `Command.Item` whose match was decided by the search API
 * rather than by the text cmdk can see.
 */
export const POWER_K_SERVER_RESULT_PREFIX = "server-result:";

/**
 * Filter for the Power-K palette.
 *
 * Static commands still match on their visible label. Server-driven search
 * results are passed through untouched: the API matched them against fields
 * the palette never renders — a work item's description, for one — so
 * re-filtering here on the visible title would silently discard exactly the
 * results the search was meant to surface. It would also drop multi-word
 * matches whose words are not adjacent in the title, since this is a
 * contiguous substring test.
 */
export const powerKCommandFilter = (value: string, search: string): number => {
  if (value === "no-results") return 1;
  if (value.startsWith(POWER_K_SERVER_RESULT_PREFIX)) return 1;
  return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
};
