import React from "react";
import { useRouter } from "next/router";
// lucide icons
import { CircleDashed, Plus } from "lucide-react";
// components
import { CreateUpdateDraftIssueModal } from "components/issues/draft-issue-modal";
import { CreateUpdateIssueModal } from "components/issues/modal";
import { ExistingIssuesListModal } from "components/core";
import { CustomMenu } from "@plane/ui";
// mobx
import { observer } from "mobx-react-lite";
// types
import { IIssue, ISearchIssueResponse } from "types";
import { EProjectStore } from "store/command-palette.store";
import useToast from "hooks/use-toast";

interface IHeaderGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<IIssue>;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
}

export const HeaderGroupByCard = observer(
  ({ icon, title, count, issuePayload, disableIssueCreation, currentStore, addIssuesToView }: IHeaderGroupByCard) => {
    const router = useRouter();
    const { workspaceSlug, projectId, moduleId, cycleId } = router.query;

    const [isOpen, setIsOpen] = React.useState(false);

    const [openExistingIssueListModal, setOpenExistingIssueListModal] = React.useState(false);

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
              currentStore={currentStore}
              prePopulateData={issuePayload}
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
        </div>
      </>
    );
  }
);
