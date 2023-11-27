import React from "react";
import { useRouter } from "next/router";
// lucide icons
import { CircleDashed, Plus } from "lucide-react";
// components
import { CreateUpdateIssueModal } from "components/issues/modal";
import { ExistingIssuesListModal } from "components/core";
import { CustomMenu } from "@plane/ui";
// mobx
import { observer } from "mobx-react-lite";
// types
import { IIssue, ISearchIssueResponse } from "types";
import { EProjectStore } from "store/command-palette.store";

interface IHeaderGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<IIssue>;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
}

export const HeaderGroupByCard = observer(
  ({ icon, title, count, issuePayload, disableIssueCreation, currentStore }: IHeaderGroupByCard) => {
    const router = useRouter();
    const { workspaceSlug, projectId, moduleId, cycleId } = router.query;

    const [isOpen, setIsOpen] = React.useState(false);

    const [openExistingIssueListModal, setOpenExistingIssueListModal] = React.useState(false);

    const renderExistingIssueModal = moduleId || cycleId;
    const ExistingIssuesListModalPayload = moduleId ? { module: true } : { cycle: true };

    const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
      if (!workspaceSlug || !projectId) return;

      const payload = {
        issues: data.map((i) => i.id),
      };

      // await moduleService
      //   .addIssuesToModule(workspaceSlug as string, projectId as string, moduleId as string, payload, user)
      //   .catch(() =>
      //     setToastAlert({
      //       type: "error",
      //       title: "Error!",
      //       message: "Selected issues could not be added to the module. Please try again.",
      //     })
      //   );
    };

    const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
      if (!workspaceSlug || !projectId) return;

      const payload = {
        issues: data.map((i) => i.id),
      };

      // await issueService
      //   .addIssueToCycle(workspaceSlug as string, projectId as string, cycleId as string, payload, user)
      //   .catch(() => {
      //     setToastAlert({
      //       type: "error",
      //       title: "Error!",
      //       message: "Selected issues could not be added to the cycle. Please try again.",
      //     });
      //   });
    };

    return (
      <>
        <div className="flex-shrink-0 relative flex gap-2 py-1.5 flex-row items-center w-full">
          <div className="flex-shrink-0 w-5 h-5 rounded-sm overflow-hidden flex justify-center items-center">
            {icon ? icon : <CircleDashed className="h-3.5 w-3.5" strokeWidth={2} />}
          </div>

          <div className="flex items-center gap-1 flex-row w-full">
            <div className="font-medium line-clamp-1 text-custom-text-100">{title}</div>
            <div className="text-sm font-medium text-custom-text-300 pl-2">{count || 0}</div>
          </div>

          {!disableIssueCreation &&
            (renderExistingIssueModal ? (
              <CustomMenu
                width="auto"
                customButton={
                  <span className="flex-shrink-0 w-5 h-5 rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all">
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
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
                className="flex-shrink-0 w-5 h-5 rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all"
                onClick={() => setIsOpen(true)}
              >
                <Plus width={14} strokeWidth={2} />
              </div>
            ))}

          <CreateUpdateIssueModal
            isOpen={isOpen}
            handleClose={() => setIsOpen(false)}
            currentStore={currentStore}
            prePopulateData={issuePayload}
          />

          {renderExistingIssueModal && (
            <ExistingIssuesListModal
              isOpen={openExistingIssueListModal}
              handleClose={() => setOpenExistingIssueListModal(false)}
              searchParams={ExistingIssuesListModalPayload}
              handleOnSubmit={moduleId ? handleAddIssuesToModule : handleAddIssuesToCycle}
            />
          )}
        </div>
      </>
    );
  }
);
