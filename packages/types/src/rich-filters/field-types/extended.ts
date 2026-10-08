/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFilterValue } from "../expression";

/**
 * Extended filter types
 */
export const EXTENDED_FILTER_FIELD_TYPE = {} as const;

// -------- UNION TYPES --------

/**
 * All extended filter configurations
 */
export type TExtendedFilterFieldConfigs<_V extends TFilterValue = TFilterValue> = never;
