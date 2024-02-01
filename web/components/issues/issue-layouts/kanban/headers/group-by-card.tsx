import React, { FC } from "react";
import { useRouter } from "next/router";
// components
import { CustomMenu } from "@plane/ui";
import { ExistingIssuesListModal } from "components/core";
import { CreateUpdateIssueModal, CreateUpdateDraftIssueModal } from "components/issues";
// lucide icons
import { Minimize2, Maximize2, Circle, Plus } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// mobx
import { observer } from "mobx-react-lite";
// types
import { TIssue, ISearchIssueResponse, TIssueKanbanFilters } from "@plane/types";
import { TCreateModalStoreTypes } from "constants/issue";

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

  const [isOpen, setIsOpen] = React.useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = React.useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId, cycleId } = router.query;

  const isDraftIssue = router.pathname.includes("draft-issue");

  const { setToastAlert } = useToast();

  const renderExistingIssueModal = moduleId || cycleId;
  const ExistingIssuesListModalPayload = moduleId ? { module: [moduleId.toString()] } : { cycle: true };

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issues = data.map((i) => i.id);

    try {
      addIssuesToView && addIssuesToView(issues);
    } catch (error) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Selected issues could not be added to the cycle. Please try again.",
      });
    }
  };

  return (
    <>
      {isDraftIssue ? (
        <CreateUpdateDraftIssueModal
          isOpen={isOpen}
          handleClose={() => setIsOpen(false)}
          prePopulateData={issuePayload}
          fieldsToShow={["all"]}
        />
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

        <div className={`flex items-center gap-1 ${verticalAlignPosition ? `flex-col` : `w-full flex-row`}`}>
          <div
            className={`line-clamp-1 font-medium text-custom-text-100 ${verticalAlignPosition ? `vertical-lr` : ``}`}
          >
            {title}
          </div>
          <div className={`text-sm font-medium text-custom-text-300 ${verticalAlignPosition ? `` : `pl-2`}`}>
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
            >
              <CustomMenu.MenuItem onClick={() => setIsOpen(true)}>
                <span className="flex items-center justify-start gap-2">Create issue</span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => setOpenExistingIssueListModal(true)}>
                <span className="flex items-center justify-start gap-2">Add an existing issue</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          ) : (
            <div
              className="flex h-[20px] w-[20px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
              onClick={() => setIsOpen(true)}
            >
              <Plus width={14} strokeWidth={2} />
            </div>
          ))}
      </div>
    </>
  );
});
