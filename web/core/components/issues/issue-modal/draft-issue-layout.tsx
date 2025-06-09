"use client";

import React, { useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { useTranslation } from "@plane/i18n";
// types
import type { TIssue } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { isEmptyHtmlString } from "@plane/utils";
import { ConfirmIssueDiscard } from "@/components/issues";
// helpers
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useEventTracker, useWorkspaceDraftIssues } from "@/hooks/store";
// local components
import { IssueFormRoot, type IssueFormProps } from "./form";

export interface DraftIssueProps extends IssueFormProps {
  changesMade: Partial<TIssue> | null;
  onChange: (formData: Partial<TIssue> | null) => void;
}

export const DraftIssueLayout: React.FC<DraftIssueProps> = observer((props) => {
  const { changesMade, data, onChange, onClose, projectId } = props;
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
  const { t } = useTranslation();

  const sanitizeChanges = (): Partial<TIssue> => {
    const sanitizedChanges = { ...changesMade };
    Object.entries(sanitizedChanges).forEach(([key, value]) => {
      const issueKey = key as keyof TIssue;
      if (value === null || value === undefined || value === "") delete sanitizedChanges[issueKey];
      if (typeof value === "object" && isEmpty(value)) delete sanitizedChanges[issueKey];
      if (Array.isArray(value) && value.length === 0) delete sanitizedChanges[issueKey];
      if (issueKey === "project_id") delete sanitizedChanges.project_id;
      if (issueKey === "priority" && value && value === "none") delete sanitizedChanges.priority;
      if (
        issueKey === "description_html" &&
        changesMade?.description_html &&
        isEmptyHtmlString(changesMade.description_html, ["img"])
      )
        delete sanitizedChanges.description_html;
    });
    return sanitizedChanges;
  };

  const handleClose = () => {
    // If the user is updating an existing work item, we don't need to show the discard modal
    if (data?.id) {
      onClose();
      setIssueDiscardModal(false);
    } else {
      if (changesMade) {
        const sanitizedChanges = sanitizeChanges();
        if (isEmpty(sanitizedChanges)) {
          onClose();
          setIssueDiscardModal(false);
        } else setIssueDiscardModal(true);
      } else {
        onClose();
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
          title: `${t("success")}!`,
          message: t("workspace_draft_issues.toasts.created.success"),
        });
        captureIssueEvent({
          eventName: "Draft work item created",
          payload: { ...res, state: "SUCCESS" },
          path: pathname,
        });
        onChange(null);
        setIssueDiscardModal(false);
        onClose();
        return res;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${t("error")}!`,
          message: t("workspace_draft_issues.toasts.created.error"),
        });
        captureIssueEvent({
          eventName: "Draft work item created",
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

  const handleDraftAndClose = () => {
    const sanitizedChanges = sanitizeChanges();
    if (!data?.id && !isEmpty(sanitizedChanges)) {
      handleCreateDraftIssue();
    }
    onClose();
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
          onClose();
        }}
      />
      <IssueFormRoot {...props} onClose={handleClose} handleDraftAndClose={handleDraftAndClose} />
    </>
  );
});
