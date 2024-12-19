"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
// components
import { IssueLinkCreateUpdateModal } from "@/components/issues/issue-detail/links/create-update-link-modal";
import { useLinkOperations } from "@/components/issues/issue-detail-widgets/links/helper";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
};

export const EpicDetailWidgetModals: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId } = props;
  // store hooks
  const {
    isIssueLinkModalOpen,
    toggleIssueLinkModal: toggleIssueLinkModalStore,
    setIssueLinkData,
    setLastWidgetAction,
  } = useIssueDetail(EIssueServiceType.EPICS);

  // helper hooks
  const handleLinkOperations = useLinkOperations(workspaceSlug, projectId, epicId, EIssueServiceType.EPICS);

  const handleIssueLinkModalOnClose = () => {
    toggleIssueLinkModalStore(false);
    setLastWidgetAction("links");
    setIssueLinkData(null);
  };

  return (
    <>
      <IssueLinkCreateUpdateModal
        isModalOpen={isIssueLinkModalOpen}
        handleOnClose={handleIssueLinkModalOnClose}
        linkOperations={handleLinkOperations}
        issueServiceType={EIssueServiceType.EPICS}
      />
    </>
  );
});
