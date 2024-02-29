import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useEventTracker } from "hooks/store";
// services
import { IssueDraftService } from "services/issue";
// components
import { IssueFormRoot } from "components/issues/issue-modal/form";
import { ConfirmIssueDiscard } from "components/issues";
// types
import type { TIssue } from "@plane/types";

export interface DraftIssueProps {
  changesMade: Partial<TIssue> | null;
  data?: Partial<TIssue>;
  isCreateMoreToggleEnabled: boolean;
  onCreateMoreToggleChange: (value: boolean) => void;
  onChange: (formData: Partial<TIssue> | null) => void;
  onClose: (saveDraftIssueInLocalStorage?: boolean) => void;
  onSubmit: (formData: Partial<TIssue>) => Promise<void>;
  projectId: string;
  isDraft: boolean;
}

const issueDraftService = new IssueDraftService();

export const DraftIssueLayout: React.FC<DraftIssueProps> = observer((props) => {
  const {
    changesMade,
    data,
    onChange,
    onClose,
    onSubmit,
    projectId,
    isCreateMoreToggleEnabled,
    onCreateMoreToggleChange,
    isDraft,
  } = props;
  // states
  const [issueDiscardModal, setIssueDiscardModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // store hooks
  const { captureIssueEvent } = useEventTracker();

  const handleClose = () => {
    if (changesMade) setIssueDiscardModal(true);
    else onClose(false);
  };

  const handleCreateDraftIssue = async () => {
    if (!changesMade || !workspaceSlug || !projectId) return;

    const payload = { ...changesMade };

    await issueDraftService
      .createDraftIssue(workspaceSlug.toString(), projectId.toString(), payload)
      .then((res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Draft Issue created successfully.",
        });
        captureIssueEvent({
          eventName: "Draft issue created",
          payload: { ...res, state: "SUCCESS" },
          path: router.asPath,
        });
        onChange(null);
        setIssueDiscardModal(false);
        onClose(false);
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
        captureIssueEvent({
          eventName: "Draft issue created",
          payload: { ...payload, state: "FAILED" },
          path: router.asPath,
        });
      });
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
        onChange={onChange}
        onClose={handleClose}
        onSubmit={onSubmit}
        projectId={projectId}
        isDraft={isDraft}
      />
    </>
  );
});
