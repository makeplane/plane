/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: one action in a list (a heatmap quarter or the work log): time, person, kind, the
// object it changed and, for log entries, the text with edit/delete for the author and project admins.

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
import { ACTIVITY_LOG_SOURCE } from "./types";
import type { TActivityEvent } from "./types";

type Props = {
  event: TActivityEvent;
  workspaceSlug: string;
  projectId: string;
  // 24-hour clock in the time zone of the view
  time: Intl.DateTimeFormat;
  // Width class of the time column, the same for all rows of a list
  timeWidth: string;
  canChange: (event: TActivityEvent) => boolean;
  onEdit: (event: TActivityEvent) => void;
  onDelete: (event: TActivityEvent) => void;
  hideKind?: boolean;
  className?: string;
};

const OBJECT_PATHS: Record<string, string> = { cycle: "cycles", module: "modules", view: "views" };

function eventTarget(event: TActivityEvent, workspaceSlug: string, projectId: string) {
  if (event.issue) {
    const label = [event.issue.identifier, event.issue.name].filter(Boolean).join(" ");
    const href = event.issue.identifier ? `/${workspaceSlug}/browse/${event.issue.identifier}/` : null;
    return { label, href, deleted: event.issue.deleted };
  }
  if (event.page) {
    return {
      label: event.page.name,
      href: `/${workspaceSlug}/projects/${projectId}/pages/${event.page.id}`,
      deleted: event.page.deleted,
    };
  }
  if (event.object) {
    const path = OBJECT_PATHS[event.source];
    return {
      label: event.object.name,
      href: path ? `/${workspaceSlug}/projects/${projectId}/${path}/${event.object.id}` : null,
      deleted: event.object.deleted,
    };
  }
  return null;
}

export function ActivityEventRow(props: Props) {
  const { event, workspaceSlug, projectId, time, timeWidth, canChange, onEdit, onDelete, hideKind, className } = props;
  const { t } = useTranslation();
  const target = eventTarget(event, workspaceSlug, projectId);

  return (
    <li className={cn("flex flex-col gap-1 text-13", className)}>
      <div className="flex items-center gap-2">
        <span className={cn("shrink-0 text-tertiary", timeWidth)}>
          {time.format(new Date(event.occurred_at))}
          {event.ended_at && `–${time.format(new Date(event.ended_at))}`}
        </span>
        {event.actor ? (
          <Avatar name={event.actor.display_name} src={getFileURL(event.actor.avatar_url ?? "")} size="sm" />
        ) : null}
        <span className="shrink-0 text-secondary">{event.actor?.display_name ?? "—"}</span>
        {!hideKind && <span className="shrink-0 text-primary">{t(`liviere.activity.kinds.${event.kind}`)}</span>}
        {target && (
          <span className="min-w-0 truncate text-tertiary">
            {target.href && !target.deleted ? (
              <Link href={target.href} className="hover:text-primary hover:underline">
                {target.label || t("liviere.activity.untitled")}
              </Link>
            ) : (
              <span className="line-through">{target.label || t("liviere.activity.deleted")}</span>
            )}
          </span>
        )}
        {event.source === ACTIVITY_LOG_SOURCE && canChange(event) && (
          <span className="ml-auto flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onEdit(event)}
              aria-label={t("edit")}
              className="rounded-sm p-1 text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(event)}
              aria-label={t("delete")}
              className="rounded-sm p-1 text-tertiary hover:bg-layer-transparent-hover hover:text-danger-primary"
            >
              <Trash2 className="size-3.5" />
            </button>
          </span>
        )}
      </div>
      {event.note && (
        <div className="flex gap-2">
          <span className={cn("shrink-0", timeWidth)} />
          <p className="min-w-0 border-l-2 border-subtle pl-3 break-words whitespace-pre-wrap text-secondary">
            {event.note}
          </p>
        </div>
      )}
    </li>
  );
}
