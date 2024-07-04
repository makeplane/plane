"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web components
import { WorkspaceActiveCyclesRoot } from "@/plane-web/components/active-cycles";

const WorkspaceActiveCyclesPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Active Cycles` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceActiveCyclesRoot />
    </>
  );
});

export default WorkspaceActiveCyclesPage;
