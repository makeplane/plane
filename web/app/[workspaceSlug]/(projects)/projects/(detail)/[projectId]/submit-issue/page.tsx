"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
// hooks
import { useProject } from "@/hooks/store";
import { IssueFormRoot } from "@/components/inbox/create-form";

const ProjectDraftIssuesPage = observer(() => {
  const { projectId } = useParams();
  // store
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Submit Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">
        <IssueFormRoot projectId={projectId as string} />
      </div>
    </>
  );
});

export default ProjectDraftIssuesPage;
