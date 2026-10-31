/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { DeleteOutline, EditOutline } from "@makeplane/propel/icons";
import { formatDuration } from "@plane/services";
import { useTranslation } from "@plane/i18n";
import type { TTimeEntry } from "@plane/types";

type Props = {
  workspaceSlug: string;
  entries: TTimeEntry[];
  onEdit: (entry: TTimeEntry) => void;
  onDelete: (entry: TTimeEntry) => void;
};

export function TimeEntriesList(props: Props) {
  const { workspaceSlug, entries, onEdit, onDelete } = props;
  // hooks
  const { t, currentLocale } = useTranslation();

  if (entries.length === 0) {
    return <p className="py-8 text-center text-body-sm-medium text-tertiary">{t("team_ops.entries.empty")}</p>;
  }

  const dateFormat = new Intl.DateTimeFormat(currentLocale, { weekday: "short", day: "numeric", month: "short" });
  const timeFormat = new Intl.DateTimeFormat(currentLocale, { hour: "2-digit", minute: "2-digit" });

  return (
    <ul className="divide-y divide-subtle rounded-lg border border-subtle bg-surface-1">
      {entries.map((entry) => {
        const started = new Date(entry.started_at);
        const issue = entry.issue_detail;
        const issueKey = issue ? `${issue.project_identifier}-${issue.sequence_id}` : null;

        return (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-28 shrink-0">
              <p className="text-body-sm-medium text-primary">{dateFormat.format(started)}</p>
              <p className="text-caption-sm-regular text-tertiary">{timeFormat.format(started)}</p>
            </div>
            <div className="min-w-0 grow">
              {issue && issueKey ? (
                <Link
                  href={`/${workspaceSlug}/browse/${issueKey}/`}
                  className="block truncate text-body-sm-medium text-primary hover:underline"
                >
                  <span className="text-tertiary">{issueKey}</span> {issue.name}
                </Link>
              ) : null}
              {entry.note ? <p className="truncate text-caption-sm-regular text-secondary">{entry.note}</p> : null}
              <p className="text-caption-sm-regular text-tertiary">
                {entry.source === "timer" ? t("team_ops.entries.source_timer") : t("team_ops.entries.source_manual")}
                {entry.is_billable ? ` · ${t("team_ops.form.billable")}` : null}
              </p>
            </div>
            <span className="shrink-0 text-body-sm-medium text-primary tabular-nums">
              {formatDuration(entry.duration_seconds, currentLocale)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                icon={<Icon icon={EditOutline} />}
                variant="ghost"
                size="sm"
                aria-label={t("team_ops.entries.edit")}
                onClick={() => onEdit(entry)}
              />
              <IconButton
                icon={<Icon icon={DeleteOutline} />}
                variant="ghost"
                size="sm"
                aria-label={t("team_ops.entries.delete")}
                onClick={() => onDelete(entry)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
