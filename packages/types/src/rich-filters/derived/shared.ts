/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Generic utility type to check if a configuration type supports specific filter types.
 * Returns the operator key if any member of the union includes the target filter types, never otherwise.
 */
export type TFilterOperatorHelper<
  TOperatorConfigs,
  K extends keyof TOperatorConfigs,
  TTargetFilter,
> = TTargetFilter extends TOperatorConfigs[K] ? K : TOperatorConfigs[K] extends TTargetFilter ? K : never;
