import React, { FC } from "react";
import { useRouter } from "next/router";
// components
import { CustomMenu } from "@plane/ui";
import { CreateUpdateIssueModal } from "components/issues/modal";
import { CreateUpdateDraftIssueModal } from "components/issues/draft-issue-modal";
import { ExistingIssuesListModal } from "components/core";
// lucide icons
import { Minimize2, Maximize2, Circle, Plus } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// mobx
import { observer } from "mobx-react-lite";
// types
import { IIssue, ISearchIssueResponse } from "types";
import { EProjectStore } from "store/command-palette.store";

interface IHeaderGroupByCard {
  sub_group_by: string | null;
  group_by: string | null;
  column_id: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
  issuePayload: Partial<IIssue>;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
}

export const HeaderGroupByCard: FC<IHeaderGroupByCard> = observer((props) => {
  const {
    sub_group_by,
    column_id,
    icon,
    title,
    count,
    kanBanToggle,
    handleKanBanToggle,
    issuePayload,
    disableIssueCreation,
    currentStore,
    addIssuesToView,
  } = props;
  const verticalAlignPosition = kanBanToggle?.groupByHeaderMinMax.includes(column_id);

  const [isOpen, setIsOpen] = React.useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = React.useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId, cycleId } = router.query;

  const isDraftIssue = router.pathname.includes("draft-issue");

  const { setToastAlert } = useToast();

  const renderExistingIssueModal = moduleId || cycleId;
  const ExistingIssuesListModalPayload = moduleId ? { module: true } : { cycle: true };

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issues = data.map((i) => i.id);

    addIssuesToView &&
      addIssuesToView(issues)?.catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Selected issues could not be added to the cycle. Please try again.",
        });
      });
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
          handleClose={() => setIsOpen(false)}
          prePopulateData={issuePayload}
          currentStore={currentStore}
        />
      )}
      {renderExistingIssueModal && (
        <ExistingIssuesListModal
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
            onClick={() => handleKanBanToggle("groupByHeaderMinMax", column_id)}
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
              width="auto"
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
