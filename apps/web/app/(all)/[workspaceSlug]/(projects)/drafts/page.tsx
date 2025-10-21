"use client";
import type { Route } from "./+types/page";
// components
import { PageHead } from "@/components/core/page-title";
import { WorkspaceDraftIssuesRoot } from "@/components/issues/workspace-draft";

export default function WorkspaceDraftPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;

  return (
    <>
      <PageHead title="Workspace Draft" />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <WorkspaceDraftIssuesRoot workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
}