/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Daily work logs.
 *
 * One editor for today (or any past day), a history of the ones already filed,
 * and — for anybody who can see it — the list of who has not filed. The editor
 * saves a draft as you go and "submit" is a separate act, because a half-written
 * log that vanishes on a closed tab is a log nobody writes twice.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Check, LoaderCircle } from "lucide-react";
// workspaces imports
import { Button } from "@workspaces/propel/button";
import { setToast, TOAST_TYPE } from "@workspaces/propel/toast";
import { cn } from "@workspaces/utils";
// services
import { operationsService, type TWorkLog, type TWorkLogPayload } from "@/services/operations";
// local imports
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Pill,
  Section,
  StatTile,
  TileGrid,
  daysAgo,
  formatDate,
  toISODate,
} from "./common";
import { OperationsMember } from "./member";

/** How long the editor waits after the last keystroke before saving the draft. */
const AUTOSAVE_DELAY_MS = 1200;

/**
 * A copy of `days` with the most recent first.
 *
 * `toReversed` would say this in one word, but the web app's tsconfig targets
 * ES2022 and does not have it — hence the copy-then-reverse.
 */
const newestFirst = <T,>(days: T[]): T[] => days.slice().reverse();

type FieldKey = Exclude<keyof TWorkLogPayload, "project" | "date" | "time_spent" | "issue_ids">;

const FIELDS: { key: FieldKey; label: string; placeholder: string; rows: number }[] = [
  { key: "summary", label: "Summary", placeholder: "One or two lines on the day.", rows: 2 },
  { key: "worked_on", label: "Worked on", placeholder: "What you actually built or fixed.", rows: 3 },
  { key: "meetings", label: "Meetings", placeholder: "Stand-up, planning, a call with the client.", rows: 2 },
  { key: "research", label: "Research", placeholder: "Reading, spikes, things you had to find out.", rows: 2 },
  {
    key: "production_support",
    label: "Production support",
    placeholder: "Incidents, escalations, anything on-call.",
    rows: 2,
  },
  { key: "deployment", label: "Deployment", placeholder: "What you released, and where.", rows: 2 },
  { key: "blockers", label: "Blockers", placeholder: "What is in your way. Be specific.", rows: 2 },
  { key: "tomorrow_plan", label: "Tomorrow", placeholder: "What you intend to pick up next.", rows: 2 },
];

type EditorProps = { workspaceSlug: string };

export const WorkLogEditor = observer(function WorkLogEditor({ workspaceSlug }: EditorProps) {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [draft, setDraft] = useState<TWorkLogPayload>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: workLog,
    error,
    isLoading,
    mutate,
  } = useSWR<TWorkLog>(
    workspaceSlug ? ["operations-my-work-log", workspaceSlug, date] : null,
    () => operationsService.getMyWorkLog(workspaceSlug, date),
    { revalidateOnFocus: false }
  );

  // Reset the editor whenever a different day is loaded. Without this, moving
  // from today to yesterday would show yesterday's row under today's edits.
  useEffect(() => {
    setDraft({});
    setSavedAt(null);
  }, [date]);

  const value = useCallback(
    (key: FieldKey): string => (draft[key] as string | undefined) ?? (workLog?.[key] as string | undefined) ?? "",
    [draft, workLog]
  );

  const timeSpent = draft.time_spent ?? workLog?.time_spent ?? "0";

  const persist = useCallback(
    async (payload: TWorkLogPayload) => {
      if (!workLog) return;
      setIsSaving(true);
      try {
        const updated = await operationsService.updateWorkLog(workspaceSlug, workLog.id, payload);
        await mutate(updated, { revalidate: false });
        setDraft({});
        setSavedAt(Date.now());
      } catch {
        setToast({ type: TOAST_TYPE.ERROR, title: "Could not save", message: "Your work log was not saved." });
      } finally {
        setIsSaving(false);
      }
    },
    [mutate, workLog, workspaceSlug]
  );

  const queueSave = useCallback(
    (next: TWorkLogPayload) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void persist(next), AUTOSAVE_DELAY_MS);
    },
    [persist]
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const onChange = (key: FieldKey | "time_spent", nextValue: string) => {
    const next = { ...draft, [key]: nextValue };
    setDraft(next);
    queueSave(next);
  };

  const onSubmit = async () => {
    if (!workLog) return;
    setIsSubmitting(true);
    try {
      // Flush whatever is still pending first: submitting a log that has not
      // saved its last paragraph is the one failure mode people never forgive.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (Object.keys(draft).length > 0) await persist(draft);

      const updated = await operationsService.submitWorkLog(workspaceSlug, workLog.id, !!workLog.submitted_at);
      await mutate(updated, { revalidate: false });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: workLog.submitted_at ? "Reopened" : "Filed",
        message: workLog.submitted_at ? "Your work log is editable again." : "Your work log has been filed.",
      });
    } catch (submitError) {
      const message =
        (submitError as { error?: string })?.error ?? "Add a summary or what you worked on before submitting.";
      setToast({ type: TOAST_TYPE.ERROR, title: "Not filed", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingPanel label="Opening your work log" />;
  if (error || !workLog) return <ErrorPanel label="Could not open your work log." />;

  const isFiled = !!workLog.submitted_at;

  return (
    <Section
      title="Your work log"
      description={isFiled ? `Filed ${formatDate(workLog.submitted_at)}` : "Saved as you type"}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="date"
            value={date}
            max={toISODate(new Date())}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-md border border-subtle bg-layer-1 px-2 py-1 text-13 text-secondary"
            aria-label="Work log date"
          />
          <Button variant={isFiled ? "secondary" : "primary"} size="lg" onClick={onSubmit} loading={isSubmitting}>
            {isFiled ? "Reopen" : "File it"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="text-13 text-secondary" htmlFor="work-log-hours">
            Hours
          </label>
          <input
            id="work-log-hours"
            type="number"
            min={0}
            max={24}
            step={0.25}
            value={String(timeSpent)}
            disabled={isFiled}
            onChange={(event) => onChange("time_spent", event.target.value)}
            className="w-24 rounded-md border border-subtle bg-layer-1 px-2 py-1 text-13 text-primary disabled:text-placeholder"
          />
          <span
            className={cn(
              "flex items-center gap-1 text-11",
              isSaving ? "text-tertiary" : savedAt ? "text-success-primary" : "text-placeholder"
            )}
            aria-live="polite"
          >
            {isSaving ? (
              <>
                <LoaderCircle className="size-3 animate-spin" /> Saving
              </>
            ) : savedAt ? (
              <>
                <Check className="size-3" /> Saved
              </>
            ) : null}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className={field.key === "summary" ? "md:col-span-2" : undefined}>
              <label
                className="mb-1 block text-11 font-medium tracking-wide text-tertiary uppercase"
                htmlFor={`work-log-${field.key}`}
              >
                {field.label}
              </label>
              <textarea
                id={`work-log-${field.key}`}
                rows={field.rows}
                value={value(field.key)}
                disabled={isFiled}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
                className="w-full resize-y rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 text-primary placeholder:text-placeholder disabled:text-secondary"
              />
            </div>
          ))}
        </div>

        {workLog.issues.length > 0 && (
          <div>
            <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Linked work items</p>
            <ul className="flex flex-wrap gap-2">
              {workLog.issues.map((issue) => (
                <li key={issue.id}>
                  <Link
                    href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
                    className="hover:underline"
                  >
                    <Pill>{issue.name}</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
});

/** The logs this person has already filed. */
export const WorkLogHistory = observer(function WorkLogHistory({ workspaceSlug }: { workspaceSlug: string }) {
  const { data, error, isLoading } = useSWR(
    workspaceSlug ? ["operations-work-logs-mine", workspaceSlug] : null,
    () => operationsService.getWorkLogs(workspaceSlug, { start_date: daysAgo(30), submitted: "true" }),
    { revalidateOnFocus: false }
  );

  const totals = useMemo(() => {
    const logs = data?.results ?? [];
    return {
      filed: logs.length,
      hours: logs.reduce((sum, log) => sum + Number(log.time_spent ?? 0), 0),
    };
  }, [data]);

  if (isLoading) return <LoadingPanel />;
  if (error) return <ErrorPanel />;

  return (
    <Section title="Your last 30 days" description={`${totals.filed} filed, ${totals.hours.toFixed(2)} hours logged`}>
      {(data?.results.length ?? 0) === 0 ? (
        <EmptyPanel label="Nothing filed in the last 30 days" />
      ) : (
        <ul>
          {data?.results.map((log) => (
            <li key={log.id} className="border-b border-subtle py-2.5 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-13 font-medium text-primary">{formatDate(log.date)}</span>
                <span className="text-11 text-placeholder">{Number(log.time_spent).toFixed(2)}h</span>
              </div>
              {log.summary && <p className="mt-1 text-13 text-secondary">{log.summary}</p>}
              {log.blockers && <p className="mt-1 text-11 text-danger-primary">Blocked: {log.blockers}</p>}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
});

/** Who has not filed, over the last working week. */
export const MissingWorkLogs = observer(function MissingWorkLogs({ workspaceSlug }: { workspaceSlug: string }) {
  const { data, error, isLoading } = useSWR(
    workspaceSlug ? ["operations-missing-work-logs", workspaceSlug] : null,
    () =>
      operationsService.getMissingWorkLogs(workspaceSlug, { start_date: daysAgo(6), end_date: toISODate(new Date()) }),
    { revalidateOnFocus: false }
  );

  if (isLoading) return <LoadingPanel />;
  if (error) return <ErrorPanel />;
  if (!data) return null;

  const totalMissing = data.days.reduce((sum, day) => sum + day.missing.length, 0);

  return (
    <Section title="Missing work logs" description={`${data.member_count} members · last 7 days`}>
      <div className="flex flex-col gap-4">
        <TileGrid className="xl:grid-cols-3">
          <StatTile label="Working days" value={data.days.length} />
          <StatTile label="Missing entries" value={totalMissing} tone={totalMissing > 0 ? "warning" : "positive"} />
          <StatTile
            label="Completion"
            value={
              data.days.length * data.member_count === 0
                ? "--"
                : `${Math.round((1 - totalMissing / (data.days.length * data.member_count)) * 100)}%`
            }
          />
        </TileGrid>

        {data.days.length === 0 ? (
          <EmptyPanel label="No working days in this window" />
        ) : (
          <ul className="flex flex-col gap-3">
            {newestFirst(data.days).map((day) => (
              <li key={day.date}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-13 font-medium text-primary">{formatDate(day.date)}</span>
                  <span className="text-11 text-placeholder">
                    {day.missing.length === 0 ? "everyone filed" : `${day.missing.length} missing`}
                  </span>
                </div>
                {day.missing.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {day.missing.map((member) => (
                      <li
                        key={member.member_id}
                        className="flex items-center gap-1.5 rounded-full border border-subtle px-2 py-1"
                      >
                        <OperationsMember
                          memberId={member.member_id}
                          fallbackName={member.display_name}
                          fallbackAvatarUrl={member.avatar_url}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
});
