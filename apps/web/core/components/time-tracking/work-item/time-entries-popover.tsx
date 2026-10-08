/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TWorkItemTime } from "@plane/types";
import { Avatar } from "@plane/ui";
import { formatTimeDuration, getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useTimer } from "@/hooks/store/use-timer";
// local imports
import { ElapsedTime } from "../timer/elapsed-time";

const RECENT_LIMIT = 10;

type Props = {
  workspaceSlug: string;
  issueId: string;
  workItemTime: TWorkItemTime;
  onNavigate?: () => void;
};

/** Who logged how much on a work item, its latest entries and anyone running a timer on it. */
export const WorkItemTimeEntriesPopover = observer(function WorkItemTimeEntriesPopover(props: Props) {
  const { workspaceSlug, issueId, workItemTime, onNavigate } = props;
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  const { clockOffsetMs, openLogTimeModal } = useTimer();

  const person = (userId: string) => {
    const user = getUserDetails(userId);
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar name={user?.display_name} src={getFileURL(user?.avatar_url ?? "")} size="sm" />
        <span className="truncate">{user?.display_name}</span>
      </span>
    );
  };

  const completed = workItemTime.entries.filter((entry) => !entry.is_running).slice(0, RECENT_LIMIT);

  return (
    <div className="flex w-80 flex-col gap-3 text-13">
      {workItemTime.running.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h4 className="text-11 font-medium text-tertiary uppercase">{t("time-tracking.work_item.running_now")}</h4>
          {workItemTime.running.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-2 text-secondary">
              {person(entry.user_id)}
              {entry.started_at && (
                <ElapsedTime
                  startedAt={entry.started_at}
                  clockOffsetMs={clockOffsetMs}
                  className="text-accent-primary"
                />
              )}
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-1.5">
        <h4 className="text-11 font-medium text-tertiary uppercase">{t("time-tracking.work_item.by_person")}</h4>
        {workItemTime.by_user.length === 0 && <p className="text-tertiary">{t("time-tracking.work_item.no_time")}</p>}
        {workItemTime.by_user.map((row) => (
          <div key={row.user_id} className="flex items-center justify-between gap-2 text-secondary">
            {person(row.user_id)}
            <span className="tabular-nums">{formatTimeDuration(row.total_seconds)}</span>
          </div>
        ))}
      </section>

      {completed.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="text-11 font-medium text-tertiary uppercase">{t("time-tracking.work_item.recent_entries")}</h4>
          {completed.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => openLogTimeModal({ entry })}
              className="flex w-full items-center gap-2 rounded-sm px-1 py-1 text-left hover:bg-layer-transparent-hover"
            >
              <span className="w-24 flex-shrink-0 truncate text-secondary">
                {getUserDetails(entry.user_id)?.display_name}
              </span>
              <span className="w-14 flex-shrink-0 text-tertiary">{renderFormattedDate(entry.spent_on, "MMM d")}</span>
              <span className="min-w-0 flex-1 truncate text-tertiary">{entry.description}</span>
              <span className="flex-shrink-0 text-secondary tabular-nums">
                {formatTimeDuration(entry.duration_seconds)}
              </span>
            </button>
          ))}
        </section>
      )}

      <Link
        href={`/${workspaceSlug}/time-tracking/entries/?issue_ids=${issueId}&date_preset=all_time`}
        onClick={onNavigate}
        className="self-start text-accent-primary hover:underline"
      >
        {t("time-tracking.work_item.view_all")}
      </Link>
    </div>
  );
});
