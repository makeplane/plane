"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { ProjectFeaturesList } from "@/components/project";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useProject, useUser } from "@/hooks/store";

const FeaturesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store
  const {
    membership: { fetchUserProjectInfo },
  } = useUser();
  const { currentProjectDetails } = useProject();
  // fetch the project details
  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_ME_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString()) : null
  );
  // derived values
  const isAdmin = memberDetails?.role === EUserProjectRoles.ADMIN;
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Features` : undefined;

  if (!workspaceSlug || !projectId) return null;

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "opacity-60"}`}>
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Features</h3>
        </div>
        <ProjectFeaturesList
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isAdmin={isAdmin}
        />
      </section>
    </>
  );
});

export default FeaturesSettingsPage;