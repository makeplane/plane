"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
// component
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper } from "@/components/settings";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { WorkspaceWorklogRoot, WorkspaceWorklogsUpgrade } from "@/plane-web/components/worklogs";
import { useFlag } from "@/plane-web/hooks/store";
const WorklogsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const isFeatureEnabled = useFlag(workspaceSlug.toString(), "ISSUE_WORKLOG");

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Worklogs` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  if (!workspaceSlug || !currentWorkspace) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper size={isFeatureEnabled ? "lg" : "md"}>
      <PageHead title={pageTitle} />
      <WithFeatureFlagHOC
        workspaceSlug={workspaceSlug?.toString()}
        flag="ISSUE_WORKLOG"
        fallback={<WorkspaceWorklogsUpgrade />}
      >
        <WorkspaceWorklogRoot workspaceSlug={workspaceSlug.toString()} workspaceId={currentWorkspace.id} />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
});

export default WorklogsPage;
