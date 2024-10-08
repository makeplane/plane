"use client";

// components
import { PageHead } from "@/components/core";

const WorkspaceDraftPage = () => {
  const pageTitle = "Workspace Draft";

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">Root</div>
    </>
  );
};

export default WorkspaceDraftPage;
