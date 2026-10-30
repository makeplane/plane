/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TPaginatedResponse } from "@plane/types";

/**
 * Wraps an already-loaded option list as the single page a `@plane/blocks` property select expects
 * from `getValues`. The published board loads every option up front, so there is no cursor.
 */
export const toSinglePage = <T>(options: T[] | undefined): Promise<TPaginatedResponse<T[]>> =>
  Promise.resolve({ results: options ?? [], next_page_results: false });

/**
 * Trigger classes for a property select shown read-only on the published board. A disabled trigger
 * would mute its text and swallow the click, so keep the normal text colour and let pointer events
 * fall through to the wrapping tooltip and card link.
 */
export const READ_ONLY_SELECT_CLASSNAME = "disabled:pointer-events-none disabled:text-secondary!";
