/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Navigate, Outlet, useParams } from "react-router";
// plane imports
import { Spinner } from "@plane/ui";
// components
import { ResearchStatusPanel, type TResearchStatus } from "@/components/research/common/research-status-panel";
// hooks
import { useResearch } from "@/hooks/store/use-research";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  /** Which sub switch the section needs (P0-CFG-03). */
  section?: "org" | "reports" | "approvals" | "stages" | "experiments" | "code" | "integrations";
  /** Restricts the section to workspace admins. */
  adminOnly?: boolean;
};

/**
 * Shared route guard: hides research routes when the module is off and sends
 * the user back to the workspace home instead of rendering a blank page
 * (P0-UI-06 / P0-UI-07). The backend remains the source of truth.
 */
export const ResearchGuard = observer(function ResearchGuard({ section, adminOnly = false }: Props) {
  const { workspaceSlug } = useParams();
  const research = useResearch();
  const { getWorkspaceBySlug } = useWorkspace();
  const { identity, identityLoader, identityErrorCode, isEnabled, isResearchAdmin } = research;

  useEffect(() => {
    if (workspaceSlug && (research.identityWorkspaceSlug !== workspaceSlug || !identity))
      void research.fetchIdentity(workspaceSlug).catch(() => {
        /* handled through identityErrorCode */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  if (!workspaceSlug) return <Navigate to="/" replace />;
  const isCurrentWorkspaceIdentity = research.identityWorkspaceSlug === workspaceSlug;
  const workspaceName = getWorkspaceBySlug(workspaceSlug)?.name;
  if (isCurrentWorkspaceIdentity && identityErrorCode) {
    const status: TResearchStatus =
      identityErrorCode === "research_permission_denied" || identityErrorCode === "research_workspace_not_found"
        ? "permission_denied"
        : identityErrorCode === "research_module_disabled" || identityErrorCode === "research_module_not_enabled"
          ? "module_disabled"
          : "load_failed";
    return (
      <ResearchStatusPanel
        status={status}
        workspaceSlug={workspaceSlug}
        workspaceName={workspaceName}
        onRetry={
          status === "load_failed" ? () => void research.fetchIdentity(workspaceSlug).catch(() => undefined) : undefined
        }
        isRetrying={identityLoader}
      />
    );
  }
  if (identityLoader || !isCurrentWorkspaceIdentity || !identity) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const sectionEnabled = section ? (identity.sections?.[section] ?? false) : true;

  if (!isEnabled || !sectionEnabled || (adminOnly && !isResearchAdmin)) {
    const status: TResearchStatus = !identity.module_enabled
      ? "module_disabled"
      : !identity.workspace_enabled
        ? "workspace_disabled"
        : !sectionEnabled
          ? "section_disabled"
          : "permission_denied";
    return <ResearchStatusPanel status={status} workspaceSlug={workspaceSlug} workspaceName={workspaceName} />;
  }

  return <Outlet />;
});
