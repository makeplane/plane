/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { type ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { Navigate, useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Spinner } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  titleKey: string;
  descriptionKey?: string;
  section?: "org" | "reports" | "approvals";
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
  adminOnly = false,
  allowDisabled = false,
  actions,
  children,
}: Props) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const research = useResearch();
  const { identity, identityLoader, identityErrorCode } = research;

  useEffect(() => {
    if (workspaceSlug && !identity)
      void research.fetchIdentity(workspaceSlug).catch(() => {
        /* handled through identityErrorCode */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  // module off / not a member: fall back to the workspace home (P0-UI-07)
  if (identityErrorCode) return <Navigate to={`/${workspaceSlug}/`} replace />;

  const sectionEnabled =
    section === "org"
      ? identity?.sections.org
      : section === "approvals"
        ? identity?.sections.approvals
        : identity?.sections.reports;

  if (identityLoader || !identity) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // switch off or no permission: fall back to the workspace home (P0-UI-07)
  if ((!allowDisabled && (!research.isEnabled || !sectionEnabled)) || (adminOnly && !research.isWorkspaceAdmin))
    return <Navigate to={`/${workspaceSlug}/`} replace />;

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
