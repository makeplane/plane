/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// workspaces imports
import { cn } from "@workspaces/utils";
// components
import { PageHead } from "@/components/core/page-title";
import {
  DASHBOARD_ROLES,
  DASHBOARD_ROLE_STORAGE_KEY,
  DeveloperDashboard,
  DevOpsDashboard,
  PMDashboard,
  QADashboard,
  type TDashboardRole,
} from "@/components/operations";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";

/**
 * The operations dashboard.
 *
 * One route with four points of view rather than four routes, because the
 * question "how is delivery going?" has a different answer per role and the
 * same URL should get each person theirs. The choice is remembered locally so
 * a developer does not land on the PM view every morning.
 */
function OperationsDashboardPage() {
  const { workspaceSlug } = useParams();
  const { storedValue, setValue } = useLocalStorage<TDashboardRole>(DASHBOARD_ROLE_STORAGE_KEY, "developer");
  const role = storedValue ?? "developer";
  const slug = workspaceSlug?.toString() ?? "";

  return (
    <>
      <PageHead title="Engineering operations" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {DASHBOARD_ROLES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setValue(option.key)}
              className={cn(
                "rounded-full px-3 py-1 text-11 font-medium transition-colors",
                role === option.key
                  ? "bg-accent-primary text-on-color"
                  : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {role === "developer" && <DeveloperDashboard workspaceSlug={slug} />}
        {role === "pm" && <PMDashboard workspaceSlug={slug} />}
        {role === "qa" && <QADashboard workspaceSlug={slug} />}
        {role === "devops" && <DevOpsDashboard workspaceSlug={slug} />}
      </div>
    </>
  );
}

export default observer(OperationsDashboardPage);
