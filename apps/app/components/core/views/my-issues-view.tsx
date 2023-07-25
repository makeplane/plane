import { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-beautiful-dnd
import { DropResult } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
// hooks
import useMyIssues from "hooks/my-issues/use-my-issues";
import useMyIssuesFilters from "hooks/my-issues/use-my-issues-filter";
import useUserAuth from "hooks/use-user-auth";
import useWorkspaceMembers from "hooks/use-workspace-members";
// components
import { FilterList, AllViews } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { CreateUpdateViewModal } from "components/views";
// types
import { IIssue, IIssueFilterOptions } from "types";
// fetch-keys
import { WORKSPACE_LABELS } from "constants/fetch-keys";

type Props = {
  openIssuesListModal?: () => void;
  disableUserActions?: false;
};

export const MyIssuesView: React.FC<Props> = ({
  openIssuesListModal,
  disableUserActions = false,
}) => {
  // create issue modal
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [createViewModal, setCreateViewModal] = useState<any>(null);
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
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const { workspaceMembers: members } = useWorkspaceMembers(workspaceSlug?.toString());

  const { data: labels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  const { groupedIssues, isEmpty, params } = useMyIssues(workspaceSlug?.toString());
  const { filters, setFilters, issueView, groupBy, orderBy, properties, showEmptyGroups } =
    useMyIssuesFilters(workspaceSlug?.toString());

  const handleDeleteIssue = useCallback(
    (issue: IIssue) => {
      setDeleteIssueModal(true);
      setIssueToDelete(issue);
    },
    [setDeleteIssueModal, setIssueToDelete]
  );

  const handleOnDragEnd = useCallback(async (result: DropResult) => {
    setTrashBox(false);
  }, []);

  const addIssueToGroup = useCallback(
    (groupTitle: string) => {
      setCreateIssueModal(true);

      let preloadedValue: string | string[] = groupTitle;

      if (groupBy === "labels") {
        if (groupTitle === "None") preloadedValue = [];
        else preloadedValue = [groupTitle];
      }

      if (groupBy)
        setPreloadedData({
          [groupBy]: preloadedValue,
          actionType: "createIssue",
        });
      else setPreloadedData({ actionType: "createIssue" });
    },
    [setCreateIssueModal, setPreloadedData, groupBy]
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
    (issue: IIssue, action: "copy" | "edit" | "delete") => {
      if (action === "copy") makeIssueCopy(issue);
      else if (action === "edit") handleEditIssue(issue);
      else if (action === "delete") handleDeleteIssue(issue);
    },
    [makeIssueCopy, handleEditIssue, handleDeleteIssue]
  );

  const nullFilters = Object.keys(filters).filter(
    (key) => filters[key as keyof IIssueFilterOptions] === null
  );

  const areFiltersApplied =
    Object.keys(filters).length > 0 && nullFilters.length !== Object.keys(filters).length;

  return (
    <>
      <CreateUpdateViewModal
        isOpen={createViewModal !== null}
        handleClose={() => setCreateViewModal(null)}
        preLoadedData={createViewModal}
        user={user}
      />
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
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
            <FilterList
              filters={filters}
              setFilters={setFilters}
              labels={labels}
              members={members?.map((m) => m.member)}
              states={undefined}
              clearAllFilters={() =>
                setFilters({
                  assignees: null,
                  created_by: null,
                  labels: null,
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
        disableUserActions={disableUserActions}
        handleOnDragEnd={handleOnDragEnd}
        handleIssueAction={handleIssueAction}
        openIssuesListModal={openIssuesListModal ? openIssuesListModal : null}
        removeIssue={null}
        trashBox={trashBox}
        setTrashBox={setTrashBox}
        viewProps={{
          groupByProperty: groupBy,
          groupedIssues,
          isEmpty,
          issueView,
          orderBy,
          params,
          properties,
          showEmptyGroups,
        }}
      />
    </>
  );
};
