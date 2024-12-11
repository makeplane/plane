"use client";

import React, { useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// types
import type { TIssue } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ConfirmIssueDiscard } from "@/components/issues";
// helpers
import { isEmptyHtmlString } from "@/helpers/string.helper";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useEventTracker, useWorkspaceDraftIssues } from "@/hooks/store";
// local components
import { IssueFormRoot } from "./form";

export interface DraftIssueProps {
  changesMade: Partial<TIssue> | null;
  data?: Partial<TIssue>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  isCreateMoreToggleEnabled: boolean;
  onAssetUpload: (assetId: string) => void;
  onCreateMoreToggleChange: (value: boolean) => void;
  onChange: (formData: Partial<TIssue> | null) => void;
  onClose: (saveDraftIssueInLocalStorage?: boolean) => void;
  onSubmit: (formData: Partial<TIssue>, is_draft_issue?: boolean) => Promise<void>;
  projectId: string;
  isDraft: boolean;
  moveToIssue?: boolean;
  modalTitle?: string;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  isDuplicateModalOpen: boolean;
  handleDuplicateIssueModal: (isOpen: boolean) => void;
  isProjectSelectionDisabled?: boolean;
}

export const DraftIssueLayout: React.FC<DraftIssueProps> = observer((props) => {
  const {
    changesMade,
    data,
    issueTitleRef,
    onAssetUpload,
    onChange,
    onClose,
    onSubmit,
    projectId,
    isCreateMoreToggleEnabled,
    onCreateMoreToggleChange,
    isDraft,
    moveToIssue = false,
    modalTitle,
    primaryButtonText,
    isDuplicateModalOpen,
    handleDuplicateIssueModal,
    isProjectSelectionDisabled = false,
  } = props;
  // states
  const [issueDiscardModal, setIssueDiscardModal] = useState(false);
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  const pathname = usePathname();
  // store hooks
  const { captureIssueEvent } = useEventTracker();
  const { handleCreateUpdatePropertyValues } = useIssueModal();
  const { createIssue } = useWorkspaceDraftIssues();

  const handleClose = () => {
    if (data?.id) {
      onClose(false);
      setIssueDiscardModal(false);
    } else {
      if (changesMade) {
        Object.entries(changesMade).forEach(([key, value]) => {
          const issueKey = key as keyof TIssue;
          if (value === null || value === undefined || value === "") delete changesMade[issueKey];
          if (typeof value === "object" && isEmpty(value)) delete changesMade[issueKey];
          if (Array.isArray(value) && value.length === 0) delete changesMade[issueKey];
          if (issueKey === "project_id") delete changesMade.project_id;
          if (issueKey === "priority" && value && value === "none") delete changesMade.priority;
          if (
            issueKey === "description_html" &&
            changesMade.description_html &&
            isEmptyHtmlString(changesMade.description_html, ["img"])
          )
            delete changesMade.description_html;
        });
        if (isEmpty(changesMade)) {
          onClose(false);
          setIssueDiscardModal(false);
        } else setIssueDiscardModal(true);
      } else {
        onClose(false);
        setIssueDiscardModal(false);
      }
    }
  };

  const handleCreateDraftIssue = async () => {
    if (!changesMade || !workspaceSlug || !projectId) return;

    const payload = {
      ...changesMade,
      name: changesMade?.name && changesMade?.name?.trim() !== "" ? changesMade.name?.trim() : "Untitled",
      project_id: projectId,
    };

    const response = await createIssue(workspaceSlug.toString(), payload)
      .then((res) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Draft created.",
        });
        captureIssueEvent({
          eventName: "Draft issue created",
          payload: { ...res, state: "SUCCESS" },
          path: pathname,
        });
        onChange(null);
        setIssueDiscardModal(false);
        onClose(false);
        return res;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
        captureIssueEvent({
          eventName: "Draft issue created",
          payload: { ...payload, state: "FAILED" },
          path: pathname,
        });
      });

    if (response && handleCreateUpdatePropertyValues) {
      handleCreateUpdatePropertyValues({
        issueId: response.id,
        issueTypeId: response.type_id,
        projectId,
        workspaceSlug: workspaceSlug?.toString(),
        isDraft: true,
      });
    }
  };

  return (
    <>
      <ConfirmIssueDiscard
        isOpen={issueDiscardModal}
        handleClose={() => setIssueDiscardModal(false)}
        onConfirm={handleCreateDraftIssue}
        onDiscard={() => {
          onChange(null);
          setIssueDiscardModal(false);
          onClose(false);
        }}
      />
      <IssueFormRoot
        isCreateMoreToggleEnabled={isCreateMoreToggleEnabled}
        onCreateMoreToggleChange={onCreateMoreToggleChange}
        data={data}
        issueTitleRef={issueTitleRef}
        onAssetUpload={onAssetUpload}
        onChange={onChange}
        onClose={handleClose}
        onSubmit={onSubmit}
        projectId={projectId}
        isDraft={isDraft}
        moveToIssue={moveToIssue}
        modalTitle={modalTitle}
        primaryButtonText={primaryButtonText}
        isDuplicateModalOpen={isDuplicateModalOpen}
        handleDuplicateIssueModal={handleDuplicateIssueModal}
        isProjectSelectionDisabled={isProjectSelectionDisabled}
      />
    </>
  );
});
