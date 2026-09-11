/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TDeDupeIssue, TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// helpers
import { getIssueKey } from "@/helpers/issue-key.helper";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  data?: TIssue | TDeDupeIssue;
  isOpen: boolean;
  handleClose: () => void;
  // Which store context the modal was opened from (project, cycle, module,
  // global); the move removes the work item from THAT store's lists so the
  // source view does not keep a stale entry (QUESTIMUS-30 review REAL-1).
  storeType?: EIssuesStoreType;
};

export const MoveIssueModal = observer(function MoveIssueModal(props: Props) {
  const { data, isOpen, handleClose, storeType = EIssuesStoreType.PROJECT } = props;
  const { t } = useTranslation();
  // states
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { issues } = useIssues(storeType);
  const { getProjectById, getProjectIdentifierById } = useProject();
  const { projectsWithCreatePermissions } = useUser();

  useEffect(() => {
    if (isOpen) {
      setTargetProjectId(null);
      setIsMoving(false);
    }
  }, [isOpen]);

  if (!data) return null;

  const issue = data;
  const sourceProjectDetails = getProjectById(issue.project_id);

  // Destination projects: the ones the user can create/move into, excluding the
  // source project itself (mirrors IssueProjectSelect's allowedProjectIds source).
  const eligibleProjectIds = issue.project_id
    ? Object.keys(projectsWithCreatePermissions ?? {}).filter((projectId) => projectId !== issue.project_id)
    : [];

  const onClose = () => {
    setIsMoving(false);
    handleClose();
  };

  // Block closing while a move is in flight: the success toast + navigation
  // must not fire after the user dismissed the modal (review finding S2).
  const guardedClose = () => {
    if (!isMoving) onClose();
  };

  const handleMoveIssue = async () => {
    if (!targetProjectId || !workspaceSlug || !issue.project_id) return;
    setIsMoving(true);
    try {
      const response = await issues.moveIssue(workspaceSlug.toString(), issue.project_id, issue.id, targetProjectId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("issue.move.success"),
      });
      onClose();
      const targetProjectIdentifier = getProjectIdentifierById(response.project_id);
      if (targetProjectIdentifier) {
        router.push(`/${workspaceSlug.toString()}/browse/${targetProjectIdentifier}-${response.sequence_id}/`);
      } else {
        // Fallback: the target project record is not loaded yet — land on its
        // work item list instead of a broken /browse/undefined-N/ URL (REAL-3).
        router.push(`/${workspaceSlug.toString()}/projects/${response.project_id}/issues/`);
      }
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: (error as { error?: string })?.error ?? t("issue.move.failed"),
      });
      setIsMoving(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={guardedClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">{t("issue.move.modal.title")}</h3>
        <p className="mt-1 text-13 text-secondary">
          <span className="font-medium text-primary">
            {getIssueKey(sourceProjectDetails?.identifier, issue.sequence_id)}
          </span>{" "}
          {issue.name}
        </p>
        <p className="mt-3 text-13 text-secondary">{t("issue.move.modal.description")}</p>
        {eligibleProjectIds.length > 0 ? (
          <div className="mt-3">
            <ProjectDropdown
              value={targetProjectId}
              onChange={setTargetProjectId}
              multiple={false}
              buttonVariant="border-with-text"
              renderCondition={(projectId) => eligibleProjectIds.includes(projectId)}
            />
          </div>
        ) : (
          <p className="border-border mt-3 rounded-sm border border-dashed bg-surface-2 px-3 py-2 text-13 text-secondary">
            {t("issue.move.modal.no_projects")}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose} disabled={isMoving}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleMoveIssue}
            loading={isMoving}
            disabled={!targetProjectId || isMoving}
          >
            {t("common.actions.move_to_project")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
