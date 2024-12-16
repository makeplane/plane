"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
// hooks
import { PageHead } from "@/components/core";
import { useWorkspace } from "@/hooks/store";
// plane web components
import { TeamsUpgrade } from "@/plane-web/components/teams/upgrade";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

const TeamsLayout = observer(({ children }: { children: ReactNode }) => {
  // store
  const { currentWorkspace } = useWorkspace();
  // plane web stores
  const { isTeamsFeatureEnabled } = useTeams();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Teams` : undefined;

  if (!isTeamsFeatureEnabled)
    return (
      <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
        <TeamsUpgrade />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      {children}
    </>
  );
});

export default TeamsLayout;
