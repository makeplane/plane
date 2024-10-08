"use client";

// components
import { PageHead } from "@/components/core";
import { WorkspaceDraftIssueLayoutRoot } from "@/components/issues/issue-layouts/filters/applied-filters/roots/workspace-draft-root";

const WorkspaceDraftPage = () => {
  const pageTitle = "Workspace Draft";

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">
        <WorkspaceDraftIssueLayoutRoot />
      </div>
    </>
  );
};

export default WorkspaceDraftPage;
