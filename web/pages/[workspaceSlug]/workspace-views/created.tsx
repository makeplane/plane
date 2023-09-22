import { useRouter } from "next/router";

import useSWR from "swr";

// hook
import useUser from "hooks/use-user";
import useMyIssuesFilters from "hooks/my-issues/use-my-issues-filter";
// services
import workspaceService from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import { SpreadsheetView } from "components/core";
import { WorkspaceViewsNavigation } from "components/workspace/views/workpace-view-navigation";
import { WorkspaceIssuesViewOptions } from "components/issues/workspace-views/workspace-issue-view-option";
// ui
import { EmptyState, PrimaryButton } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";
// images
import emptyView from "public/empty-state/view.svg";
// fetch-keys
import { WORKSPACE_VIEW_DETAILS, WORKSPACE_VIEW_ISSUES } from "constants/fetch-keys";

const WorkspaceViewCreatedIssue: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const { user } = useUser();

  const { data: viewDetails, error } = useSWR(
    workspaceSlug && workspaceViewId ? WORKSPACE_VIEW_DETAILS(workspaceViewId.toString()) : null,
    workspaceSlug && workspaceViewId
      ? () => workspaceService.getViewDetails(workspaceSlug.toString(), workspaceViewId.toString())
      : null
  );
  const { displayFilters } = useMyIssuesFilters(workspaceSlug?.toString());

  const params: any = {
    assignees: undefined,
    state: undefined,
    state_group: undefined,
    subscriber: undefined,
    priority: undefined,
    labels: undefined,
    created_by: user?.id ?? undefined,
    start_date: undefined,
    target_date: undefined,
    sub_issue: false,
    type: displayFilters?.type ? displayFilters?.type : undefined,
  };

  const { data: viewIssues, mutate: mutateIssues } = useSWR(
    workspaceSlug ? WORKSPACE_VIEW_ISSUES(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => workspaceService.getViewIssues(workspaceSlug.toString(), params) : null
  );

  return (
    <IssueViewContextProvider>
      <WorkspaceAuthorizationLayout
        breadcrumbs={
          <div className="flex gap-2 items-center">
            <CheckCircle className="h-[18px] w-[18px] stroke-[1.5]" />
            <span className="text-sm font-medium">
              {viewDetails ? `${viewDetails.name} Issues` : "Workspace Issues"}
            </span>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <WorkspaceIssuesViewOptions />
            <PrimaryButton
              className="flex items-center gap-2"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "c" });
                document.dispatchEvent(e);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Add Issue
            </PrimaryButton>
          </div>
        }
      >
        <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
          <div className="h-full w-full border-b border-custom-border-300">
            <WorkspaceViewsNavigation user={user} />
            {error ? (
              <EmptyState
                image={emptyView}
                title="View does not exist"
                description="The view you are looking for does not exist or has been deleted."
                primaryButton={{
                  text: "View other views",
                  onClick: () => router.push(`/${workspaceSlug}/workspace-views`),
                }}
              />
            ) : (
              <div className="h-full w-full flex flex-col">
                <SpreadsheetView
                  spreadsheetIssues={viewIssues}
                  mutateIssues={mutateIssues}
                  handleIssueAction={(...args) => {}}
                  disableUserActions={false}
                  user={user}
                  userAuth={{
                    isGuest: false,
                    isMember: false,
                    isOwner: false,
                    isViewer: false,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </WorkspaceAuthorizationLayout>
    </IssueViewContextProvider>
  );
};

export default WorkspaceViewCreatedIssue;
