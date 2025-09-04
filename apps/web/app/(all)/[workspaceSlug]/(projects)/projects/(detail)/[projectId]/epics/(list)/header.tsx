"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EProjectFeatureKey, EUserPermissionsLevel } from "@plane/constants";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
import { Breadcrumbs, Button, Tooltip, Header } from "@plane/ui";
// components
import { CountChip } from "@/components/common/count-chip";
import { HeaderFilters } from "@/components/issues/filters";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
import { useIssueTypes } from "@/plane-web/hooks/store";

export const EpicsHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState(false);
  // store hooks
  const { getProjectEpicId } = useIssueTypes();
  const {
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.EPIC);
  const { currentProjectDetails, loader } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();
  // derived values
  const issuesCount = getGroupIssueCount(undefined, undefined, false) || 0;
  const canUserCreateIssue = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const projectEpicId = getProjectEpicId(projectId?.toString());

  return (
    <>
      <CreateUpdateEpicModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => setIsCreateIssueModalOpen(false)}
        data={{
          project_id: projectId.toString(),
          type_id: projectEpicId,
        }}
      />
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2.5">
            <Breadcrumbs onBack={() => router.back()} isLoading={loader === "init-loader"}>
              <CommonProjectBreadcrumbs
                workspaceSlug={workspaceSlug?.toString()}
                projectId={currentProjectDetails?.id?.toString() ?? ""}
                featureKey={EProjectFeatureKey.EPICS}
                isLast
              />
            </Breadcrumbs>
            {issuesCount > 0 ? (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={`There are ${issuesCount} ${issuesCount > 1 ? "epics" : "epic"} in this project`}
                position="bottom"
              >
                <CountChip count={issuesCount} />
              </Tooltip>
            ) : null}
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <div className="hidden gap-3 md:flex">
            <HeaderFilters
              storeType={EIssuesStoreType.EPIC}
              projectId={projectId?.toString()}
              currentProjectDetails={currentProjectDetails}
              workspaceSlug={workspaceSlug?.toString()}
              canUserCreateIssue={canUserCreateIssue}
            />
          </div>
          {canUserCreateIssue && (
            <Button
              onClick={() => {
                setIsCreateIssueModalOpen(true);
              }}
              size="sm"
            >
              <div className="hidden sm:block">New</div> Epic
            </Button>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
