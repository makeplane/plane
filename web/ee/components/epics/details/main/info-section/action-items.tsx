"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Link, Paperclip } from "lucide-react";
// constants
import { EIssueServiceType } from "@plane/constants";
// components
import { IssueAttachmentActionButton, IssueLinksActionButton, IssueReaction } from "@/components/issues";
import { IssueLinkCreateUpdateModal } from "@/components/issues/issue-detail/links/create-update-link-modal";
import { useLinkOperations } from "@/components/issues/issue-detail-widgets/links/helper";
// hooks
import { useIssueDetail, useUser } from "@/hooks/store";

type TEpicInfoActionItemsProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
};

export const EpicInfoActionItems: FC<TEpicInfoActionItemsProps> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const {
    isIssueLinkModalOpen,
    toggleIssueLinkModal: toggleIssueLinkModalStore,
    setIssueLinkData,
    setLastWidgetAction,
  } = useIssueDetail(EIssueServiceType.EPICS);

  // helper hooks
  const handleLinkOperations = useLinkOperations(workspaceSlug, projectId, epicId, EIssueServiceType.EPICS);

  // handlers
  const handleIssueLinkModalOnClose = () => {
    toggleIssueLinkModalStore(false);
    setLastWidgetAction("links");
    setIssueLinkData(null);
  };

  return (
    <>
      {currentUser && (
        <IssueReaction
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={epicId}
          currentUser={currentUser}
          disabled={disabled}
          className="m-0"
        />
      )}
      <div className="flex flex-col gap-5">
        <div className="flex items-center flex-wrap gap-2">
          <IssueLinksActionButton
            issueServiceType={EIssueServiceType.EPICS}
            customButton={
              <div className="flex items-center gap-1 p-2 text-custom-text-300 hover:text-custom-text-100">
                <Link className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm font-medium">Add link</span>
              </div>
            }
            disabled={disabled}
          />
          <IssueAttachmentActionButton
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={epicId}
            issueServiceType={EIssueServiceType.EPICS}
            customButton={
              <div className="flex items-center gap-1 p-2 text-custom-text-300 hover:text-custom-text-100">
                <Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm font-medium">Attach</span>
              </div>
            }
            disabled={disabled}
          />
        </div>
      </div>

      {/* Modals */}
      <IssueLinkCreateUpdateModal
        isModalOpen={isIssueLinkModalOpen}
        handleOnClose={handleIssueLinkModalOnClose}
        linkOperations={handleLinkOperations}
        issueServiceType={EIssueServiceType.EPICS}
      />
    </>
  );
});
