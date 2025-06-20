"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { X, PenSquare } from "lucide-react";
// components
import { PageHead } from "@/components/core";
import { DraftIssueLayoutRoot } from "@/components/issues/issue-layouts/roots/draft-issue-layout-root";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

const ProjectDraftIssuesPage = observer(() => {
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Draft work items` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">
        <div className="gap-1 flex items-center border-b border-custom-border-200 px-4 py-2.5 shadow-sm bg-custom-background-100 z-[12]">
          <button
            type="button"
            onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/`)}
            className="flex items-center gap-1.5 rounded-full border border-custom-border-200 px-3 py-1.5 text-xs"
          >
            <PenSquare className="h-4 w-4" />
            <span>Draft work items</span>
            <X className="h-3 w-3" />
          </button>
        </div>
        <DraftIssueLayoutRoot />
      </div>
    </>
  );
});

export default ProjectDraftIssuesPage;
