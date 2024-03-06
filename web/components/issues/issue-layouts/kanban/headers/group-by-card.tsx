import React, { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// ui
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
<<<<<<< HEAD
import { Minimize2, Maximize2, Circle, Plus } from "lucide-react";
import { CustomMenu } from "@plane/ui";
=======
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
import { ExistingIssuesListModal } from "components/core";
import { CreateUpdateIssueModal } from "components/issues";
// lucide icons
// hooks
<<<<<<< HEAD
import { TCreateModalStoreTypes } from "constants/issue";
=======
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
import { useEventTracker } from "hooks/store";
import useToast from "hooks/use-toast";
// mobx
// types
import { TIssue, ISearchIssueResponse, TIssueKanbanFilters } from "@plane/types";

interface IHeaderGroupByCard {
  sub_group_by: string | null;
  group_by: string | null;
  column_id: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: any;
  issuePayload: Partial<TIssue>;
  disableIssueCreation?: boolean;
  storeType?: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
}

export const HeaderGroupByCard: FC<IHeaderGroupByCard> = observer((props) => {
  const {
    sub_group_by,
    column_id,
    icon,
    title,
    count,
    kanbanFilters,
    handleKanbanFilters,
    issuePayload,
    disableIssueCreation,
    storeType,
    addIssuesToView,
  } = props;
  const verticalAlignPosition = sub_group_by ? false : kanbanFilters?.group_by.includes(column_id);
  // states
  const [isOpen, setIsOpen] = React.useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = React.useState(false);
  // hooks
  const { setTrackElement } = useEventTracker();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId, cycleId } = router.query;

  const isDraftIssue = router.pathname.includes("draft-issue");

  const renderExistingIssueModal = moduleId || cycleId;
  const ExistingIssuesListModalPayload = moduleId ? { module: moduleId.toString() } : { cycle: true };

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issues = data.map((i) => i.id);

    try {
      addIssuesToView && addIssuesToView(issues);
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
          searchParams={ExistingIssuesListModalPayload}
          handleOnSubmit={handleAddIssuesToView}
        />
      )}
      <div
        className={`relative flex flex-shrink-0 gap-2 p-1.5 ${
          verticalAlignPosition ? `w-[44px] flex-col items-center` : `w-full flex-row items-center`
        }`}
      >
        <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
          {icon ? icon : <Circle width={14} strokeWidth={2} />}
        </div>

        <div
          className={`relative overflow-hidden flex items-center gap-1 ${
            verticalAlignPosition ? `flex-col` : `w-full flex-row`
          }`}
        >
          <div
            className={`inline-block truncate line-clamp-1 font-medium text-custom-text-100 overflow-hidden ${
              verticalAlignPosition ? `vertical-lr max-h-[400px]` : ``
            }`}
          >
            {title}
          </div>
          <div
            className={`flex-shrink-0 text-sm font-medium text-custom-text-300 ${verticalAlignPosition ? `` : `pl-2`}`}
          >
            {count || 0}
          </div>
        </div>

        {sub_group_by === null && (
          <div
            className="flex h-[20px] w-[20px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
            onClick={() => handleKanbanFilters("group_by", column_id)}
          >
            {verticalAlignPosition ? (
              <Maximize2 width={14} strokeWidth={2} />
            ) : (
              <Minimize2 width={14} strokeWidth={2} />
            )}
          </div>
        )}

        {!disableIssueCreation &&
          (renderExistingIssueModal ? (
            <CustomMenu
              customButton={
                <span className="flex h-[20px] w-[20px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80">
                  <Plus height={14} width={14} strokeWidth={2} />
                </span>
              }
              placement="bottom-end"
            >
              <CustomMenu.MenuItem
                onClick={() => {
                  setTrackElement("Kanban layout");
                  setIsOpen(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Create issue</span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  setTrackElement("Kanban layout");
                  setOpenExistingIssueListModal(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Add an existing issue</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          ) : (
            <div
              className="flex h-[20px] w-[20px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
              onClick={() => {
                setTrackElement("Kanban layout");
                setIsOpen(true);
              }}
            >
              <Plus width={14} strokeWidth={2} />
            </div>
          ))}
      </div>
    </>
  );
});
