"use client";

import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { StickiesInfinite } from "@/components/stickies";

const WorkspaceStickiesPage = () => {
  // router
  const { workspaceSlug: routeWorkspaceSlug } = useParams();
  const pageTitle = "My stickies";

  // derived values
  const workspaceSlug = (routeWorkspaceSlug as string) || undefined;

  if (!workspaceSlug) return null;
  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <StickiesInfinite />
      </div>
    </>
  );
};

export default WorkspaceStickiesPage;
