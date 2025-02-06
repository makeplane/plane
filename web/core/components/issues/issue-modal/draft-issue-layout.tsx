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
import { ConfirmIssueDiscard } from "@/components/issues";
// helpers
import { isEmptyHtmlString } from "@/helpers/string.helper";
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

  const handleClose = () => {
    if (data?.id) {
      onClose();
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
      <IssueFormRoot {...props} onClose={handleClose} />
    </>
  );
});
