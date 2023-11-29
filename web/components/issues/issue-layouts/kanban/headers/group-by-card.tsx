import React, { FC } from "react";
import { useRouter } from "next/router";
// services
import { ModuleService } from "services/module.service";
import { IssueService } from "services/issue";
// components
import { CustomMenu } from "@plane/ui";
import { CreateUpdateIssueModal } from "components/issues/modal";
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
      <CreateUpdateIssueModal
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
        prePopulateData={issuePayload}
        currentStore={currentStore}
      />
      {renderExistingIssueModal && (
        <ExistingIssuesListModal
          isOpen={openExistingIssueListModal}
          handleClose={() => setOpenExistingIssueListModal(false)}
          searchParams={ExistingIssuesListModalPayload}
          handleOnSubmit={handleAddIssuesToView}
        />
      )}
      <div
        className={`flex-shrink-0 relative flex gap-2 p-1.5 ${
          verticalAlignPosition ? `flex-col items-center w-[44px]` : `flex-row items-center w-full`
        }`}
      >
        <div className="flex-shrink-0 w-[20px] h-[20px] rounded-sm overflow-hidden flex justify-center items-center">
          {icon ? icon : <Circle width={14} strokeWidth={2} />}
        </div>

        <div className={`flex items-center gap-1 ${verticalAlignPosition ? `flex-col` : `flex-row w-full`}`}>
          <div
            className={`font-medium line-clamp-1 text-custom-text-100 ${verticalAlignPosition ? `vertical-lr` : ``}`}
          >
            {title}
          </div>
          <div className={`text-sm font-medium text-custom-text-300 ${verticalAlignPosition ? `` : `pl-2`}`}>
            {count || 0}
          </div>
        </div>

        {sub_group_by === null && (
          <div
            className="flex-shrink-0 w-[20px] h-[20px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all"
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
                <span className="flex-shrink-0 w-[20px] h-[20px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all">
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
              className="flex-shrink-0 w-[20px] h-[20px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all"
              onClick={() => setIsOpen(true)}
            >
              <Plus width={14} strokeWidth={2} />
            </div>
          ))}
      </div>
    </>
  );
});
