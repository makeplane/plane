/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkflowRevision, TWorkflowRevisionStatus } from "@plane/types";
// helpers
import { validateRevisionForPublish } from "@/utils/workflow";
import { getWorkflowErrorCode, getWorkflowErrorMessage, getWorkflowValidationIssues } from "@/utils/workflow-error";

type TWorkflowPublishProps = {
  workflowId: string;
  draft: IWorkflowRevision | undefined;
  published: IWorkflowRevision | undefined;
  isEditable: boolean;
  onCreateDraft: () => Promise<unknown>;
  onPublish: () => Promise<unknown>;
};

const STATUS_VARIANT: Record<TWorkflowRevisionStatus, "warning" | "success" | "neutral"> = {
  draft: "warning",
  published: "success",
  retired: "neutral",
};

export const WorkflowPublish = observer(function WorkflowPublish(props: TWorkflowPublishProps) {
  const { workflowId, draft, published, isEditable, onCreateDraft, onPublish } = props;
  const { t } = useTranslation();

  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // §24.2 checklist, evaluated client-side. The server runs the same rules but
  // its publish view raises `WorkflowRevisionPublishInvalid` un-translated,
  // so the `issues[]` payload never arrives — evaluating here is what makes
  // publish actionable.
  const clientIssues = useMemo(() => (draft ? validateRevisionForPublish(draft) : []), [draft]);
  const isPublishable = Boolean(draft) && clientIssues.length === 0;

  const statusLabel: Record<TWorkflowRevisionStatus, string> = {
    draft: t("project_settings.workflows.revision.draft"),
    published: t("project_settings.workflows.revision.published"),
    retired: t("project_settings.workflows.revision.retired"),
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.workflows.revision.publish_success.title"),
        message: t("project_settings.workflows.revision.publish_success.message"),
      });
    } catch (error) {
      // The server may still deliver `issues[]` once the publish view is
      // fixed; prefer them over the generic detail when present.
      const serverIssues = getWorkflowValidationIssues(error);
      const message =
        serverIssues.length > 0
          ? serverIssues.map((issue) => issue.detail).join("\n")
          : getWorkflowErrorMessage(error, t("project_settings.workflows.revision.publish_error.message"));

      if (getWorkflowErrorCode(error) === "WORKFLOW_DISABLED") {
        setToast({
          type: TOAST_TYPE.WARNING,
          title: t("project_settings.workflows.revision.publish_error.title"),
          message: t("project_settings.workflows.errors.workflows_disabled"),
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_settings.workflows.revision.publish_error.title"),
          message,
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateDraft = async () => {
    setIsCreatingDraft(true);
    try {
      await onCreateDraft();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: getWorkflowErrorMessage(error, t("project_settings.workflows.errors.generic")),
      });
    } finally {
      setIsCreatingDraft(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {draft ? (
          <span
            className={`rounded-sm border border-subtle px-2 py-1 text-12 text-secondary ${
              STATUS_VARIANT[draft.status] === "warning" ? "border-accent-warning-200" : ""
            }`}
          >
            {t("project_settings.workflows.revision.version", { version: draft.version })} · {statusLabel[draft.status]}
          </span>
        ) : published ? (
          <span className="border-accent-success-200 rounded-sm border px-2 py-1 text-12 text-secondary">
            {t("project_settings.workflows.revision.version", { version: published.version })} ·{" "}
            {statusLabel[published.status]}
          </span>
        ) : (
          <span className="text-13 text-tertiary">{t("project_settings.workflows.revision.no_revision")}</span>
        )}

        {isEditable && !draft && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleCreateDraft()}
            loading={isCreatingDraft}
            disabled={isCreatingDraft}
          >
            {t("project_settings.workflows.revision.create_draft")}
          </Button>
        )}

        {isEditable && draft && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handlePublish()}
            loading={isPublishing}
            disabled={isPublishing || !isPublishable}
            title={
              isPublishable
                ? undefined
                : `${t("project_settings.workflows.revision.publish_blocked_heading")}: ${clientIssues.join("; ")}`
            }
            data-testid={`workflow-publish-${workflowId}`}
          >
            {isPublishing
              ? t("project_settings.workflows.revision.publish_loading")
              : t("project_settings.workflows.revision.publish")}
          </Button>
        )}
      </div>

      {draft && clientIssues.length > 0 && (
        <div className="border-accent-warning-200 rounded-md border p-3">
          <p className="text-13 font-medium text-primary">
            {t("project_settings.workflows.revision.publish_blocked_heading")}
          </p>
          <p className="mt-1 text-12 text-tertiary">{t("project_settings.workflows.revision.publish_blocked_hint")}</p>
          <ul className="mt-2 list-inside list-disc">
            {clientIssues.map((issue) => (
              <li key={issue} className="text-12 text-secondary">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
