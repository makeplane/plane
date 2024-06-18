"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { CircleDashed, Plus } from "lucide-react";
// types
import { TIssue, ISearchIssueResponse } from "@plane/types";
// ui
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ExistingIssuesListModal, MultipleSelectGroupAction } from "@/components/core";
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";

interface IHeaderGroupByCard {
  groupID: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  toggleListGroup: () => void;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  selectionHelpers: TSelectionHelper;
}

export const HeaderGroupByCard = observer((props: IHeaderGroupByCard) => {
  const {
    groupID,
    icon,
    title,
    count,
    issuePayload,
    canEditProperties,
    disableIssueCreation,
    addIssuesToView,
    selectionHelpers,
    toggleListGroup,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = useState(false);
  // router
  const { workspaceSlug, projectId, moduleId, cycleId } = useParams();
  const pathname = usePathname();
  // hooks
  const { setTrackElement } = useEventTracker();
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
        message: "Issues added to the cycle successfully.",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Selected issues could not be added to the cycle. Please try again.",
      });
    }
  };

  return (
    <>
      <div className="group/list-header relative w-full flex-shrink-0 flex items-center gap-2 py-1.5">
        {canSelectIssues && (
          <div className="flex-shrink-0 flex items-center w-3.5">
            <MultipleSelectGroupAction
              className={cn(
                "size-3.5 opacity-0 pointer-events-none group-hover/list-header:opacity-100 group-hover/list-header:pointer-events-auto !outline-none",
                {
                  "opacity-100 pointer-events-auto": !isGroupSelectionEmpty,
                }
              )}
              groupID={groupID}
              selectionHelpers={selectionHelpers}
            />
          </div>
        )}
        <div className="flex-shrink-0 grid place-items-center overflow-hidden">
          {icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
        </div>

        <div className="relative flex w-full flex-row items-center gap-1 overflow-hidden cursor-pointer"
        onClick={toggleListGroup}>
          <div className="inline-block line-clamp-1 truncate font-medium text-custom-text-100">{title}</div>
          <div className="pl-2 text-sm font-medium text-custom-text-300">{count || 0}</div>
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
                  setTrackElement("List layout");
                  setIsOpen(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Create issue</span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  setTrackElement("List layout");
                  setOpenExistingIssueListModal(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Add an existing issue</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          ) : (
            <div
              className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
              onClick={() => {
                setTrackElement("List layout");
                setIsOpen(true);
              }}
            >
              <Plus width={14} strokeWidth={2} />
            </div>
          ))}

        <CreateUpdateIssueModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data={issuePayload}
          storeType={storeType}
          isDraft={isDraftIssue}
        />

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
