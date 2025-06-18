"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, IIssueLabel, TIssue, TIssueServiceType } from "@plane/types";
// components
import { TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useIssueDetail, useLabel, useProjectInbox } from "@/hooks/store";
// ui
// types
import { LabelList, IssueLabelSelectRoot } from "./";
// TODO: Fix this import statement, as core should not import from ee
// eslint-disable-next-line import/order

export type TIssueLabel = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  isInboxIssue?: boolean;
  onLabelUpdate?: (labelIds: string[]) => void;
  issueServiceType?: TIssueServiceType;
};

export type TLabelOperations = {
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  createLabel: (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => Promise<any>;
};

export const IssueLabel: FC<TIssueLabel> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    disabled = false,
    isInboxIssue = false,
    onLabelUpdate,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  const { t } = useTranslation();
  // hooks
  const { updateIssue } = useIssueDetail(issueServiceType);
  const { createLabel } = useLabel();
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);
  const { getIssueInboxByIssueId } = useProjectInbox();

  const issue = isInboxIssue ? getIssueInboxByIssueId(issueId)?.issue : getIssueById(issueId);

  const labelOperations: TLabelOperations = useMemo(
    () => ({
      updateIssue: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          if (onLabelUpdate) onLabelUpdate(data.label_ids || []);
          else await updateIssue(workspaceSlug, projectId, issueId, data);
        } catch (error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: t("issue.label", { count: 1 }) }),
          });
        }
      },
      createLabel: async (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => {
        try {
          const labelResponse = await createLabel(workspaceSlug, projectId, data);
          if (!isInboxIssue)
            setToast({
              title: t("toast.success"),
              type: TOAST_TYPE.SUCCESS,
              message: t("label.create.success"),
            });
          return labelResponse;
        } catch (error) {
          let errMessage = t("label.create.failed");
          if (error && (error as any).error === "Label with the same name already exists in the project")
            errMessage = t("label.create.already_exists");

          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: errMessage,
          });
          throw error;
        }
      },
    }),
    [updateIssue, createLabel, onLabelUpdate]
  );

  return (
    <div className="relative flex flex-wrap items-center gap-1">
      <LabelList
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        values={issue?.label_ids || []}
        labelOperations={labelOperations}
        disabled={disabled}
      />

      {!disabled && (
        <IssueLabelSelectRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          values={issue?.label_ids || []}
          labelOperations={labelOperations}
        />
      )}
    </div>
  );
});
