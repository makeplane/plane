/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFilterValue } from "../expression";

// -------- DATE FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support date filter types.
 */
export type TExtendedSupportedDateFilterOperators<_V extends TFilterValue = TFilterValue> = never;

export type TExtendedAllAvailableDateFilterOperatorsForDisplay<_V extends TFilterValue = TFilterValue> = never;

// -------- SELECT FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support select filter types.
 */
export type TExtendedSupportedSelectFilterOperators<_V extends TFilterValue = TFilterValue> = never;

export type TExtendedAllAvailableSelectFilterOperatorsForDisplay<_V extends TFilterValue = TFilterValue> = never;
