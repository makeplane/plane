import { Fragment } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel, EDraftIssuePaginationType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import { cn } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// components
import { DraftIssueBlock } from "./draft-issue-block";
import { WorkspaceDraftEmptyState } from "./empty-state";
import { WorkspaceDraftIssuesLoader } from "./loader";

type TWorkspaceDraftIssuesRoot = {
  workspaceSlug: string;
};

export const WorkspaceDraftIssuesRoot = observer(function WorkspaceDraftIssuesRoot(props: TWorkspaceDraftIssuesRoot) {
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
      <EmptyStateDetailed
        title={t("workspace_projects.empty_state.no_projects.title")}
        description={t("workspace_projects.empty_state.no_projects.description")}
        assetKey="project"
        assetClassName="size-40"
        actions={[
          {
            label: t("workspace_projects.empty_state.no_projects.primary_button.text"),
            onClick: () => {
              toggleCreateProjectModal(true);
            },
            disabled: !hasMemberLevelPermission,
            variant: "primary",
          },
        ]}
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
              className={cn("h-11 pl-6 p-3 text-13 font-medium bg-surface-1 border-b border-subtle transition-all", {
                "text-accent-primary hover:text-accent-secondary cursor-pointer underline-offset-2 hover:underline":
                  paginationInfo?.next_page_results,
              })}
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
