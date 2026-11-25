/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TMeetingPayload } from "@plane/types";
// local imports
import { fromLocal, toLocal } from "./time";
import { useReaderTimezone } from "./use-reader-timezone";

type Props = {
  value: TMeetingPayload;
  onChange: (value: Pick<TMeetingPayload, "start_at" | "end_at">) => void;
  disabled?: boolean;
};

const HOUR = 3_600_000;

/** Start and end in the timezone of the reader, named next to them. */
export const MeetingTimeFields = observer(function MeetingTimeFields(props: Props) {
  const { value, onChange, disabled } = props;
  const { t } = useTranslation();
  const timeZone = useReaderTimezone();
  const { start_at, end_at } = value;

  const handleStart = (local: string) => {
    const start = fromLocal(local, timeZone);
    if (!start) return;
    // the meeting moves as a whole
    const length = start_at && end_at ? Date.parse(end_at) - Date.parse(start_at) : HOUR;
    onChange({ start_at: start, end_at: new Date(Date.parse(start) + Math.max(length, 60_000)).toISOString() });
  };

  const handleEnd = (local: string) => {
    const end = fromLocal(local, timeZone);
    if (end) onChange({ start_at, end_at: end });
  };

  const inputClassName =
    "h-7 rounded-md border border-strong bg-layer-2 px-2 text-body-xs-regular text-primary disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        aria-label={t("meeting.start")}
        className={inputClassName}
        value={start_at ? toLocal(start_at, timeZone) : ""}
        disabled={disabled}
        onChange={(event) => handleStart(event.target.value)}
      />
      <span aria-hidden>–</span>
      <input
        type="datetime-local"
        aria-label={t("meeting.end")}
        className={inputClassName}
        value={end_at ? toLocal(end_at, timeZone) : ""}
        min={start_at ? toLocal(start_at, timeZone) : undefined}
        disabled={disabled}
        onChange={(event) => handleEnd(event.target.value)}
      />
      <span className="text-caption-md-regular text-tertiary">{timeZone}</span>
    </div>
  );
});
