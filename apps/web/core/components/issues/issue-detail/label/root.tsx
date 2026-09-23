/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// components
import { LabelSelect } from "@/components/dropdowns/label/label-select";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

// stable fallback so children aren't re-rendered by a fresh [] identity each render
const EMPTY_LABEL_IDS: string[] = [];

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
};

export const IssueLabel = observer(function IssueLabel(props: TIssueLabel) {
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
  const {
    updateIssue,
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
        } catch {
          setToast({
            title: t("toast.error"),
            type: "error",
            message: t("entity.update.failed", { entity: t("issue.label", { count: 1 }) }),
          });
        }
      },
    }),
    [updateIssue, onLabelUpdate, t]
  );

  const labelIds = issue?.label_ids || EMPTY_LABEL_IDS;

  return (
    <div className="relative flex min-h-7.5 w-full flex-wrap items-center">
      {/* The binding lists the project's labels and lets project admins create one from an unmatched search. */}
      <LabelSelect
        projectId={projectId}
        value={labelIds}
        onChange={(nextLabelIds) =>
          void labelOperations.updateIssue(workspaceSlug, projectId, issueId, { label_ids: nextLabelIds })
        }
        disabled={disabled}
        variant="select-ghost-md"
        placeholder={t("label.select")}
        tooltip
        testId="work-item-label-select"
      />
    </div>
  );
});
