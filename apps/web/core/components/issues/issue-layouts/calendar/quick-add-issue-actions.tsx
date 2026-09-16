"use client";

import type { FC } from "react";
import { useState } from "react";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PlusIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { QuickAddIssueRoot } from "../quick-add";
import { openCalendarCreateModal } from "./calendar-create-modal";

type TCalendarQuickAddIssueActions = {
  prePopulatedData?: Partial<TIssue>;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<unknown>;
  onOpen?: () => void;
  isEpic?: boolean;
};

export const CalendarQuickAddIssueActions: FC<TCalendarQuickAddIssueActions> = observer((props) => {
  const { prePopulatedData, quickAddCallback, addIssuesToView, onOpen, isEpic = false } = props;
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId, moduleId } = useParams();
  // states
  const [createModalData, setCreateModalData] = useState<Partial<TIssue> | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExistingIssueModalOpen, setIsExistingIssueModalOpen] = useState(false);
  const { updateIssue } = useIssueDetail();
  const storeType = useIssueStoreType();
  const isOpen = createModalData !== null;
  // derived values
  const ExistingIssuesListModalPayload = addIssuesToView
    ? moduleId
      ? { module: moduleId.toString(), start_date: "none" }
      : { cycle: true, start_date: "none" }
    : { start_date: "none" };

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
        message: (err) => (err as { message?: string })?.message || t("common.errors.default.message"),
      },
    });
  };

  const handleNewIssue = () => {
    openCalendarCreateModal(prePopulatedData, setCreateModalData, onOpen);
  };
  const handleExistingIssue = () => {
    setIsExistingIssueModalOpen(true);
  };

  if (!projectId) return null;

  const quickAddMenu = (
    <div
      className={cn("md:opacity-0 rounded md:border-[0.5px] border-custom-border-200 md:group-hover:opacity-100", {
        block: isMenuOpen,
      })}
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
            <span className="text-sm font-medium flex-shrink-0">
              {isEpic ? t("epic.add.label") : t("issue.add.label")}
            </span>
          </div>
        }
      >
        <CustomMenu.MenuItem onClick={handleNewIssue}>
          {isEpic ? t("epic.add.label") : t("issue.add.label")}
        </CustomMenu.MenuItem>
        {!isEpic && <CustomMenu.MenuItem onClick={handleExistingIssue}>{t("issue.add.existing")}</CustomMenu.MenuItem>}
      </CustomMenu>
    </div>
  );

  return (
    <>
      {!isEpic && (
        <CreateUpdateIssueModal
          isOpen={isOpen}
          onClose={() => setCreateModalData(null)}
          data={createModalData ?? undefined}
          storeType={storeType}
        />
      )}
      {workspaceSlug && projectId && (
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isOpen={isExistingIssueModalOpen}
          handleClose={() => setIsExistingIssueModalOpen(false)}
          searchParams={ExistingIssuesListModalPayload}
          handleOnSubmit={handleAddIssuesToView}
          shouldHideIssue={(issue) => {
            if (issue.target_date && prePopulatedData?.start_date) {
              const issueTargetDate = new Date(issue.target_date);
              const startDate = new Date(prePopulatedData.start_date);
              const diffInDays = differenceInCalendarDays(issueTargetDate, startDate);
              if (diffInDays < 0) return true;
            }
            return false;
          }}
        />
      )}
      {isEpic ? (
        <QuickAddIssueRoot
          isQuickAddOpen={isOpen}
          setIsQuickAddOpen={(isOpen) => setCreateModalData(isOpen ? { ...(prePopulatedData ?? {}) } : null)}
          layout={EIssueLayoutTypes.CALENDAR}
          prePopulatedData={prePopulatedData}
          quickAddCallback={quickAddCallback}
          customQuickAddButton={quickAddMenu}
          isEpic
        />
      ) : (
        quickAddMenu
      )}
    </>
  );
});
