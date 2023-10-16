import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { DropResult } from "react-beautiful-dnd";
// services
import { IssueService, IssueLabelService } from "services/issue";
import { UserService } from "services/user.service";
// hooks
import useProfileIssues from "hooks/use-profile-issues";
import useUser from "hooks/use-user";
// components
import { FiltersList } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue, IIssueFilterOptions, TIssuePriorities } from "types";
// fetch-keys
import { USER_PROFILE_PROJECT_SEGREGATION, WORKSPACE_LABELS } from "constants/fetch-keys";

// services
const issueService = new IssueService();
const issueLabelService = new IssueLabelService();
const userService = new UserService();

export const ProfileIssuesView = () => {
  // create issue modal
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  // update issue modal
  const [editIssueModal, setEditIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<(IIssue & { actionType: "edit" | "delete" }) | undefined>(undefined);

  // delete issue modal
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null);

  // trash box
  const [trashBox, setTrashBox] = useState(false);

  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const { user } = useUser();

  const {
    groupedIssues,
    mutateProfileIssues,
    displayFilters,
    isEmpty,
    filters,
    setFilters,
    displayProperties,
    params,
  } = useProfileIssues(workspaceSlug?.toString(), userId?.toString());

  const { data: profileData } = useSWR(
    workspaceSlug && userId ? USER_PROFILE_PROJECT_SEGREGATION(workspaceSlug.toString(), userId.toString()) : null,
    workspaceSlug && userId
      ? () => userService.getUserProfileProjectsSegregation(workspaceSlug.toString(), userId.toString())
      : null
  );

  const { data: labels } = useSWR(
    workspaceSlug && (filters?.labels ?? []).length > 0 ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug && (filters?.labels ?? []).length > 0
      ? () => issueLabelService.getWorkspaceIssueLabels(workspaceSlug.toString())
      : null
  );

  const handleDeleteIssue = useCallback(
    (issue: IIssue) => {
      setDeleteIssueModal(true);
      setIssueToDelete(issue);
    },
    [setDeleteIssueModal, setIssueToDelete]
  );

  const handleOnDragEnd = useCallback(
    async (result: DropResult) => {
      setTrashBox(false);

      if (!result.destination || !workspaceSlug || !groupedIssues || displayFilters?.group_by !== "priority") return;

      const { source, destination } = result;

      if (source.droppableId === destination.droppableId) return;

      const draggedItem = groupedIssues[source.droppableId][source.index];

      if (!draggedItem) return;

      if (destination.droppableId === "trashBox") handleDeleteIssue(draggedItem);
      else {
        const sourceGroup = source.droppableId;
        const destinationGroup = destination.droppableId;

        draggedItem[displayFilters.group_by] = destinationGroup as TIssuePriorities;

        mutateProfileIssues((prevData: any) => {
          if (!prevData) return prevData;

          const sourceGroupArray = [...groupedIssues[sourceGroup]];
          const destinationGroupArray = [...groupedIssues[destinationGroup]];

          sourceGroupArray.splice(source.index, 1);
          destinationGroupArray.splice(destination.index, 0, draggedItem);

          return {
            ...prevData,
            [sourceGroup]: orderArrayBy(sourceGroupArray, displayFilters.order_by ?? "-created_at"),
            [destinationGroup]: orderArrayBy(destinationGroupArray, displayFilters.order_by ?? "-created_at"),
          };
        }, false);

        // patch request
        issueService
          .patchIssue(
            workspaceSlug as string,
            draggedItem.project,
            draggedItem.id,
            {
              priority: draggedItem.priority,
            },
            user
          )
          .catch(() => mutateProfileIssues());
      }
    },
    [displayFilters, groupedIssues, handleDeleteIssue, mutateProfileIssues, user, workspaceSlug]
  );

  const addIssueToGroup = useCallback(
    (groupTitle: string) => {
      setCreateIssueModal(true);

      let preloadedValue: string | string[] = groupTitle;

      if (displayFilters?.group_by === "labels") {
        if (groupTitle === "None") preloadedValue = [];
        else preloadedValue = [groupTitle];
      }

      if (displayFilters?.group_by)
        setPreloadedData({
          [displayFilters?.group_by]: preloadedValue,
          actionType: "createIssue",
        });
      else setPreloadedData({ actionType: "createIssue" });
    },
    [setCreateIssueModal, setPreloadedData, displayFilters?.group_by]
  );

  const addIssueToDate = useCallback(
    (date: string) => {
      setCreateIssueModal(true);
      setPreloadedData({
        target_date: date,
        actionType: "createIssue",
      });
    },
    [setCreateIssueModal, setPreloadedData]
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

  const handleIssueAction = useCallback(
    (issue: IIssue, action: "copy" | "edit" | "delete" | "updateDraft") => {
      if (action === "copy") makeIssueCopy(issue);
      else if (action === "edit") handleEditIssue(issue);
      else if (action === "delete") handleDeleteIssue(issue);
    },
    [makeIssueCopy, handleEditIssue, handleDeleteIssue]
  );

  const filtersToDisplay = { ...filters, assignees: null, created_by: null, subscriber: null };

  const nullFilters = Object.keys(filtersToDisplay).filter(
    (key) => filtersToDisplay[key as keyof IIssueFilterOptions] === null
  );
  const areFiltersApplied =
    Object.keys(filtersToDisplay).length > 0 && nullFilters.length !== Object.keys(filtersToDisplay).length;

  const isSubscribedIssuesRoute = router.pathname.includes("subscribed");
  const isMySubscribedIssues =
    (filters.subscriber && filters.subscriber.length > 0 && router.pathname.includes("my-issues")) ?? false;

  const disableAddIssueOption = isSubscribedIssuesRoute || isMySubscribedIssues || user?.id !== userId;

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
        onSubmit={async () => {
          mutateProfileIssues();
        }}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
        onSubmit={async () => {
          mutateProfileIssues();
        }}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueToDelete}
        user={user}
        onSubmit={async () => {
          mutateProfileIssues();
        }}
      />
      {areFiltersApplied && (
        <>
          <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-0">
            <FiltersList
              filters={filtersToDisplay}
              setFilters={setFilters}
              labels={labels}
              members={undefined}
              states={undefined}
              clearAllFilters={() =>
                setFilters({
                  labels: null,
                  priority: null,
                  state_group: null,
                  start_date: null,
                  target_date: null,
                })
              }
            />
          </div>
          {<div className="mt-3 border-t border-custom-border-200" />}
        </>
      )}
      {/* <AllViews
        addIssueToDate={addIssueToDate}
        addIssueToGroup={addIssueToGroup}
        disableUserActions={false}
        dragDisabled={displayFilters?.group_by !== "priority"}
        emptyState={{
          title: router.pathname.includes("assigned")
            ? `Issues assigned to ${profileData?.user_data.display_name} will appear here`
            : router.pathname.includes("created")
            ? `Issues created by ${profileData?.user_data.display_name} will appear here`
            : `Issues subscribed by ${profileData?.user_data.display_name} will appear here`,
        }}
        handleOnDragEnd={handleOnDragEnd}
        handleIssueAction={handleIssueAction}
        openIssuesListModal={null}
        removeIssue={null}
        disableAddIssueOption={disableAddIssueOption}
        trashBox={trashBox}
        setTrashBox={setTrashBox}
        viewProps={{
          groupedIssues,
          displayFilters,
          isEmpty,
          mutateIssues: mutateProfileIssues,
          params,
          properties: displayProperties,
        }}
      /> */}
    </>
  );
};
