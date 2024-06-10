"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { EstimateRoot } from "@/components/estimates";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useUser, useProject } from "@/hooks/store";

const EstimatesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Estimates` : undefined;

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <EstimateRoot workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} isAdmin={isAdmin} />
      </div>
    </>
  );
});

export default EstimatesSettingsPage;
