"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { ProjectStateRoot } from "@/components/project-states";
// hook
import { useProject } from "@/hooks/store";

const StatesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - States` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="py-8 pr-9">
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">States</h3>
        </div>
        {workspaceSlug && projectId && (
          <ProjectStateRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
        )}
      </div>
    </>
  );
});

export default StatesSettingsPage;
