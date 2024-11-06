"use client";

import { FC, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PlusIcon } from "lucide-react";
// types
import { ISearchIssueResponse, TIssue } from "@plane/types";
// ui
import { CustomMenu, setPromiseToast } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { QuickAddIssueRoot } from "@/components/issues";
// helpers
import { EIssueLayoutTypes } from "@/constants/issue";
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";

type TCalendarQuickAddIssueActions = {
  prePopulatedData?: Partial<TIssue>;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  onOpen?: () => void;
};

export const CalendarQuickAddIssueActions: FC<TCalendarQuickAddIssueActions> = observer((props) => {
  const { prePopulatedData, quickAddCallback, addIssuesToView, onOpen } = props;
  // router
  const { workspaceSlug, projectId, moduleId } = useParams();
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExistingIssueModalOpen, setIsExistingIssueModalOpen] = useState(false);
  const { updateIssue } = useIssueDetail();
  // derived values
  const ExistingIssuesListModalPayload = addIssuesToView
    ? moduleId
      ? { module: moduleId.toString(), target_date: "none" }
      : { cycle: true, target_date: "none" }
    : { target_date: "none" };

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issueIds = data.map((i) => i.id);
    const addExistingIssuesPromise = Promise.all(
      data.map((issue) => updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, prePopulatedData ?? {}))
    ).then(() => addIssuesToView?.(issueIds));

    setPromiseToast(addExistingIssuesPromise, {
      loading: `Adding ${issueIds.length > 1 ? "issues" : "issue"} to cycle...`,
      success: {
        title: "Success!",
        message: () => `${issueIds.length > 1 ? "Issues" : "Issue"} added to cycle successfully.`,
      },
      error: {
        title: "Error!",
        message: (err) => err?.message || "Something went wrong. Please try again.",
      },
    });
  };

  const handleNewIssue = () => {
    setIsOpen(true);
    if (onOpen) onOpen();
  };
  const handleExistingIssue = () => {
    setIsExistingIssueModalOpen(true);
  };

  if (!projectId) return null;

  return (
    <>
      {workspaceSlug && projectId && (
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isOpen={isExistingIssueModalOpen}
          handleClose={() => setIsExistingIssueModalOpen(false)}
          searchParams={ExistingIssuesListModalPayload}
          handleOnSubmit={handleAddIssuesToView}
          shouldHideIssue={(issue) => {
            if (issue.start_date && prePopulatedData?.target_date) {
              const issueStartDate = new Date(issue.start_date);
              const targetDate = new Date(prePopulatedData.target_date);
              const diffInDays = differenceInCalendarDays(targetDate, issueStartDate);
              if (diffInDays < 0) return true;
            }
            return false;
          }}
        />
      )}
      <QuickAddIssueRoot
        isQuickAddOpen={isOpen}
        setIsQuickAddOpen={(isOpen) => setIsOpen(isOpen)}
        layout={EIssueLayoutTypes.CALENDAR}
        prePopulatedData={prePopulatedData}
        quickAddCallback={quickAddCallback}
        customQuickAddButton={
          <div
            className={cn(
              "md:opacity-0 rounded md:border-[0.5px] border-custom-border-200 md:group-hover:opacity-100",
              {
                block: isMenuOpen,
              }
            )}
          >
            <CustomMenu
              placement="bottom-start"
              menuButtonOnClick={() => setIsMenuOpen(true)}
              onMenuClose={() => setIsMenuOpen(false)}
              className="w-full"
              customButtonClassName="w-full"
              customButton={
                <div className="flex w-full items-center gap-x-[6px] rounded-md px-2 py-1.5 text-custom-text-350 hover:text-custom-text-300">
                  <PlusIcon className="h-3.5 w-3.5 stroke-2 flex-shrink-0" />
                  <span className="text-sm font-medium flex-shrink-0">New issue</span>
                </div>
              }
            >
              <CustomMenu.MenuItem onClick={handleNewIssue}>New issue</CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={handleExistingIssue}>Add existing issue</CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        }
      />
    </>
  );
});