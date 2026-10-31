/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { InputField } from "@makeplane/propel/components/input-field";
import { PlayOutline, StopOutline } from "@makeplane/propel/icons";
import { formatClock } from "@plane/services";
import { useTranslation } from "@plane/i18n";
import type { TActiveTimer, TTimerStartPayload } from "@plane/types";
// local imports
import type { TPickedWorkItem } from "./work-item-picker";
import { WorkItemPicker } from "./work-item-picker";

type Props = {
  workspaceSlug: string;
  timer: TActiveTimer | null;
  onStart: (payload: TTimerStartPayload) => Promise<void>;
  onStop: () => Promise<void>;
};

/** Seconds on a running timer, counted from the server's elapsed value so a wrong client clock cannot skew it. */
const useElapsedSeconds = (timer: TActiveTimer | null) => {
  const loadedAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadedAt.current = Date.now();
    setNow(Date.now());
    if (!timer) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  if (!timer) return 0;
  return timer.elapsed_seconds + Math.max(0, Math.floor((now - loadedAt.current) / 1000));
};

export function TimerCard(props: Props) {
  const { workspaceSlug, timer, onStart, onStop } = props;
  // states
  const [note, setNote] = useState("");
  const [workItem, setWorkItem] = useState<TPickedWorkItem | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // hooks
  const { t } = useTranslation();
  const elapsed = useElapsedSeconds(timer);

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await action();
    } finally {
      setIsBusy(false);
    }
  };

  const handleStart = () =>
    run(async () => {
      await onStart({ issue: workItem?.id ?? null, note: note.trim() });
      setNote("");
      setWorkItem(null);
    });

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-h5-medium text-primary">{t("team_ops.timer.title")}</h2>
        {timer && <span className="text-caption-sm-regular text-tertiary">{t("team_ops.timer.running")}</span>}
      </div>

      {timer ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-24 font-semibold text-primary tabular-nums" aria-live="off">
              {formatClock(elapsed)}
            </p>
            <p className="truncate text-body-sm-medium text-secondary">
              {timer.issue_detail
                ? `${timer.issue_detail.project_identifier}-${timer.issue_detail.sequence_id} ${timer.issue_detail.name}`
                : null}
              {timer.note ? ` ${timer.note}` : null}
            </p>
          </div>
          <Button
            variant="danger"
            size="md"
            stretch="auto"
            icon={<Icon icon={StopOutline} />}
            label={t("team_ops.timer.stop")}
            loading={isBusy}
            onClick={() => run(onStop)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm-medium text-tertiary">{t("team_ops.timer.idle")}</p>
          <WorkItemPicker workspaceSlug={workspaceSlug} value={workItem} onChange={setWorkItem} disabled={isBusy} />
          <InputField
            type="text"
            size="lg"
            orientation="vertical"
            value={note}
            maxLength={5000}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("team_ops.timer.note_placeholder")}
            aria-label={t("team_ops.timer.note_placeholder")}
            disabled={isBusy}
          />
          <div>
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              icon={<Icon icon={PlayOutline} />}
              label={t("team_ops.timer.start")}
              loading={isBusy}
              onClick={handleStart}
            />
          </div>
        </div>
      )}
    </section>
  );
}
