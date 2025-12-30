import { useState } from "react";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";

import { useTranslation } from "@plane/i18n";
// plane imports
import { PlusIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { QuickAddIssueRoot } from "../quick-add";

type TCalendarQuickAddIssueActions = {
  prePopulatedData?: Partial<TIssue>;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  onOpen?: () => void;
  isEpic?: boolean;
};

export const CalendarQuickAddIssueActions = observer(function CalendarQuickAddIssueActions(
  props: TCalendarQuickAddIssueActions
) {
  const { prePopulatedData, quickAddCallback, addIssuesToView, onOpen, isEpic = false } = props;
  const { t } = useTranslation();
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
      loading: t("issue.adding", { count: issueIds.length }),
      success: {
        title: t("toast.success"),
        message: () => t("entity.add.success", { entity: t("issue.label", { count: 2 }) }),
      },
      error: {
        title: t("toast.error"),
        message: (err) => err?.message || t("common.errors.default.message"),
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
              "md:opacity-0 rounded-sm  bg-layer-transparent hover:bg-layer-transparent-hover md:group-hover:opacity-100 overflow-hidden",
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
                <div className="flex w-full items-center gap-x-[6px] rounded-md px-2 py-1.5 text-tertiary hover:text-tertiary">
                  <PlusIcon className="h-3.5 w-3.5 stroke-2 flex-shrink-0" />
                  <span className="text-13 font-medium flex-shrink-0">
                    {isEpic ? t("epic.add.label") : t("issue.add.label")}
                  </span>
                </div>
              }
            >
              <CustomMenu.MenuItem onClick={handleNewIssue}>
                {isEpic ? t("epic.add.label") : t("issue.add.label")}
              </CustomMenu.MenuItem>
              {!isEpic && (
                <CustomMenu.MenuItem onClick={handleExistingIssue}>{t("issue.add.existing")}</CustomMenu.MenuItem>
              )}
            </CustomMenu>
          </div>
        }
        isEpic={isEpic}
      />
    </>
  );
});
