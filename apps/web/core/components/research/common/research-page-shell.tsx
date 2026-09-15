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
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  titleKey: string;
  descriptionKey?: string;
  section?: "org" | "reports" | "approvals";
  adminOnly?: boolean;
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
  actions,
  children,
}: Props) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const research = useResearch();
  const { identity, identityLoader } = research;

  useEffect(() => {
    if (workspaceSlug && !identity) void research.fetchIdentity(workspaceSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

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

  if (!research.isEnabled || !sectionEnabled || (adminOnly && !research.isWorkspaceAdmin)) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <p className="text-14 text-secondary">{t("research.errors.module_disabled")}</p>
        <p className="text-12 text-tertiary">{t("research.errors.permission_denied")}</p>
      </div>
    );
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
