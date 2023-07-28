import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-beautiful-dnd
import { DropResult } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
// hooks
import useProfileIssues from "hooks/use-profile-issues";
import useUser from "hooks/use-user";
// components
import { AllViews, FiltersList } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue, IIssueFilterOptions } from "types";
// fetch-keys
import { WORKSPACE_LABELS } from "constants/fetch-keys";

export const ProfileIssuesView = () => {
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

  // trash box
  const [trashBox, setTrashBox] = useState(false);

  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const { user } = useUser();

  const {
    groupedIssues,
    mutateProfileIssues,
    issueView,
    groupByProperty,
    orderBy,
    isEmpty,
    showEmptyGroups,
    filters,
    setFilters,
    properties,
    params,
  } = useProfileIssues(workspaceSlug?.toString(), userId?.toString());

  const { data: labels } = useSWR(
    workspaceSlug && (filters?.labels ?? []).length > 0
      ? WORKSPACE_LABELS(workspaceSlug.toString())
      : null,
    workspaceSlug && (filters?.labels ?? []).length > 0
      ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString())
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

      if (!result.destination || !workspaceSlug || !groupedIssues || groupByProperty !== "priority")
        return;

      const { source, destination } = result;

      if (source.droppableId === destination.droppableId) return;

      const draggedItem = groupedIssues[source.droppableId][source.index];

      if (!draggedItem) return;

      if (destination.droppableId === "trashBox") handleDeleteIssue(draggedItem);
      else {
        const sourceGroup = source.droppableId;
        const destinationGroup = destination.droppableId;

        draggedItem[groupByProperty] = destinationGroup;

        mutateProfileIssues((prevData) => {
          if (!prevData) return prevData;

          const sourceGroupArray = [...groupedIssues[sourceGroup]];
          const destinationGroupArray = [...groupedIssues[destinationGroup]];

          sourceGroupArray.splice(source.index, 1);
          destinationGroupArray.splice(destination.index, 0, draggedItem);

          return {
            ...prevData,
            [sourceGroup]: orderArrayBy(sourceGroupArray, orderBy),
            [destinationGroup]: orderArrayBy(destinationGroupArray, orderBy),
          };
        }, false);

        // patch request
        issuesService
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
    [
      groupByProperty,
      groupedIssues,
      handleDeleteIssue,
      mutateProfileIssues,
      orderBy,
      user,
      workspaceSlug,
    ]
  );

  const addIssueToGroup = useCallback((groupTitle: string) => {
    setCreateIssueModal(true);
    return;
  }, []);

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
    (issue: IIssue, action: "copy" | "edit" | "delete") => {
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
    Object.keys(filtersToDisplay).length > 0 &&
    nullFilters.length !== Object.keys(filtersToDisplay).length;

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
                  target_date: null,
                  type: null,
                })
              }
            />
          </div>
          {<div className="mt-3 border-t border-custom-border-200" />}
        </>
      )}
      <AllViews
        addIssueToDate={addIssueToDate}
        addIssueToGroup={addIssueToGroup}
        disableUserActions={false}
        dragDisabled={groupByProperty !== "priority"}
        handleOnDragEnd={handleOnDragEnd}
        handleIssueAction={handleIssueAction}
        openIssuesListModal={null}
        removeIssue={null}
        trashBox={trashBox}
        setTrashBox={setTrashBox}
        viewProps={{
          groupByProperty,
          groupedIssues,
          isEmpty,
          issueView,
          mutateIssues: mutateProfileIssues,
          orderBy,
          params,
          properties,
          showEmptyGroups,
        }}
      />
    </>
  );
};
