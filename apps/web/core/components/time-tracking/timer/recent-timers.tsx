/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Play } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TTimeEntry } from "@plane/types";
// hooks
import { useTimeEntries } from "@/hooks/time-tracking/use-time-entries";
// local imports
import { getEntryTitle } from "../helpers";

const RECENT_LIMIT = 5;

type Props = {
  workspaceSlug: string;
  userId: string;
  /** only offer what the user can still log on */
  canLog: (projectId: string) => boolean;
  onSelect: (entry: TTimeEntry) => void;
};

/** Up to 5 distinct (project, work item, description) combinations from the user's last 30 entries. */
export const RecentTimers = observer(function RecentTimers(props: Props) {
  const { workspaceSlug, userId, canLog, onSelect } = props;
  const { t } = useTranslation();
  const filters = useMemo(() => ({ user_ids: [userId], order_by: "-created_at" as const }), [userId]);
  const { entries } = useTimeEntries(workspaceSlug, filters, { perPage: 30 });

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const result: TTimeEntry[] = [];
    for (const entry of entries) {
      const key = `${entry.project_id}|${entry.issue_id ?? ""}|${entry.description}`;
      if (entry.is_running || seen.has(key) || !canLog(entry.project_id) || entry.issue_detail?.is_archived) continue;
      seen.add(key);
      result.push(entry);
      if (result.length === RECENT_LIMIT) break;
    }
    return result;
  }, [entries, canLog]);

  if (!recent.length) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-11 font-medium text-tertiary uppercase">{t("time-tracking.timer.recent")}</span>
      {recent.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onSelect(entry)}
          className="group flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left text-13 hover:bg-layer-transparent-hover"
        >
          <Play className="size-3 flex-shrink-0 text-tertiary group-hover:text-accent-primary" />
          <span className="min-w-0 flex-1 truncate text-secondary">
            {getEntryTitle(entry)}
            {entry.description && <span className="text-tertiary"> · {entry.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
});
