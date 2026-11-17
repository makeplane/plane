/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// local imports
import type { TPowerKContext, TPowerKPageType } from "@/components/power-k/core/types";

export type TPowerKOpenEntityActionsProps = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  handleSelection: (data: unknown) => void;
};
