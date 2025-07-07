"use client";

import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { WorkspaceDraftIssuesRoot } from "@/components/issues/workspace-draft";

const WorkspaceDraftPage = () => {
  // router
  const { workspaceSlug: routeWorkspaceSlug } = useParams();
  const pageTitle = "Workspace Draft";

  // derived values
  const workspaceSlug = (routeWorkspaceSlug as string) || undefined;

  if (!workspaceSlug) return null;
  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <WorkspaceDraftIssuesRoot workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
};

export default WorkspaceDraftPage;
