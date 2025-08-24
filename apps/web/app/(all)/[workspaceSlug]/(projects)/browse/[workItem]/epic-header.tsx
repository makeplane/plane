"use client";
import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Sidebar } from "lucide-react";
// plane imports
import { EProjectFeatureKey, EUserPermissionsLevel } from "@plane/constants";
import { EIssueServiceType, EIssuesStoreType, EUserProjectRoles, EWorkItemConversionType, TIssue } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// helpers
import { IssueSubscription } from "@/components/issues/issue-detail/subscription";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// plane-web components
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { ConvertWorkItemAction } from "@/plane-web/components/epics/conversions";
import { ProjectEpicQuickActions } from "@/plane-web/components/epics/quick-actions/epic-quick-action";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

export const EpicItemDetailsHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, workItem } = useParams();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { getProjectById, loader } = useProject();
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { allowPermissions } = useUserPermissions();
  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const { epicDetailSidebarCollapsed, toggleEpicDetailSidebar } = useAppTheme();
  // derived values
  const epicId = getIssueIdByIdentifier(workItem?.toString());
  const issueDetails = epicId ? getIssueById(epicId.toString()) : undefined;
  const projectId = issueDetails ? issueDetails?.project_id : undefined;
  const projectDetails = projectId ? getProjectById(projectId?.toString()) : undefined;

  const isEditingAllowed = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectId?.toString()
  );

  const handleDelete = async () => {
    if (issueDetails) {
      await removeIssue(issueDetails.project_id, issueDetails.id).then(() => {
        // TODO: add toast
        router.push(`/${workspaceSlug}/projects/${projectId}/epics`);
      });
    }
  };

  const handleUpdate = async (data: Partial<TIssue>) => {
    if (issueDetails && updateIssue) {
      // TODO: add toast
      await updateIssue(issueDetails.project_id, issueDetails.id, data);
    }
  };

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectDetails?.id?.toString() ?? ""}
            featureKey={EProjectFeatureKey.EPICS}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={projectDetails && issueDetails ? `${projectDetails.identifier}-${issueDetails.sequence_id}` : ""}
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        {epicId && projectId && (
          <IssueSubscription
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            issueId={epicId}
            serviceType={EIssueServiceType.EPICS}
          />
        )}
        {issueDetails && (
          <div ref={parentRef} className="flex items-center gap-2">
            <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="WORK_ITEM_CONVERSION" fallback={<></>}>
              <ConvertWorkItemAction
                workItemId={issueDetails?.id}
                conversionType={EWorkItemConversionType.WORK_ITEM}
                disabled={!isEditingAllowed || !!issueDetails?.archived_at}
              />
            </WithFeatureFlagHOC>
            <ProjectEpicQuickActions
              parentRef={parentRef}
              issue={issueDetails}
              handleDelete={handleDelete}
              handleUpdate={handleUpdate}
              readOnly={!isEditingAllowed}
            />
            <Sidebar
              className={cn("size-4 cursor-pointer", {
                "text-custom-primary-100": !epicDetailSidebarCollapsed,
              })}
              onClick={() => toggleEpicDetailSidebar(!epicDetailSidebarCollapsed)}
            />
          </div>
        )}
      </Header.RightItem>
    </Header>
  );
});
