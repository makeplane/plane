"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { EstimateRoot } from "@/components/estimates";
// hooks
import { useUser, useProject } from "@/hooks/store";

const EstimatesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  const {
    canPerformProjectAdminActions,
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Estimates` : undefined;

  if (!workspaceSlug || !projectId) return <></>;

  if (currentProjectRole && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div
        className={`w-full overflow-y-auto ${canPerformProjectAdminActions ? "" : "pointer-events-none opacity-60"}`}
      >
        <EstimateRoot
          workspaceSlug={workspaceSlug?.toString()}
          projectId={projectId?.toString()}
          isAdmin={canPerformProjectAdminActions}
        />
      </div>
    </>
  );
});

export default EstimatesSettingsPage;
