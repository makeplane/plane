"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core/page-title";
import { ArchivedIssuesHeader } from "@/components/issues/archived-issues-header";
import { ArchivedIssueLayoutRoot } from "@/components/issues/issue-layouts/roots/archived-issue-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";

const ProjectArchivedIssuesPage = observer(() => {
  // router
  const { projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
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
});

export default ProjectArchivedIssuesPage;
