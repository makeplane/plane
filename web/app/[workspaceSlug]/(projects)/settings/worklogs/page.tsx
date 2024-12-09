"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// component
import { PageHead } from "@/components/core";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { WorkspaceWorklogRoot, WorkspaceWorklogsUpgrade } from "@/plane-web/components/worklogs";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store/use-flag";

const WorklogsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const currentWorkspaceDetail = workspaceInfoBySlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Worklogs` : undefined;
  const isAdmin = currentWorkspaceDetail?.role === EUserPermissions.ADMIN;

  if (!workspaceSlug || !currentWorkspace) return <></>;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <WithFeatureFlagHOC
        workspaceSlug={workspaceSlug?.toString()}
        flag={E_FEATURE_FLAGS.ISSUE_WORKLOG}
        fallback={<WorkspaceWorklogsUpgrade />}
      >
        <WorkspaceWorklogRoot workspaceSlug={workspaceSlug.toString()} workspaceId={currentWorkspace.id} />
      </WithFeatureFlagHOC>
    </>
  );
});

export default WorklogsPage;
