"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// icons
import { Circle, ExternalLink, RssIcon } from "lucide-react";
// plane imports
import { EIssuesStoreType, EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Button, LayersIcon, Tooltip, Header } from "@plane/ui";
// components
import { BreadcrumbLink, CountChip } from "@/components/common";
// constants
import HeaderFilters from "@/components/issues/filters";
// helpers
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@/helpers/common.helper";
// hooks
import { useEventTracker, useProject, useCommandPalette, useUserPermissions } from "@/hooks/store";
import { useIssues } from "@/hooks/store/use-issues";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";

export const AdvancedIssuesHeader = observer(() => {
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  // store hooks
  const {
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.PROJECT);

  const { currentProjectDetails, loader } = useProject();

  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  const publishedURL = `${SPACE_APP_URL}/issues/${currentProjectDetails?.anchor}`;

  const issuesCount = getGroupIssueCount(undefined, undefined, false);
  const canUserCreateIssue = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={() => router.back()} isLoading={loader === "init-loader"}>
            <ProjectBreadcrumb />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={t("issue.label", { count: 2 })}
                  icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
          </Breadcrumbs>
          {issuesCount && issuesCount > 0 ? (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`There are ${issuesCount} ${issuesCount > 1 ? "work items" : "work item"} in this project`}
              position="bottom"
            >
              <CountChip count={issuesCount} />
            </Tooltip>
          ) : null}
          <Link
            href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/overview`}
            className="border border-custom-border-100 rounded px-2.5 py-1.5 flex gap-1 text-custom-text-300 hover:text-custom-text-300"
          >
            <RssIcon className="flex h-[14px] w-[14px] my-auto" />
            <span className="hidden text-xs md:block font-medium">{t("common.overview")}</span>
          </Link>
        </div>
        {currentProjectDetails?.anchor ? (
          <a
            href={publishedURL}
            className="group flex items-center gap-1.5 rounded bg-custom-primary-100/10 px-2.5 py-1 text-xs font-medium text-custom-primary-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Circle className="h-1.5 w-1.5 fill-custom-primary-100" strokeWidth={2} />
            {t("common.access.public")}
            <ExternalLink className="hidden h-3 w-3 group-hover:block" strokeWidth={2} />
          </a>
        ) : (
          <></>
        )}
      </Header.LeftItem>
      <Header.RightItem>
        <div className="hidden gap-3 md:flex">
          <HeaderFilters
            projectId={projectId}
            currentProjectDetails={currentProjectDetails}
            workspaceSlug={workspaceSlug}
            canUserCreateIssue={canUserCreateIssue}
          />
        </div>
        {canUserCreateIssue ? (
          <Button
            onClick={() => {
              setTrackElement("Project work items page");
              toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
            }}
            size="sm"
          >
            <div className="block sm:hidden">{t("issue.label", { count: 1 })}</div>
            <div className="hidden sm:block">{t("issue.add.label")}</div>
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
