/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType, TIssueWorklog } from "@plane/types";
import { formatWorklogDuration, renderFormattedDate } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  issueId: string;
  issueServiceType: TIssueServiceType;
  canManage: (worklog: TIssueWorklog) => boolean;
  disabled: boolean;
  onEdit: (worklog: TIssueWorklog) => void;
  onDelete: (worklog: TIssueWorklog) => void;
};

export const IssueWorklogsCollapsibleContent = observer(function IssueWorklogsCollapsibleContent(props: Props) {
  const { issueId, issueServiceType, canManage, disabled, onEdit, onDelete } = props;
  const { t } = useTranslation();
  const {
    worklog: { getWorklogsByIssueId, loader, error },
  } = useIssueDetail(issueServiceType);

  const worklogs = getWorklogsByIssueId(issueId);
  const isLoading = loader[issueId];
  const hasError = error[issueId];

  if (isLoading) {
    return <p className="px-2 py-3 text-13 text-tertiary">{t("loading")}...</p>;
  }

  if (hasError) {
    return <p className="px-2 py-3 text-13 text-danger-primary">{t("something_went_wrong_please_try_again")}</p>;
  }

  if (!worklogs.length) {
    return <p className="px-2 py-3 text-13 text-tertiary">{t("activity_empty_state.no_worklogs")}</p>;
  }

  return (
    <div className="space-y-2 px-2 py-2">
      {worklogs.map((worklog) => (
        <div key={worklog.id} className="flex items-start justify-between gap-3 rounded-md border border-subtle p-2">
          <div className="min-w-0">
            <p className="text-13 font-medium text-primary">
              {worklog.actor_detail?.display_name || t("unknown_user")} · {formatWorklogDuration(worklog.duration)}
            </p>
            <p className="text-12 text-tertiary">{renderFormattedDate(worklog.logged_at)}</p>
            {worklog.description ? <p className="mt-1 text-13 text-secondary">{worklog.description}</p> : null}
          </div>
          {canManage(worklog) && !disabled && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded p-1 text-tertiary hover:bg-layer-1 hover:text-primary"
                onClick={() => onEdit(worklog)}
                aria-label={t("common.actions.edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="rounded p-1 text-tertiary hover:bg-layer-1 hover:text-danger-primary"
                onClick={() => onDelete(worklog)}
                aria-label={t("common.actions.delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
