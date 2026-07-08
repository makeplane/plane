/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
import { CreateIssueToastActionItems } from "@/components/issues/create-issue-toast-action-items";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
// services
import { IssueService } from "@/services/issue";
const issueService = new IssueService();

type TDuplicateWorkItemModalProps = {
  workItemId: string;
  onClose: () => void;
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
};

export const DuplicateWorkItemModal = observer(function DuplicateWorkItemModal(props: TDuplicateWorkItemModalProps) {
  const { workItemId, onClose, isOpen, workspaceSlug, projectId } = props;
  // states
  const [targetProjectId, setTargetProjectId] = useState<string>(projectId);
  const [isDuplicating, setIsDuplicating] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { issues: projectIssues } = useIssues(EIssuesStoreType.PROJECT);
  const { fetchProjectStates } = useProjectState();
  const { allowPermissions } = useUserPermissions();

  useEffect(() => {
    if (isOpen) setTargetProjectId(projectId);
  }, [isOpen, projectId]);

  const handleClose = () => {
    setIsDuplicating(false);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!targetProjectId || isDuplicating) return;

    setIsDuplicating(true);
    try {
      const sourceWorkItem = await issueService.retrieve(workspaceSlug, projectId, workItemId);
      const isSameProject = targetProjectId === projectId;

      const payload: Partial<TIssue> = {
        project_id: targetProjectId,
        name: `Copy of ${sourceWorkItem.name}`,
        description_html: sourceWorkItem.description_html || "<p></p>",
        priority: sourceWorkItem.priority,
        start_date: sourceWorkItem.start_date,
        target_date: sourceWorkItem.target_date,
      };

      if (isSameProject) {
        payload.state_id = sourceWorkItem.state_id;
        payload.label_ids = sourceWorkItem.label_ids;
        payload.assignee_ids = sourceWorkItem.assignee_ids;
        payload.estimate_point = sourceWorkItem.estimate_point;
      } else {
        const targetProjectStates = await fetchProjectStates(workspaceSlug, targetProjectId);
        const defaultStateId = targetProjectStates.find((state) => state.default)?.id;
        if (defaultStateId) payload.state_id = defaultStateId;
      }

      const response = await projectIssues.createIssue(workspaceSlug, targetProjectId, payload);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("issue.toast.duplicate.success.message"),
        actionItems: (
          <CreateIssueToastActionItems
            workspaceSlug={workspaceSlug}
            projectId={targetProjectId}
            issueId={response.id}
          />
        ),
      });
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("issue.toast.duplicate.error.message"),
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">{t("issue.duplicate.modal.title")}</h3>
        <p className="mt-3 text-13 text-secondary">{t("issue.duplicate.modal.description1")}</p>
        <div className="mt-3 h-7 w-fit">
          <ProjectDropdown
            value={targetProjectId}
            onChange={(val) => setTargetProjectId(val)}
            multiple={false}
            buttonVariant="border-with-text"
            renderCondition={(projectIdToRender) =>
              allowPermissions(
                [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
                EUserPermissionsLevel.PROJECT,
                workspaceSlug,
                projectIdToRender
              )
            }
            placeholder={t("issue.duplicate.modal.placeholder")}
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" onClick={handleDuplicate} loading={isDuplicating}>
            {isDuplicating ? "Duplicating" : "Duplicate"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
