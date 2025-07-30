"use client";

import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel, EDraftIssuePaginationType, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import { cn } from "@plane/utils";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
import { captureClick } from "@/helpers/event-tracker.helper";
// constants

// helpers
// hooks
import { useCommandPalette, useProject, useUserPermissions, useWorkspaceDraftIssues } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// components
import { DraftIssueBlock } from "./draft-issue-block";
import { WorkspaceDraftEmptyState } from "./empty-state";
import { WorkspaceDraftIssuesLoader } from "./loader";

type TWorkspaceDraftIssuesRoot = {
  workspaceSlug: string;
};

export const WorkspaceDraftIssuesRoot: FC<TWorkspaceDraftIssuesRoot> = observer((props) => {
  const { workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { loader, paginationInfo, fetchIssues, issueIds } = useWorkspaceDraftIssues();
  const { workspaceProjectIds } = useProject();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const hasMemberLevelPermission = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const noProjectResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/projects" });

  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);

  // fetching issues
  const { isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_DRAFT_ISSUES_${workspaceSlug}` : null,
    workspaceSlug ? async () => await fetchIssues(workspaceSlug, "init-loader") : null,
    { revalidateOnFocus: false, revalidateIfStale: false }
  );

  // handle nest issues
  const handleNextIssues = async () => {
    if (!paginationInfo?.next_page_results) return;
    await fetchIssues(workspaceSlug, "pagination", EDraftIssuePaginationType.NEXT);
  };

  if (isLoading) {
    return <WorkspaceDraftIssuesLoader items={14} />;
  }

  if (workspaceProjectIds?.length === 0)
    return (
      <DetailedEmptyState
        size="sm"
        title={t("workspace_projects.empty_state.no_projects.title")}
        description={t("workspace_projects.empty_state.no_projects.description")}
        assetPath={noProjectResolvedPath}
        customPrimaryButton={
          <ComicBoxButton
            label={t("workspace_projects.empty_state.no_projects.primary_button.text")}
            title={t("workspace_projects.empty_state.no_projects.primary_button.comic.title")}
            description={t("workspace_projects.empty_state.no_projects.primary_button.comic.description")}
            onClick={() => {
              toggleCreateProjectModal(true);
              captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
            }}
            disabled={!hasMemberLevelPermission}
          />
        }
      />
    );

  if (issueIds.length <= 0) return <WorkspaceDraftEmptyState />;

  return (
    <div className="relative">
      <div className="relative">
        {issueIds.map((issueId: string) => (
          <DraftIssueBlock key={issueId} workspaceSlug={workspaceSlug} issueId={issueId} />
        ))}
      </div>

      {paginationInfo?.next_page_results && (
        <Fragment>
          {loader === "pagination" && issueIds.length >= 0 ? (
            <WorkspaceDraftIssuesLoader items={1} />
          ) : (
            <div
              className={cn(
                "h-11 pl-6 p-3 text-sm font-medium bg-custom-background-100 border-b border-custom-border-200 transition-all",
                {
                  "text-custom-primary-100 hover:text-custom-primary-200 cursor-pointer underline-offset-2 hover:underline":
                    paginationInfo?.next_page_results,
                }
              )}
              onClick={handleNextIssues}
            >
              Load More &darr;
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
});
