/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { isEmptyHtmlString } from "@plane/utils";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
// local imports
import { WorkItemDiscardConfirmationModal } from "./discard-confirmation-modal";
import { WorkItemFormRoot } from "./root";
import type { WorkItemFormProps } from "./root";

type WithDraftWrapperWorkItemFormProps = WorkItemFormProps & {
  changesMade: Partial<TIssue> | null;
  onChange: (formData: Partial<TIssue> | null) => void;
};

export const WithDraftWrapperWorkItemForm = observer(function WithDraftWrapperWorkItemForm(
  props: WithDraftWrapperWorkItemFormProps
) {
  const { changesMade, data, onChange, onClose, projectId } = props;
  // states
  const [issueDiscardModal, setIssueDiscardModal] = useState(false);
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
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
        onChange(null);
        setIssueDiscardModal(false);
        onClose();
        return res;
      })
      .catch((_error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${t("error")}!`,
          message: t("workspace_draft_issues.toasts.created.error"),
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
      <WorkItemDiscardConfirmationModal
        isOpen={issueDiscardModal}
        handleClose={() => setIssueDiscardModal(false)}
        onConfirm={handleCreateDraftIssue}
        onDiscard={() => {
          onChange(null);
          setIssueDiscardModal(false);
          onClose();
        }}
      />
      <WorkItemFormRoot {...props} onClose={handleClose} handleDraftAndClose={handleDraftAndClose} />
    </>
  );
});
