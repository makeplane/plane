"use client";

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { ArchivedIssuesHeader } from "@/components/issues/archived-issues-header";
import { ArchivedIssueLayoutRoot } from "@/components/issues/issue-layouts/roots/archived-issue-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";

type ProjectArchivedIssuesPageProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

function ProjectArchivedIssuesPage({ params }: ProjectArchivedIssuesPageProps) {
  const { projectId } = params;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name && `${project?.name} - Archived work items`;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ArchivedIssuesHeader />
        <ArchivedIssueLayoutRoot />
      </div>
    </>
  );
}

export default observer(ProjectArchivedIssuesPage);
