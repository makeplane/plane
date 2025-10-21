"use client";

// components
import { PageHead } from "@/components/core/page-title";
import { WorkspaceDraftIssuesRoot } from "@/components/issues/workspace-draft";

type WorkspaceDraftPageProps = {
  params: {
    workspaceSlug: string;
  };
};

function WorkspaceDraftPage({ params }: WorkspaceDraftPageProps) {
  const { workspaceSlug } = params;
  const pageTitle = "Workspace Draft";

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <WorkspaceDraftIssuesRoot workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
}

export default WorkspaceDraftPage;
