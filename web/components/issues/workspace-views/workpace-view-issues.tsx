import { WORKSPACE_LABELS } from "constants/fetch-keys";
import { useProjectMyMembership } from "contexts/project-member.context";
import useProjects from "hooks/use-projects";
import useUser from "hooks/use-user";
import { useWorkspaceView } from "hooks/use-workspace-issues-view";
import useWorkspaceMembers from "hooks/use-workspace-members";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import projectIssuesServices from "services/issues.service";
import useSWR from "swr";
import { IIssue, IWorkspaceIssueFilterOptions } from "types";
import { CreateUpdateIssueModal } from "../modal";
import { DeleteIssueModal } from "../delete-issue-modal";
import { CreateUpdateViewModal } from "components/views";
import { WorkspaceViewsNavigation } from "components/workspace/views/workpace-view-navigation";
import { EmptyState, PrimaryButton } from "components/ui";
import emptyView from "public/empty-state/view.svg";
import { FiltersList, SpreadsheetView } from "components/core";
import { STATE_GROUP } from "constants/project";

export const WorkspaceViewIssues = () => {
  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const { memberRole } = useProjectMyMembership();
  const { user } = useUser();
  const { isGuest, isViewer } = useWorkspaceMembers(
    workspaceSlug?.toString(),
    Boolean(workspaceSlug)
  );
  const { filters, view, viewIssues, handleFilters } = useWorkspaceView();
  // console.log("filters", filters);
  // console.log("view", view);
  // console.log("viewIssues", viewIssues);
  // console.log("handleFilters", handleFilters);

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

  const { projects: allProjects } = useProjects();
  const joinedProjects = allProjects?.filter((p) => p.is_member);

  const { data: workspaceLabels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => projectIssuesServices.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  // const updateView = async (payload: Partial<IWorkspaceView>) => {
  //   const payloadData = {
  //     query_data: payload,
  //   };

  //   await workspaceService
  //     .updateView(workspaceSlug as string, workspaceViewId as string, payloadData)
  //     .then((res) => {
  //       mutate<IView[]>(
  //         WORKSPACE_VIEWS_LIST(workspaceSlug as string),
  //         (prevData) =>
  //           prevData?.map((p) => {
  //             if (p.id === res.id) return { ...p, ...payloadData };

  //             return p;
  //           }),
  //         false
  //       );
  //       setToastAlert({
  //         type: "success",
  //         title: "Success!",
  //         message: "View updated successfully.",
  //       });
  //     })
  //     .catch(() => {
  //       setToastAlert({
  //         type: "error",
  //         title: "Error!",
  //         message: "View could not be updated. Please try again.",
  //       });
  //     });
  // };

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
    filters.filters &&
    Object.keys(filters.filters).filter(
      (key) => filters.filters[key as keyof IWorkspaceIssueFilterOptions] === null
    );

  const areFiltersApplied =
    filters &&
    Object.keys(filters).length > 0 &&
    nullFilters.length !== Object.keys(filters).length;

  const isNotAllowed = isGuest || isViewer;
  return (
    <>
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
        onSubmit={async () => {
          // mutateWorkspaceIssues();
        }}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
        onSubmit={async () => {
          // mutateWorkspaceIssues();
        }}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueToDelete}
        user={user}
        onSubmit={async () => {
          // mutateWorkspaceIssues();
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
          {false ? (
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
                      filters={filters.filters}
                      setFilters={(updatedFilter) => handleFilters("filters", updatedFilter)}
                      labels={workspaceLabels}
                      members={workspaceMembers?.map((m) => m.member)}
                      stateGroup={STATE_GROUP}
                      project={joinedProjects}
                      clearAllFilters={() =>
                        handleFilters("filters", {
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
                          // updateView(filters);
                          console.log("update");
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
                mutateIssues={viewIssues}
                handleIssueAction={handleIssueAction}
                disableUserActions={isNotAllowed ?? false}
                user={user}
                userAuth={memberRole}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
