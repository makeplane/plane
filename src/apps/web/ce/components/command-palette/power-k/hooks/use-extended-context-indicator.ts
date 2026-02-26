/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// local imports
import type { TPowerKContextType } from "@/components/power-k/core/types";

type TArgs = {
  activeContext: TPowerKContextType | null;
};

export const useExtendedContextIndicator = (_args: TArgs): string | null => null;
