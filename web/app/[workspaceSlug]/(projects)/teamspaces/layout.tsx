"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
// hooks
import { PageHead } from "@/components/core";
import { useWorkspace } from "@/hooks/store";
// plane web components
import { TeamspaceUpgrade } from "@/plane-web/components/teamspaces/upgrade";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

const TeamspacesLayout = observer(({ children }: { children: ReactNode }) => {
  // store
  const { currentWorkspace } = useWorkspace();
  // plane web stores
  const { loader, isTeamspacesFeatureEnabled } = useTeamspaces();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Teamspaces` : undefined;

  if (isTeamspacesFeatureEnabled !== undefined && isTeamspacesFeatureEnabled === false && loader !== "init-loader")
    return (
      <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
        <TeamspaceUpgrade />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      {children}
    </>
  );
});

export default TeamspacesLayout;
