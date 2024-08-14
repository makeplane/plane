"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { ProjectFeaturesList } from "@/components/project";
// hooks
import { useProject, useUser } from "@/hooks/store";

const FeaturesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store
  const {
    canPerformProjectAdminActions,
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Features` : undefined;

  if (!workspaceSlug || !projectId) return null;

  if (currentProjectRole && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto py-8 pr-9 ${canPerformProjectAdminActions ? "" : "opacity-60"}`}>
        <ProjectFeaturesList
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isAdmin={canPerformProjectAdminActions}
        />
      </section>
    </>
  );
});

export default FeaturesSettingsPage;
