"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// component
import { PageHead } from "@/components/core";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// store hooks
import { useUser, useWorkspace } from "@/hooks/store";
// plane web components
import { WorkspaceWorklogRoot } from "@/plane-web/components/worklogs";
// plane web constants

const ApiTokensPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Worklogs` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

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
      <WorkspaceWorklogRoot workspaceSlug={workspaceSlug.toString()} workspaceId={currentWorkspace.id} />
    </>
  );
});

export default ApiTokensPage;
