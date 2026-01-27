/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFilterValue } from "../expression";
import type { TCoreFilterFieldConfigs } from "./core";
import { CORE_FILTER_FIELD_TYPE } from "./core";
import type { TExtendedFilterFieldConfigs } from "./extended";
import { EXTENDED_FILTER_FIELD_TYPE } from "./extended";

// -------- COMPOSED FILTER TYPES --------

export const FILTER_FIELD_TYPE = {
  ...CORE_FILTER_FIELD_TYPE,
  ...EXTENDED_FILTER_FIELD_TYPE,
} as const;

export type TFilterFieldType = (typeof FILTER_FIELD_TYPE)[keyof typeof FILTER_FIELD_TYPE];

// -------- COMPOSED CONFIGURATIONS --------

/**
 * All supported filter configurations.
 */
export type TSupportedFilterFieldConfigs<V extends TFilterValue = TFilterValue> =
  | TCoreFilterFieldConfigs<V>
  | TExtendedFilterFieldConfigs<V>;

// -------- RE-EXPORTS --------

export * from "./shared";
export * from "./core";
export * from "./extended";
