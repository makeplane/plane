import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CircleDashed } from "lucide-react";
import { PlusIcon } from "@plane/propel/icons";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue, ISearchIssueResponse, TIssueGroupByOptions } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { MultipleSelectGroupAction } from "@/components/core/multiple-select";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
// constants
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// plane-web
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
// Plane-web
import { WorkFlowGroupTree } from "@/plane-web/components/workflow";

interface IHeaderGroupByCard {
  groupID: string;
  groupBy: TIssueGroupByOptions;
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  selectionHelpers: TSelectionHelper;
  handleCollapsedGroups: (value: string) => void;
  isEpic?: boolean;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const {
    groupID,
    groupBy,
    icon,
    title,
    count,
    issuePayload,
    canEditProperties,
    disableIssueCreation,
    addIssuesToView,
    selectionHelpers,
    handleCollapsedGroups,
    isEpic = false,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = useState(false);
  // router
  const { workspaceSlug, projectId, moduleId, cycleId } = useParams();
  const storeType = useIssueStoreType();
  // derived values
  const renderExistingIssueModal = moduleId || cycleId;
  const existingIssuesListModalPayload = moduleId ? { module: moduleId.toString() } : { cycle: true };
  const isGroupSelectionEmpty = selectionHelpers.isGroupSelected(groupID) === "empty";
  // auth
  const canSelectIssues = canEditProperties(projectId?.toString()) && !selectionHelpers.isSelectionDisabled;

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issues = data.map((i) => i.id);

    try {
      await addIssuesToView?.(issues);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Work items added to the cycle successfully.",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Selected work items could not be added to the cycle. Please try again.",
      });
    }
  };

  return (
    <>
      <div className="group/list-header w-full flex-shrink-0 flex items-center gap-2 py-1.5">
        {canSelectIssues && (
          <div className="flex-shrink-0 flex items-center w-3.5 absolute left-1">
            <MultipleSelectGroupAction
              className={cn(
                "size-3.5 opacity-0 pointer-events-none group-hover/list-header:opacity-100 group-hover/list-header:pointer-events-auto !outline-none ",
                {
                  "opacity-100 pointer-events-auto": !isGroupSelectionEmpty,
                }
              )}
              groupID={groupID}
              selectionHelpers={selectionHelpers}
              disabled={count === 0}
            />
          </div>
        )}
        <div className="flex-shrink-0 grid place-items-center overflow-hidden">
          {icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
        </div>

        <div
          className="relative flex w-full flex-row items-center gap-1 overflow-hidden cursor-pointer"
          onClick={() => handleCollapsedGroups(groupID)}
        >
          <div className="inline-block line-clamp-1 truncate font-medium text-primary">{title}</div>
          <div className="pl-2 text-13 font-medium text-tertiary">{count || 0}</div>
          <div className="px-2.5">
            <WorkFlowGroupTree groupBy={groupBy} groupId={groupID} />
          </div>
        </div>

        {!disableIssueCreation &&
          (renderExistingIssueModal ? (
            <CustomMenu
              customButton={
                <span className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xs transition-all hover:bg-layer-1">
                  <PlusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              }
            >
              <CustomMenu.MenuItem
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Create work item</span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  setOpenExistingIssueListModal(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Add an existing work item</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          ) : (
            <div
              className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xs transition-all hover:bg-layer-1"
              onClick={() => {
                setIsOpen(true);
              }}
            >
              <PlusIcon width={14} strokeWidth={2} />
            </div>
          ))}

        {isEpic ? (
          <CreateUpdateEpicModal isOpen={isOpen} onClose={() => setIsOpen(false)} data={issuePayload} />
        ) : (
          <CreateUpdateIssueModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            data={issuePayload}
            storeType={storeType}
          />
        )}

        {renderExistingIssueModal && (
          <ExistingIssuesListModal
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            isOpen={openExistingIssueListModal}
            handleClose={() => setOpenExistingIssueListModal(false)}
            searchParams={existingIssuesListModalPayload}
            handleOnSubmit={handleAddIssuesToView}
          />
        )}
      </div>
    </>
  );
});
