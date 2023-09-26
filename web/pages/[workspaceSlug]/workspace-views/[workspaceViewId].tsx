import { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// hook
import useToast from "hooks/use-toast";
import useWorkspaceIssuesFilters from "hooks/use-worskpace-issue-filter";
import useProjects from "hooks/use-projects";
import useUser from "hooks/use-user";
import useWorkspaceMembers from "hooks/use-workspace-members";
// context
import { useProjectMyMembership } from "contexts/project-member.context";
// services
import workspaceService from "services/workspace.service";
import projectIssuesServices from "services/issues.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { FiltersList, SpreadsheetView } from "components/core";
import { WorkspaceViewsNavigation } from "components/workspace/views/workpace-view-navigation";
import { WorkspaceIssuesViewOptions } from "components/issues/workspace-views/workspace-issue-view-option";
import { CreateUpdateViewModal } from "components/views";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// ui
import { EmptyState, PrimaryButton } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";
// images
import emptyView from "public/empty-state/view.svg";
// fetch-keys
import {
  WORKSPACE_LABELS,
  WORKSPACE_VIEWS_LIST,
  WORKSPACE_VIEW_DETAILS,
  WORKSPACE_VIEW_ISSUES,
} from "constants/fetch-keys";
// constant
import { STATE_GROUP } from "constants/project";
// types
import { IIssue, IIssueFilterOptions, IView } from "types";

const WorkspaceView: React.FC = () => {
  const [createViewModal, setCreateViewModal] = useState<any>(null);

  // create issue modal
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  // update issue modal
  const [editIssueModal, setEditIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);

  // delete issue modal
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null);

  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const { memberRole } = useProjectMyMembership();

  const { user } = useUser();
  const { setToastAlert } = useToast();

  const { data: viewDetails, error } = useSWR(
    workspaceSlug && workspaceViewId ? WORKSPACE_VIEW_DETAILS(workspaceViewId.toString()) : null,
    workspaceSlug && workspaceViewId
      ? () => workspaceService.getViewDetails(workspaceSlug.toString(), workspaceViewId.toString())
      : null
  );

  const { params, filters, setFilters } = useWorkspaceIssuesFilters(
    workspaceSlug?.toString(),
    workspaceViewId?.toString()
  );

  const { isGuest, isViewer } = useWorkspaceMembers(
    workspaceSlug?.toString(),
    Boolean(workspaceSlug)
  );

  const { data: viewIssues, mutate: mutateIssues } = useSWR(
    workspaceSlug && viewDetails ? WORKSPACE_VIEW_ISSUES(workspaceSlug.toString(), params) : null,
    workspaceSlug && viewDetails
      ? () => workspaceService.getViewIssues(workspaceSlug.toString(), params)
      : null
  );

  const { projects: allProjects } = useProjects();
  const joinedProjects = allProjects?.filter((p) => p.is_member);

  const { data: workspaceLabels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => projectIssuesServices.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const updateView = async (payload: IIssueFilterOptions) => {
    const payloadData = {
      query_data: payload,
    };

    await workspaceService
      .updateView(workspaceSlug as string, workspaceViewId as string, payloadData)
      .then((res) => {
        mutate<IView[]>(
          WORKSPACE_VIEWS_LIST(workspaceSlug as string),
          (prevData) =>
            prevData?.map((p) => {
              if (p.id === res.id) return { ...p, ...payloadData };

              return p;
            }),
          false
        );
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "View updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "View could not be updated. Please try again.",
        });
      });
  };

  const makeIssueCopy = useCallback(
    (issue: IIssue) => {
      setCreateIssueModal(true);

      setPreloadedData({ ...issue, name: `${issue.name} (Copy)`, actionType: "createIssue" });
    },
    [setCreateIssueModal, setPreloadedData]
  );

  const handleEditIssue = useCallback(
    (issue: IIssue) => {
      setEditIssueModal(true);
      setIssueToEdit({
        ...issue,
        actionType: "edit",
        cycle: issue.issue_cycle ? issue.issue_cycle.cycle : null,
        module: issue.issue_module ? issue.issue_module.module : null,
      });
    },
    [setEditIssueModal, setIssueToEdit]
  );

  const handleDeleteIssue = useCallback(
    (issue: IIssue) => {
      setDeleteIssueModal(true);
      setIssueToDelete(issue);
    },
    [setDeleteIssueModal, setIssueToDelete]
  );

  const handleIssueAction = useCallback(
    (issue: IIssue, action: "copy" | "edit" | "delete" | "updateDraft") => {
      if (action === "copy") makeIssueCopy(issue);
      else if (action === "edit") handleEditIssue(issue);
      else if (action === "delete") handleDeleteIssue(issue);
    },
    [makeIssueCopy, handleEditIssue, handleDeleteIssue]
  );

  const nullFilters =
    filters &&
    Object.keys(filters).filter((key) => filters[key as keyof IIssueFilterOptions] === null);

  const areFiltersApplied =
    filters &&
    Object.keys(filters).length > 0 &&
    nullFilters.length !== Object.keys(filters).length;

  const isNotAllowed = isGuest || isViewer;

  return (
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
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
        onSubmit={async () => {
          mutateIssues();
        }}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
        onSubmit={async () => {
          mutateIssues();
        }}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueToDelete}
        user={user}
        onSubmit={async () => {
          mutateIssues();
        }}
      />
      <CreateUpdateViewModal
        isOpen={createViewModal !== null}
        handleClose={() => setCreateViewModal(null)}
        viewType="workspace"
        preLoadedData={createViewModal}
        user={user}
      />
      <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
        <div className="h-full w-full border-b border-custom-border-300">
          <WorkspaceViewsNavigation handleAddView={() => setCreateViewModal(true)} />
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
              {areFiltersApplied && (
                <>
                  <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-0">
                    <FiltersList
                      filters={filters}
                      setFilters={(updatedFilter) => setFilters(updatedFilter)}
                      labels={workspaceLabels}
                      members={workspaceMembers?.map((m) => m.member)}
                      stateGroup={STATE_GROUP}
                      project={joinedProjects}
                      clearAllFilters={() =>
                        setFilters({
                          assignees: null,
                          created_by: null,
                          labels: null,
                          priority: null,
                          state_group: null,
                          start_date: null,
                          target_date: null,
                          subscriber: null,
                          project: null,
                        })
                      }
                    />
                    <PrimaryButton
                      onClick={() => {
                        if (workspaceViewId) {
                          updateView(filters);
                        } else
                          setCreateViewModal({
                            query: filters,
                          });
                      }}
                      className="flex items-center gap-2 text-sm"
                    >
                      {!workspaceViewId && <PlusIcon className="h-4 w-4" />}
                      {workspaceViewId ? "Update" : "Save"} view
                    </PrimaryButton>
                  </div>
                  {<div className="mt-3 border-t border-custom-border-200" />}
                </>
              )}
              <SpreadsheetView
                spreadsheetIssues={viewIssues}
                mutateIssues={mutateIssues}
                handleIssueAction={handleIssueAction}
                disableUserActions={isNotAllowed ?? false}
                user={user}
                userAuth={memberRole}
              />
            </div>
          )}
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceView;
