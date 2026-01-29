/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// mobx store
import type { IEstimate } from "@/plane-web/store/estimates/estimate";

export const useEstimate = (estimateId: string | undefined): IEstimate => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEstimate must be used within StoreProvider");
  if (!estimateId) return {} as IEstimate;

  return context.projectEstimate.estimates?.[estimateId] ?? {};
};
