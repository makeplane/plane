"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { ArchivedIssueLayoutRoot, ArchivedIssuesHeader } from "@/components/issues";
// hooks
import { useProject } from "@/hooks/store";

const ProjectArchivedIssuesPage = observer(() => {
  // router
  const { projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name && `${project?.name} - Archived issues`;

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