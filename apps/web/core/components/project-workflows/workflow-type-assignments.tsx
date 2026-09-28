/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkflow, IWorkflowTypeAssignment } from "@plane/types";
import { Badge, CustomSearchSelect } from "@plane/ui";
// helpers
import { getWorkflowErrorMessage } from "@/utils/workflow-error";

type TWorkflowTypeAssignmentsProps = {
  workflow: IWorkflow;
  /** Every assignment in the project, so the picker can exclude taken ones. */
  projectAssignments: IWorkflowTypeAssignment[] | undefined;
  isEditable: boolean;
  onCreate: (workflowId: string, issueTypeId: string, issueTypeName: string) => Promise<unknown>;
  onRemove: (assignmentId: string) => Promise<void>;
};

export const WorkflowTypeAssignments = observer(function WorkflowTypeAssignments(props: TWorkflowTypeAssignmentsProps) {
  const { workflow, projectAssignments, isEditable, onCreate, onRemove } = props;
  const { t } = useTranslation();

  const [pendingTypeId, setPendingTypeId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignments = (projectAssignments ?? []).filter((a) => a.workflow === workflow.id);

  // Only types already assigned somewhere in the project are offerable: the
  // admin API returns `issue_type_name` on assignments and exposes no
  // endpoint that lists the project's work item types.
  const typeOptions = [...new Map((projectAssignments ?? []).map((a) => [a.issue_type, a.issue_type_name])).entries()]
    .filter(([issueTypeId]) => !assignments.some((a) => a.issue_type === issueTypeId))
    .map(([value, label]) => ({ value, query: label, content: label }));

  const handleCreate = async () => {
    if (!pendingTypeId) return;
    const option = typeOptions.find((o) => o.value === pendingTypeId);
    if (!option) return;

    setIsSubmitting(true);
    try {
      await onCreate(workflow.id, option.value, String(option.content));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.workflows.types.success.title"),
        message: t("project_settings.workflows.types.success.message"),
      });
      setPendingTypeId(undefined);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.workflows.types.error.title"),
        message: getWorkflowErrorMessage(error, t("project_settings.workflows.types.error.message")),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    try {
      await onRemove(assignmentId);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.workflows.types.error.title"),
        message: getWorkflowErrorMessage(error, t("project_settings.workflows.types.error.message")),
      });
    }
  };

  return (
    <div className="flex flex-col">
      <h4 className="text-14 font-medium text-primary">{t("project_settings.workflows.types.heading")}</h4>
      <p className="text-13 text-tertiary">{t("project_settings.workflows.types.description")}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {assignments.length === 0 ? (
          <span className="text-13 text-tertiary">{t("project_settings.workflows.types.none_assigned")}</span>
        ) : (
          assignments.map((assignment) => (
            <Badge key={assignment.id} variant="neutral" size="md">
              <span className="flex items-center gap-1">
                {assignment.issue_type_name}
                {isEditable && (
                  <button
                    type="button"
                    aria-label={t("common.remove")}
                    onClick={() => void handleRemove(assignment.id)}
                    className="rounded-sm p-0.5 hover:bg-layer-2"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            </Badge>
          ))
        )}
      </div>

      {!workflow.is_default && assignments.length === 0 && (
        <p className="mt-2 text-12 text-tertiary">{t("project_settings.workflows.default_footer.fallback_message")}</p>
      )}

      {isEditable && typeOptions.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <CustomSearchSelect
            multiple={false}
            value={pendingTypeId}
            onChange={(value: string) => setPendingTypeId(value)}
            options={typeOptions}
            label={t("project_settings.workflows.types.assign_button")}
            noResultsMessage={t("project_settings.workflows.types.empty_select")}
            className="w-56"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleCreate()}
            disabled={!pendingTypeId || isSubmitting}
            loading={isSubmitting}
          >
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" />
              {t("project_settings.workflows.types.assign_button")}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
});
