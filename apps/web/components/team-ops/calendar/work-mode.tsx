/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Badge } from "@makeplane/propel/components/badge";
import type { BadgeVariant } from "@makeplane/propel/components/badge";
import { WORK_MODE_LABELS } from "@plane/services";
import type { TCalendarDay, TCalendarKind, TWorkMode } from "@plane/types";

/** The categories a day can fall in for display: the four modes plus holidays and unplanned working days. */
export type TDayKind = TCalendarKind;

type TKindMeta = {
  label: string;
  badge: BadgeVariant;
  /** Colour of the small dot used in legends and compact lists. */
  dot: string;
  /** Background of a calendar cell holding this kind of day. */
  cell: string;
};

export const DAY_KIND_META: Record<TDayKind, TKindMeta> = {
  ONSITE: { label: WORK_MODE_LABELS.ONSITE, badge: "info", dot: "bg-accent-primary", cell: "bg-accent-subtle" },
  REMOTE: { label: WORK_MODE_LABELS.REMOTE, badge: "success", dot: "bg-success-primary", cell: "bg-success-subtle" },
  OFF: { label: WORK_MODE_LABELS.OFF, badge: "neutral", dot: "bg-icon-placeholder", cell: "bg-layer-2" },
  LEAVE: { label: WORK_MODE_LABELS.LEAVE, badge: "warning", dot: "bg-warning-primary", cell: "bg-warning-subtle" },
  HOLIDAY: { label: "Holiday", badge: "purple", dot: "bg-plans-brand-solid", cell: "bg-layer-2" },
  UNPLANNED: { label: "Not planned", badge: "danger", dot: "bg-danger-primary", cell: "bg-surface-1" },
};

export const WORK_MODES: TWorkMode[] = ["ONSITE", "REMOTE", "OFF", "LEAVE"];

/** What a resolved day shows as: its mode, a holiday, an unplanned working day, or nothing. */
export const getDayKind = (day: TCalendarDay): TDayKind | null => {
  if (day.mode) return day.mode;
  if (day.source === "HOLIDAY") return "HOLIDAY";
  if (day.is_unplanned) return "UNPLANNED";
  return null;
};

type Props = {
  kind: TDayKind;
  label?: string;
};

export function DayKindBadge({ kind, label }: Props) {
  const meta = DAY_KIND_META[kind];
  return <Badge variant={meta.badge} size="sm" label={label ?? meta.label} />;
}

export function DayKindDot({ kind }: { kind: TDayKind }) {
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${DAY_KIND_META[kind].dot}`} />;
}
