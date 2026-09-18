/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { type ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Spinner } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { ResearchStatusPanel, type TResearchStatus } from "@/components/research/common/research-status-panel";
// hooks
import { useResearch } from "@/hooks/store/use-research";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  titleKey: string;
  descriptionKey?: string;
  section?: "org" | "reports" | "approvals" | "stages" | "experiments" | "code" | "integrations";
  /**
   * Navigation key this page belongs to (v2.5.0). The backend publishes the
   * keys the caller may reach, so the page guard and the sidebar entry can
   * never disagree. Project scoped pages omit it: they stay on the project ACL.
   */
  navKey?: string;
  /** Restricts the page to research configuration rights. */
  adminOnly?: boolean;
  /** Platform settings must stay reachable while the workspace switch is off. */
  allowDisabled?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Shared shell for research pages: resolves the caller's research identity once
 * per workspace, renders loading/denied states and the page chrome.
 */
export const ResearchPageShell = observer(function ResearchPageShell({
  titleKey,
  descriptionKey,
  section = "reports",
  navKey,
  adminOnly = false,
  allowDisabled = false,
  actions,
  children,
}: Props) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const research = useResearch();
  const { getWorkspaceBySlug } = useWorkspace();
  const { identity, identityLoader, identityErrorCode } = research;

  useEffect(() => {
    if (workspaceSlug && (research.identityWorkspaceSlug !== workspaceSlug || !identity))
      void research.fetchIdentity(workspaceSlug).catch(() => {
        /* handled through identityErrorCode */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const isCurrentWorkspaceIdentity = Boolean(workspaceSlug && research.identityWorkspaceSlug === workspaceSlug);
  const workspaceName = workspaceSlug ? getWorkspaceBySlug(workspaceSlug)?.name : undefined;
  const retryIdentity = () => {
    if (workspaceSlug) void research.fetchIdentity(workspaceSlug).catch(() => undefined);
  };

  if (workspaceSlug && isCurrentWorkspaceIdentity && identityErrorCode) {
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
        onRetry={status === "load_failed" ? retryIdentity : undefined}
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

  if (!workspaceSlug) return null;

  const sectionEnabled = identity.sections?.[section] ?? identity.sections?.reports;

  // Switch off, disabled section or a level that does not open this surface:
  // fall back to the workspace home (P0-UI-07). Pages that stay reachable while
  // the module is off keep their own administrator gate, so the capability list
  // is only enforced while the module is on.
  const surfaceMissing = !allowDisabled && (!research.isEnabled || !sectionEnabled);
  const levelDenied = research.isEnabled && navKey !== undefined && !research.canSee(navKey);

  if (surfaceMissing || levelDenied || (adminOnly && !research.isResearchAdmin)) {
    const status: TResearchStatus = surfaceMissing
      ? !identity.module_enabled
        ? "module_disabled"
        : !identity.workspace_enabled
          ? "workspace_disabled"
          : "section_disabled"
      : "permission_denied";
    return <ResearchStatusPanel status={status} workspaceSlug={workspaceSlug} workspaceName={workspaceName} />;
  }

  return (
    <>
      <PageHead title={t(titleKey)} />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-subtle px-5 py-3">
          <div>
            <h2 className="text-14 font-medium text-primary">{t(titleKey)}</h2>
            {descriptionKey && <p className="mt-0.5 text-12 text-tertiary">{t(descriptionKey)}</p>}
          </div>
          {actions}
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
});
