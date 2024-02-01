import { useRouter } from "next/router";
// lucide icons
import { CircleDashed, Plus } from "lucide-react";
// components
import { CreateUpdateIssueModal, CreateUpdateDraftIssueModal } from "components/issues";
import { ExistingIssuesListModal } from "components/core";
import { CustomMenu } from "@plane/ui";
// mobx
import { observer } from "mobx-react-lite";
// types
import { TIssue, ISearchIssueResponse } from "@plane/types";
import useToast from "hooks/use-toast";
import { useState } from "react";
import { TCreateModalStoreTypes } from "constants/issue";

interface IHeaderGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<TIssue>;
  disableIssueCreation?: boolean;
  storeType: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
}

export const HeaderGroupByCard = observer(
  ({ icon, title, count, issuePayload, disableIssueCreation, storeType, addIssuesToView }: IHeaderGroupByCard) => {
    const router = useRouter();
    const { workspaceSlug, projectId, moduleId, cycleId } = router.query;

    const [isOpen, setIsOpen] = useState(false);

    const [openExistingIssueListModal, setOpenExistingIssueListModal] = useState(false);

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
        <div className="relative flex w-full flex-shrink-0 flex-row items-center gap-2 py-1.5">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
            {icon ? icon : <CircleDashed className="h-3.5 w-3.5" strokeWidth={2} />}
          </div>

          <div className="flex w-full flex-row items-center gap-1">
            <div className="line-clamp-1 font-medium text-custom-text-100">{title}</div>
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
                <CustomMenu.MenuItem onClick={() => setIsOpen(true)}>
                  <span className="flex items-center justify-start gap-2">Create issue</span>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setOpenExistingIssueListModal(true)}>
                  <span className="flex items-center justify-start gap-2">Add an existing issue</span>
                </CustomMenu.MenuItem>
              </CustomMenu>
            ) : (
              <div
                className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
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
        </div>
      </>
    );
  }
);
