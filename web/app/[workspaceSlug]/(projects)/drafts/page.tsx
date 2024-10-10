"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { WorkspaceDraftIssueRoot } from "@/components/workspace-draft-issues";
// hooks
import { useWorkspace } from "@/hooks/store";

const WorkspaceDraftIssuesPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Draft Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceDraftIssueRoot />
    </>
  );
});

export default WorkspaceDraftIssuesPage;
