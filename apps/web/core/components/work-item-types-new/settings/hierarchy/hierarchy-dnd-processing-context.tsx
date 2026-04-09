/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

type HierarchyDndProcessingContextValue = {
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;
};

const HierarchyDndProcessingContext = createContext<HierarchyDndProcessingContextValue | null>(null);

export function WorkItemTypeHierarchyDndProcessingProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setProcessing] = useState(false);
  const value = useMemo(
    () => ({
      isProcessing,
      setProcessing,
    }),
    [isProcessing]
  );

  return <HierarchyDndProcessingContext.Provider value={value}>{children}</HierarchyDndProcessingContext.Provider>;
}

export function useWorkItemTypeHierarchyDndProcessing(): HierarchyDndProcessingContextValue {
  const ctx = useContext(HierarchyDndProcessingContext);
  if (!ctx) {
    throw new Error(
      "useWorkItemTypeHierarchyDndProcessing must be used within WorkItemTypeHierarchyDndProcessingProvider"
    );
  }
  return ctx;
}
