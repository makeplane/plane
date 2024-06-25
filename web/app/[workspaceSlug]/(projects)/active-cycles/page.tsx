"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { WorkspaceActiveCyclesList } from "@/components/workspace";
// hooks
import { useWorkspace } from "@/hooks/store";

const WorkspaceActiveCyclesPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Active Cycles` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceActiveCyclesList />
    </>
  );
});

export default WorkspaceActiveCyclesPage;
