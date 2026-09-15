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
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  /** Which sub switch the section needs (P0-CFG-03). */
  section?: "org" | "reports" | "approvals";
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
  const { identity, identityLoader, identityErrorCode, isEnabled, isWorkspaceAdmin } = research;

  useEffect(() => {
    if (workspaceSlug && !identity)
      void research.fetchIdentity(workspaceSlug).catch(() => {
        /* handled through identityErrorCode */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  if (!workspaceSlug) return <Navigate to="/" replace />;
  if (identityErrorCode) return <Navigate to={`/${workspaceSlug}/`} replace />;
  if (identityLoader || !identity) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const sectionEnabled =
    section === "org"
      ? identity.sections.org
      : section === "approvals"
        ? identity.sections.approvals
        : section === "reports"
          ? identity.sections.reports
          : true;

  if (!isEnabled || !sectionEnabled || (adminOnly && !isWorkspaceAdmin)) {
    return <Navigate to={`/${workspaceSlug}/`} replace />;
  }

  return <Outlet />;
});
