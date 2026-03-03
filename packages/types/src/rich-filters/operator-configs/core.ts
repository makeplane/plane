/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFilterValue } from "../expression";
import type {
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
} from "../field-types";
import type { CORE_COLLECTION_OPERATOR, CORE_COMPARISON_OPERATOR, CORE_EQUALITY_OPERATOR } from "../operators";

// ----------------------------- EXACT Operator -----------------------------
export type TCoreExactOperatorConfigs =
  | TSingleSelectFilterFieldConfig<TFilterValue>
  | TDateFilterFieldConfig<TFilterValue>;

// ----------------------------- IN Operator -----------------------------
export type TCoreInOperatorConfigs = TMultiSelectFilterFieldConfig<TFilterValue>;

// ----------------------------- RANGE Operator -----------------------------
export type TCoreRangeOperatorConfigs = TDateRangeFilterFieldConfig<TFilterValue>;

// ----------------------------- Core Operator Specific Configs -----------------------------
export type TCoreOperatorSpecificConfigs = {
  [CORE_EQUALITY_OPERATOR.EXACT]: TCoreExactOperatorConfigs;
  [CORE_COLLECTION_OPERATOR.IN]: TCoreInOperatorConfigs;
  [CORE_COMPARISON_OPERATOR.RANGE]: TCoreRangeOperatorConfigs;
};
