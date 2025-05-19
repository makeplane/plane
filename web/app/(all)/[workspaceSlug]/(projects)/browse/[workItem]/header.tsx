"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Briefcase } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, LayersIcon, Header, Logo } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { IssueDetailQuickActions } from "@/components/issues";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

export const ProjectIssueDetailsHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, workItem } = useParams();
  // store hooks
  const { t } = useTranslation();
  const { getProjectById, loader } = useProject();
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const issueId = getIssueIdByIdentifier(workItem?.toString());
  const issueDetails = issueId ? getIssueById(issueId.toString()) : undefined;
  const projectId = issueDetails ? issueDetails?.project_id : undefined;
  const projectDetails = projectId ? getProjectById(projectId?.toString()) : undefined;

  if (!workspaceSlug || !projectId || !issueId) return null;

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
                  href={`/${workspaceSlug}/projects/${projectId}/issues`}
                  label={t("common.work_items")}
                  icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
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
        {projectId && issueId && (
          <IssueDetailQuickActions
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            issueId={issueId?.toString()}
          />
        )}
      </Header.RightItem>
    </Header>
  );
});
