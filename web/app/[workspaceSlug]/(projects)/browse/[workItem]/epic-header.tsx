"use client";
import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Briefcase, Sidebar } from "lucide-react";
// plane imports
import { EIssueServiceType, EIssuesStoreType, EUserPermissionsLevel, EUserProjectRoles } from "@plane/constants";
import { TIssue } from "@plane/types";
import { Breadcrumbs, EpicIcon, Header, Logo } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useIssueDetail, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// plane-web components
import { ProjectEpicQuickActions } from "@/plane-web/components/epics";

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
    EUserPermissionsLevel.PROJECT
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
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={projectDetails?.name ?? "Project"}
                  icon={
                    projectDetails ? (
                      projectDetails && (
                        <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                          <Logo logo={projectDetails?.logo_props} size={16} />
                        </span>
                      )
                    ) : (
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <Briefcase className="h-4 w-4" />
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/epics`}
                  label="Epics"
                  icon={<EpicIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={
                    projectDetails && issueDetails ? `${projectDetails.identifier}-${issueDetails.sequence_id}` : ""
                  }
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {issueDetails && (
          <div ref={parentRef} className="flex items-center gap-2">
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
