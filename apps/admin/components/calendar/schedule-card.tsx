/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useNavigate } from "react-router";
import { CheckCircle } from "lucide-react";
import { Card, ECardVariant, ECardSpacing } from "@plane/propel/card";
import type { IWorkSchedule } from "@plane/types";

type Props = {
  schedule: IWorkSchedule;
};

// Ordered Mon=0..Sun=6 — index matches backend week_pattern boolean array
const WEEKDAY_BADGE_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const ScheduleCard = observer(function ScheduleCard({ schedule }: Props) {
  const navigate = useNavigate();

  return (
    <Card
      variant={ECardVariant.WITH_SHADOW}
      spacing={ECardSpacing.SM}
      className="cursor-pointer hover:border-accent-strong transition-colors"
      onClick={() => void navigate(`/calendar/${schedule.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body-sm-semibold text-primary truncate">{schedule.name}</span>
            {schedule.is_default && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-caption-sm-medium bg-accent-subtle text-accent-primary shrink-0">
                <CheckCircle className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
          <p className="text-caption-sm-regular text-secondary">
            {schedule.timezone} · {schedule.country_code}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-1 flex-wrap">
        {WEEKDAY_BADGE_LABELS.map((label, index) => {
          // week_pattern is boolean[7]: index 0=Mon … 6=Sun
          const active = Boolean(schedule.week_pattern[index]);
          return (
            <span
              key={index}
              className={`px-2 py-0.5 rounded text-caption-sm-medium border ${
                active
                  ? "bg-accent-subtle text-accent-primary border-accent-strong"
                  : "bg-surface-2 text-tertiary border-subtle"
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </Card>
  );
});
