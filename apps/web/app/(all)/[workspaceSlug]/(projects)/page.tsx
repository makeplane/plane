/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useNavigate, useParams } from "react-router";
// components
import { useTranslation } from "@plane/i18n";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
import { WorkspaceHomeView } from "@/components/home";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local components
import { WorkspaceDashboardHeader } from "./header";

// Team Ops: the first time the workspace is opened in a browser session, land on Workday. Home stays one click away.
const TEAM_OPS_LANDED_KEY = "team-ops-landed-on-workday";

function WorkspaceDashboardPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    try {
      if (!workspaceSlug || sessionStorage.getItem(TEAM_OPS_LANDED_KEY)) return;
      sessionStorage.setItem(TEAM_OPS_LANDED_KEY, "1");
      void navigate(`/${workspaceSlug}/team-ops/workday/`, { replace: true });
    } catch {
      // storage can be blocked; Home is then simply shown
    }
  }, [workspaceSlug, navigate]);
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - ${t("home.title")}` : undefined;

  return (
    <>
      <AppHeader header={<WorkspaceDashboardHeader />} />
      <ContentWrapper>
        <PageHead title={pageTitle} />
        <WorkspaceHomeView />
      </ContentWrapper>
    </>
  );
}

export default observer(WorkspaceDashboardPage);
