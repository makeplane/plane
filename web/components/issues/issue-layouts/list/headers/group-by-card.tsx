import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// lucide icons
import { CircleDashed, Plus } from "lucide-react";
import { TIssue, ISearchIssueResponse } from "@plane/types";
// components
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { ExistingIssuesListModal } from "@/components/core";
import { CreateUpdateIssueModal } from "@/components/issues";
// ui
// mobx
// hooks
import { EIssuesStoreType } from "@/constants/issue";
import { useEventTracker } from "@/hooks/store";
// types

interface IHeaderGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<TIssue>;
  disableIssueCreation?: boolean;
  storeType: EIssuesStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
}

export const HeaderGroupByCard = observer(
  ({ icon, title, count, issuePayload, disableIssueCreation, storeType, addIssuesToView }: IHeaderGroupByCard) => {
    const router = useRouter();
    const { workspaceSlug, projectId, moduleId, cycleId } = router.query;
    // hooks
    const { setTrackElement } = useEventTracker();

    const [isOpen, setIsOpen] = useState(false);

    const [openExistingIssueListModal, setOpenExistingIssueListModal] = useState(false);

    const isDraftIssue = router.pathname.includes("draft-issue");

    const renderExistingIssueModal = moduleId || cycleId;
    const ExistingIssuesListModalPayload = moduleId ? { module: moduleId.toString() } : { cycle: true };

    const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
      if (!workspaceSlug || !projectId) return;

      const issues = data.map((i) => i.id);

      try {
        await addIssuesToView?.(issues);

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issues added to the cycle successfully.",
        });
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
        <div className="relative flex w-full flex-shrink-0 flex-row items-center gap-1.5 py-1.5">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
            {icon ? icon : <CircleDashed className="h-3.5 w-3.5" strokeWidth={2} />}
          </div>

          <div className="relative flex w-full flex-row items-center gap-1 overflow-hidden">
            <div className="inline-block line-clamp-1 truncate font-medium text-custom-text-100">{title}</div>
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
                <CustomMenu.MenuItem
                  onClick={() => {
                    setTrackElement("List layout");
                    setIsOpen(true);
                  }}
                >
                  <span className="flex items-center justify-start gap-2">Create issue</span>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem
                  onClick={() => {
                    setTrackElement("List layout");
                    setOpenExistingIssueListModal(true);
                  }}
                >
                  <span className="flex items-center justify-start gap-2">Add an existing issue</span>
                </CustomMenu.MenuItem>
              </CustomMenu>
            ) : (
              <div
                className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-custom-background-80"
                onClick={() => {
                  setTrackElement("List layout");
                  setIsOpen(true);
                }}
              >
                <Plus width={14} strokeWidth={2} />
              </div>
            ))}

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
        </div>
      </>
    );
  }
);
