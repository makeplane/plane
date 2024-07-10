"use client";
import React, { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueLinkCreateUpdateModal } from "../../issue-detail/links/create-update-link-modal";
// helper
import { useLinkOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const IssueLinksActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, customButton, disabled = false } = props;
  // state
  const [isIssueLinkModal, setIsIssueLinkModal] = useState(false);

  // store hooks
  const { toggleIssueLinkModal: toggleIssueLinkModalStore, setLastWidgetAction } = useIssueDetail();

  // helper
  const handleLinkOperations = useLinkOperations(workspaceSlug, projectId, issueId);

  // handler
  const toggleIssueLinkModal = useCallback(
    (modalToggle: boolean) => {
      toggleIssueLinkModalStore(modalToggle);
      setIsIssueLinkModal(modalToggle);
    },
    [toggleIssueLinkModalStore]
  );

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleIssueLinkModal(true);
  };

  const handleOnClose = () => {
    toggleIssueLinkModal(false);
    setLastWidgetAction("links");
  };

  return (
    <>
      <IssueLinkCreateUpdateModal
        isModalOpen={isIssueLinkModal}
        handleOnClose={handleOnClose}
        linkOperations={handleLinkOperations}
      />
      <button type="button" onClick={handleOnClick} disabled={disabled}>
        {customButton ? customButton : <Plus className="h-4 w-4" />}
      </button>
    </>
  );
});
