/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
import type { ContextBasedActionsProps, TContextEntityMap } from "@/components/power-k/ui/pages/context-based";
// local imports
import type { TPowerKContextTypeExtended } from "../../types";

export const CONTEXT_ENTITY_MAP_EXTENDED: Record<TPowerKContextTypeExtended, TContextEntityMap> = {};

export function PowerKContextBasedActionsExtended(_props: ContextBasedActionsProps) {
  return null;
}

export const usePowerKContextBasedExtendedActions = (): TPowerKCommandConfig[] => [];
