import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { IssueLabelService } from "services/issue";
// hooks
import useMyIssues from "hooks/my-issues/use-my-issues";
import useMyIssuesFilters from "hooks/my-issues/use-my-issues-filter";
import useUserAuth from "hooks/use-user-auth";
// components
import { FiltersList } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// types
import { IIssue, IIssueFilterOptions } from "types";
// fetch-keys
import { WORKSPACE_LABELS } from "constants/fetch-keys";

type Props = {
  openIssuesListModal?: () => void;
  disableUserActions?: false;
};

const issueLabelService = new IssueLabelService();

export const MyIssuesView: React.FC<Props> = () => {
  // create issue modal
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [preloadedData] = useState<(Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined>(
    undefined
  );

  // update issue modal
  const [editIssueModal, setEditIssueModal] = useState(false);
  const [issueToEdit] = useState<(IIssue & { actionType: "edit" | "delete" }) | undefined>(undefined);

  // delete issue modal
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [issueToDelete] = useState<IIssue | null>(null);

  // trash box
  // const [trashBox, setTrashBox] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const { mutateMyIssues } = useMyIssues(workspaceSlug?.toString());
  const { filters, setFilters } = useMyIssuesFilters(workspaceSlug?.toString());

  const { data: labels } = useSWR(
    workspaceSlug && (filters?.labels ?? []).length > 0 ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug && (filters?.labels ?? []).length > 0
      ? () => issueLabelService.getWorkspaceIssueLabels(workspaceSlug.toString())
      : null
  );

  // const handleDeleteIssue = useCallback(
  //   (issue: IIssue) => {
  //     setDeleteIssueModal(true);
  //     setIssueToDelete(issue);
  //   },
  //   [setDeleteIssueModal, setIssueToDelete]
  // );

  // const handleOnDragEnd = useCallback(
  //   async (result: DropResult) => {
  //     setTrashBox(false);

  //     if (!result.destination || !workspaceSlug || !groupedIssues || displayFilters?.group_by !== "priority") return;

  //     const { source, destination } = result;

  //     if (source.droppableId === destination.droppableId) return;

  //     const draggedItem = groupedIssues[source.droppableId][source.index];

  //     if (!draggedItem) return;

  //     if (destination.droppableId === "trashBox") handleDeleteIssue(draggedItem);
  //     else {
  //       const sourceGroup = source.droppableId;
  //       const destinationGroup = destination.droppableId;

  //       draggedItem[displayFilters.group_by] = destinationGroup as TIssuePriorities;

  //       mutate<{
  //         [key: string]: IIssue[];
  //       }>(
  //         USER_ISSUES(workspaceSlug.toString(), params),
  //         (prevData) => {
  //           if (!prevData) return prevData;

  //           const sourceGroupArray = [...groupedIssues[sourceGroup]];
  //           const destinationGroupArray = [...groupedIssues[destinationGroup]];

  //           sourceGroupArray.splice(source.index, 1);
  //           destinationGroupArray.splice(destination.index, 0, draggedItem);

  //           return {
  //             ...prevData,
  //             [sourceGroup]: orderArrayBy(sourceGroupArray, displayFilters.order_by ?? "-created_at"),
  //             [destinationGroup]: orderArrayBy(destinationGroupArray, displayFilters.order_by ?? "-created_at"),
  //           };
  //         },
  //         false
  //       );

  //       // patch request
  //       issuesService
  //         .patchIssue(
  //           workspaceSlug as string,
  //           draggedItem.project,
  //           draggedItem.id,
  //           {
  //             priority: draggedItem.priority,
  //           },
  //           user
  //         )
  //         .catch(() => mutate(USER_ISSUES(workspaceSlug.toString(), params)));
  //     }
  //   },
  //   [displayFilters, groupedIssues, handleDeleteIssue, params, user, workspaceSlug]
  // );

  // const addIssueToGroup = useCallback(
  //   (groupTitle: string) => {
  //     setCreateIssueModal(true);

  //     let preloadedValue: string | string[] = groupTitle;

  //     if (displayFilters?.group_by === "labels") {
  //       if (groupTitle === "None") preloadedValue = [];
  //       else preloadedValue = [groupTitle];
  //     }

  //     if (displayFilters?.group_by)
  //       setPreloadedData({
  //         [displayFilters?.group_by]: preloadedValue,
  //         actionType: "createIssue",
  //       });
  //     else setPreloadedData({ actionType: "createIssue" });
  //   },
  //   [setCreateIssueModal, setPreloadedData, displayFilters?.group_by]
  // );

  // const addIssueToDate = useCallback(
  //   (date: string) => {
  //     setCreateIssueModal(true);
  //     setPreloadedData({
  //       target_date: date,
  //       actionType: "createIssue",
  //     });
  //   },
  //   [setCreateIssueModal, setPreloadedData]
  // );

  // const makeIssueCopy = useCallback(
  //   (issue: IIssue) => {
  //     setCreateIssueModal(true);

  //     setPreloadedData({ ...issue, name: `${issue.name} (Copy)`, actionType: "createIssue" });
  //   },
  //   [setCreateIssueModal, setPreloadedData]
  // );

  // const handleEditIssue = useCallback(
  //   (issue: IIssue) => {
  //     setEditIssueModal(true);
  //     setIssueToEdit({
  //       ...issue,
  //       actionType: "edit",
  //       cycle: issue.issue_cycle ? issue.issue_cycle.cycle : null,
  //       module: issue.issue_module ? issue.issue_module.module : null,
  //     });
  //   },
  //   [setEditIssueModal, setIssueToEdit]
  // );

  // const handleIssueAction = useCallback(
  //   (issue: IIssue, action: "copy" | "edit" | "delete" | "updateDraft") => {
  //     if (action === "copy") makeIssueCopy(issue);
  //     else if (action === "edit") handleEditIssue(issue);
  //     else if (action === "delete") handleDeleteIssue(issue);
  //   },
  //   [makeIssueCopy, handleEditIssue, handleDeleteIssue]
  // );

  const filtersToDisplay = { ...filters, assignees: null, created_by: null, subscriber: null };

  const nullFilters = Object.keys(filtersToDisplay).filter(
    (key) => filtersToDisplay[key as keyof IIssueFilterOptions] === null
  );
  const areFiltersApplied =
    Object.keys(filtersToDisplay).length > 0 && nullFilters.length !== Object.keys(filtersToDisplay).length;

  // const isSubscribedIssuesRoute = router.pathname.includes("subscribed");
  // const isMySubscribedIssues =
  //   (filters.subscriber && filters.subscriber.length > 0 && router.pathname.includes("my-issues")) ?? false;

  // const disableAddIssueOption = isSubscribedIssuesRoute || isMySubscribedIssues;

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
        onSubmit={async () => {
          mutateMyIssues();
        }}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
        onSubmit={async () => {
          mutateMyIssues();
        }}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueToDelete}
        user={user}
        onSubmit={async () => {
          mutateMyIssues();
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
        disableUserActions={disableUserActions}
        dragDisabled={displayFilters?.group_by !== "priority"}
        emptyState={{
          title: filters.assignees
            ? "You don't have any issue assigned to you yet"
            : filters.created_by
            ? "You have not created any issue yet."
            : "You have not subscribed to any issue yet.",
          description: "Keep track of your work in a single place.",
          primaryButton: filters.subscriber
            ? undefined
            : {
                icon: <PlusIcon className="h-4 w-4" />,
                text: "New Issue",
                onClick: () => {
                  const e = new KeyboardEvent("keydown", {
                    key: "c",
                  });
                  document.dispatchEvent(e);
                },
              },
        }}
        handleOnDragEnd={handleOnDragEnd}
        handleIssueAction={handleIssueAction}
        openIssuesListModal={openIssuesListModal ? openIssuesListModal : null}
        removeIssue={null}
        disableAddIssueOption={disableAddIssueOption}
        trashBox={trashBox}
        setTrashBox={setTrashBox}
        viewProps={{
          displayFilters,
          groupedIssues,
          isEmpty,
          mutateIssues: mutateMyIssues,
          params,
          properties,
        }}
      /> */}
    </>
  );
};
