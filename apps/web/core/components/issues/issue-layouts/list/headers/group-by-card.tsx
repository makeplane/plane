"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { CircleDashed, Plus } from "lucide-react";
// types
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { TIssue, ISearchIssueResponse, TIssueGroupByOptions } from "@plane/types";
// ui
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { ExistingIssuesListModal, MultipleSelectGroupAction } from "@/components/core";
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
import { captureClick } from "@/helpers/event-tracker.helper";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
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

export const HeaderGroupByCard = observer((props: IHeaderGroupByCard) => {
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
  const pathname = usePathname();
  const storeType = useIssueStoreType();
  // derived values
  const isDraftIssue = pathname.includes("draft-issue");
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
          <div className="inline-block line-clamp-1 truncate font-medium text-custom-text-100">{title}</div>
          <div className="pl-2 text-sm font-medium text-custom-text-300">{count || 0}</div>
          <WorkFlowGroupTree groupBy={groupBy} groupId={groupID} />
        </div>

        {!disableIssueCreation &&
          (renderExistingIssueModal ? (
            <CustomMenu
              customButton={
                <span className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              }
            >
              <CustomMenu.MenuItem
                onClick={() => {
                  captureClick({ elementName: WORK_ITEM_TRACKER_EVENTS.create });
                  setIsOpen(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Create work item</span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  captureClick({ elementName: WORK_ITEM_TRACKER_EVENTS.add_existing });
                  setOpenExistingIssueListModal(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Add an existing work item</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          ) : (
            <div
              className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
              onClick={() => {
                captureClick({ elementName: WORK_ITEM_TRACKER_EVENTS.create });
                setIsOpen(true);
              }}
            >
              <Plus width={14} strokeWidth={2} />
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
            isDraft={isDraftIssue}
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
