"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { WorkspaceDashboardView } from "@/components/page-views";
// hooks
import { useWorkspace } from "@/hooks/store";

const WorkspacePage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Home` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceDashboardView />
    </>
  );
});

export default WorkspacePage;
