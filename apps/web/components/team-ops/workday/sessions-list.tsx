/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Badge } from "@makeplane/propel/components/badge";
import { formatDuration } from "@plane/services";
import type { TWorkSession } from "@plane/types";

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" });

type Props = { sessions: TWorkSession[]; showDay?: boolean };

/** What was finished, with whether it has a document and whether others were asked to look at it. */
export function SessionsList({ sessions, showDay }: Props) {
  if (sessions.length === 0) {
    return <p className="text-body-sm-regular text-tertiary">Nothing finished yet.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-subtle rounded-lg border border-subtle bg-surface-1">
      {sessions.map((session) => (
        <li key={session.id} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-body-sm-medium text-primary">
              <span className="text-tertiary">{session.work_item}</span> {session.work_item_name}
            </p>
            <p className="shrink-0 text-body-xs-regular text-tertiary tabular-nums">
              {showDay ? `${dayFormat.format(new Date(session.finished_at))} · ` : ""}
              {timeFormat.format(new Date(session.started_at))}–{timeFormat.format(new Date(session.finished_at))} ·{" "}
              {formatDuration(session.duration_seconds, "en-US")}
            </p>
          </div>
          <p className="text-body-sm-regular whitespace-pre-line text-secondary">{session.summary}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {session.files.length > 0 || session.document_text ? (
              <Badge
                variant="success"
                size="sm"
                label={session.files.length > 0 ? `Document · ${session.files.length} file(s)` : "Document"}
              />
            ) : (
              <Badge variant="neutral" size="sm" label="No document (confirmed)" />
            )}
            {session.needs_attention ? <Badge variant="warning" size="sm" label="Needs attention" /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
