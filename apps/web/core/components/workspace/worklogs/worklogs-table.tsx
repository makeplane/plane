/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TWorkspaceTimeLog } from "@plane/types";
import { Avatar } from "@plane/ui";
import { getFileURL, renderFormattedDate } from "@plane/utils";
// components
import { formatDuration } from "@/components/issues/issue-detail/time-log/helper";

type Props = {
  workspaceSlug: string;
  logs: TWorkspaceTimeLog[];
};

export const WorklogsTable = ({ workspaceSlug, logs }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-scroll rounded-sm border-[0.5px] border-subtle bg-surface-1">
      <table className="min-w-full text-left">
        <thead className="text-caption-medium border-b border-subtle bg-surface-2 text-tertiary">
          <tr>
            <th className="px-4 py-3 font-medium">{t("date")}</th>
            <th className="px-4 py-3 font-medium">{t("common.member")}</th>
            <th className="px-4 py-3 font-medium">{t("common.project")}</th>
            <th className="px-4 py-3 font-medium">{t("common.work_item")}</th>
            <th className="px-4 py-3 font-medium">{t("common.duration")}</th>
            <th className="px-4 py-3 font-medium">{t("common.description")}</th>
          </tr>
        </thead>
        <tbody className="divide-y-[0.5px] divide-subtle">
          {logs.map((log) => {
            const loggedBy = log.logged_by_detail;
            const issue = log.issue_detail;
            return (
              <tr key={log.id} className="text-body-xs-regular text-secondary hover:bg-surface-2/40">
                <td className="px-4 py-3 whitespace-nowrap">
                  {log.logged_date ? renderFormattedDate(log.logged_date) : "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={loggedBy?.display_name ?? ""}
                      src={loggedBy?.avatar_url ? getFileURL(loggedBy.avatar_url) : undefined}
                      size={20}
                      shape="circle"
                    />
                    <span className="text-caption-medium">{loggedBy?.display_name ?? "-"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{log.project_detail?.name ?? "-"}</td>
                <td className="max-w-80 truncate px-4 py-3">
                  {issue ? (
                    <Link
                      href={`/${workspaceSlug}/projects/${log.project}/issues/${issue.id}`}
                      className="text-primary hover:underline"
                    >
                      {log.project_detail?.identifier ? `${log.project_detail.identifier}-${issue.sequence_id} ` : ""}
                      <span className="text-secondary">{issue.name}</span>
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap text-primary">
                  {formatDuration(log.duration_minutes)}
                </td>
                <td className="max-w-80 truncate px-4 py-3">{log.description || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
