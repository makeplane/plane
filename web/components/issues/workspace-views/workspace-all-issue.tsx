import { useCallback, useState } from "react";
import { useRouter } from "next/router";

import useSWR from "swr";

// hook
import useUser from "hooks/use-user";
import useWorkspaceMembers from "hooks/use-workspace-members";
import useProjects from "hooks/use-projects";
import { useWorkspaceView } from "hooks/use-workspace-view";
// context
import { useProjectMyMembership } from "contexts/project-member.context";
// services
import workspaceService from "services/workspace.service";
import projectIssuesServices from "services/issues.service";
// components
import { SpreadsheetView, WorkspaceFiltersList } from "components/core";
import { WorkspaceViewsNavigation } from "components/workspace/views/workpace-view-navigation";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { CreateUpdateWorkspaceViewModal } from "components/workspace/views/modal";
// ui
import { PrimaryButton } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { WORKSPACE_LABELS, WORKSPACE_VIEW_ISSUES } from "constants/fetch-keys";
// constants
import { STATE_GROUP } from "constants/project";
// types
import { IIssue, IWorkspaceIssueFilterOptions } from "types";

export const WorkspaceAllIssue = () => {
  const router = useRouter();
  const { workspaceSlug, viewId } = router.query;

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

  const { user } = useUser();
  const { memberRole } = useProjectMyMembership();

  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const { data: workspaceLabels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => projectIssuesServices.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  const { filters, handleFilters } = useWorkspaceView();

  const params: any = {
    assignees: filters?.filters?.assignees ? filters?.filters?.assignees.join(",") : undefined,
    subscriber: filters?.filters?.subscriber ? filters?.filters?.subscriber.join(",") : undefined,
    state_group: filters?.filters?.state_group
      ? filters?.filters?.state_group.join(",")
      : undefined,
    priority: filters?.filters?.priority ? filters?.filters?.priority.join(",") : undefined,
    labels: filters?.filters?.labels ? filters?.filters?.labels.join(",") : undefined,
    created_by: filters?.filters?.created_by ? filters?.filters?.created_by.join(",") : undefined,
    start_date: filters?.filters?.start_date ? filters?.filters?.start_date.join(",") : undefined,
    target_date: filters?.filters?.target_date
      ? filters?.filters?.target_date.join(",")
      : undefined,
    project: filters?.filters?.project ? filters?.filters?.project.join(",") : undefined,
    sub_issue: false,
    type: undefined,
  };

  const { data: viewIssues, mutate: mutateViewIssues } = useSWR(
    workspaceSlug ? WORKSPACE_VIEW_ISSUES(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => workspaceService.getViewIssues(workspaceSlug.toString(), params) : null
  );

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
    filters.filters &&
    Object.keys(filters.filters).length > 0 &&
    nullFilters.length !== Object.keys(filters.filters).length;

  const { projects: allProjects } = useProjects();
  const joinedProjects = allProjects?.filter((p) => p.is_member);

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
        onSubmit={async () => {
          mutateViewIssues();
        }}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
        onSubmit={async () => {
          mutateViewIssues();
        }}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueToDelete}
        user={user}
        onSubmit={async () => {
          mutateViewIssues();
        }}
      />
      <CreateUpdateWorkspaceViewModal
        isOpen={createViewModal !== null}
        handleClose={() => setCreateViewModal(null)}
        preLoadedData={createViewModal}
      />
      <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
        <div className="h-full w-full border-b border-custom-border-300">
          <WorkspaceViewsNavigation handleAddView={() => setCreateViewModal(true)} />
          <div className="h-full w-full flex flex-col">
            {areFiltersApplied && (
              <>
                <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-0">
                  <WorkspaceFiltersList
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
                      if (viewId) handleFilters("filters", filters.filters, true);
                      else
                        setCreateViewModal({
                          query: filters.filters,
                        });
                    }}
                    className="flex items-center gap-2 text-sm"
                  >
                    {!viewId && <PlusIcon className="h-4 w-4" />}
                    {viewId ? "Update" : "Save"} view
                  </PrimaryButton>
                </div>
                {<div className="mt-3 border-t border-custom-border-200" />}
              </>
            )}
            <SpreadsheetView
              spreadsheetIssues={viewIssues}
              mutateIssues={mutateViewIssues}
              handleIssueAction={handleIssueAction}
              disableUserActions={false}
              user={user}
              userAuth={memberRole}
            />
          </div>
        </div>
      </div>
    </>
  );
};
