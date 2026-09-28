/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TDashboardTab } from "@plane/shared-state";
import { useDashboardOperationsStore } from "./use-operations-store";

interface Props {
  tab: TDashboardTab;
  children: React.ReactNode;
}

/** Jump to a deep tab without leaving the dashboard route. */
export function OverviewDeepLink({ tab, children }: Props): React.ReactElement {
  const store = useDashboardOperationsStore();
  return (
    <button
      type="button"
      className="text-accent text-11 font-medium hover:underline"
      onClick={() => store.setTab(tab)}
      data-testid={`overview-deep-link-${tab}`}
    >
      {children}
    </button>
  );
}
