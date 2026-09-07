/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Operations settings.
 *
 * Two things live here. The state mapping, which is what every dashboard and
 * metric is phrased in — "which of this workspace's states means QA?" — and the
 * bootstrap, which creates PROJECT.md's workflow in projects that do not have
 * it yet. Bootstrap is additive and safe to re-run; nothing it does deletes.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Check } from "lucide-react";
// workspaces imports
import { Button } from "@workspaces/propel/button";
import { setToast, TOAST_TYPE } from "@workspaces/propel/toast";
import { cn } from "@workspaces/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import { operationsService, type TOperationsConfig } from "@/services/operations";
// local imports
import { ErrorPanel, LoadingPanel, Pill, Section } from "./common";

const BUCKET_LABEL: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  ready_for_test: "Ready for test deployment",
  qa: "QA testing",
  ready_for_release: "Ready for release",
  deployed: "Deployed",
  blocked: "On hold",
  cancelled: "Cancelled",
  developer_owned: "Developer-owned (measured for productivity)",
};

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

export const OperationsSettings = observer(function OperationsSettings({ workspaceSlug }: { workspaceSlug: string }) {
  const { joinedProjectIds, getProjectById } = useProject();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? ["operations-settings", workspaceSlug] : null,
    () => operationsService.getSettings(workspaceSlug),
    { revalidateOnFocus: false }
  );

  // Edited as comma-separated text, because a bucket legitimately maps onto
  // several state names — projects that were set up by different people rarely
  // agree on one.
  useEffect(() => {
    if (!data) return;
    setMapping(
      Object.fromEntries(Object.entries(data.config.state_mapping).map(([bucket, names]) => [bucket, names.join(", ")]))
    );
    setWeekdays(data.config.work_log.required_weekdays);
  }, [data]);

  const save = async () => {
    setIsSaving(true);
    try {
      const stateMapping = Object.fromEntries(
        Object.entries(mapping).map(([bucket, value]) => [
          bucket,
          value
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean),
        ])
      );
      const config: Partial<TOperationsConfig> = {
        state_mapping: stateMapping,
        work_log: { ...(data?.config.work_log as TOperationsConfig["work_log"]), required_weekdays: weekdays },
      };
      await operationsService.updateSettings(workspaceSlug, config as Record<string, unknown>);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved", message: "Operations settings updated." });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Not saved", message: "Settings could not be saved." });
    } finally {
      setIsSaving(false);
    }
  };

  const bootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const result = await operationsService.bootstrap(workspaceSlug);
      const createdStates = result.projects.reduce((sum, project) => sum + project.states.created.length, 0);
      const createdLabels = result.projects.reduce((sum, project) => sum + project.labels.created.length, 0);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Workflow applied",
        message: `${createdStates} states and ${createdLabels} labels created across ${result.projects.length} projects.`,
      });
      await mutate();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Not applied", message: "The workflow could not be applied." });
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (isLoading) return <LoadingPanel />;
  if (error || !data) return <ErrorPanel />;

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="State mapping"
        description="Which of your states each dashboard bucket means. Comma-separated; matched by name, case-insensitively, across every project."
        action={
          <Button variant="primary" size="lg" onClick={save} loading={isSaving}>
            Save
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          {Object.keys(data.defaults.state_mapping).map((bucket) => (
            <label key={bucket} className="flex flex-col gap-1">
              <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
                {BUCKET_LABEL[bucket] ?? bucket}
              </span>
              <input
                value={mapping[bucket] ?? ""}
                onChange={(event) => setMapping((current) => ({ ...current, [bucket]: event.target.value }))}
                placeholder={data.defaults.state_mapping[bucket].join(", ")}
                className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-1.5 text-13 text-primary placeholder:text-placeholder"
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Work logs" description="Which days people are expected to file a log">
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const isOn = weekdays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() =>
                  setWeekdays((current) =>
                    // oxlint-disable-next-line unicorn/no-array-sort -- the spread already copied
                    isOn ? current.filter((value) => value !== day.value) : [...current, day.value].sort()
                  )
                }
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 text-11 font-medium transition-colors",
                  isOn ? "bg-accent-primary text-on-color" : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
                )}
              >
                {isOn && <Check className="size-3" />}
                {day.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-11 text-placeholder">
          Reminders fire after {data.config.work_log.reminder_hour}:00 local time on these days.
        </p>
      </Section>

      <Section
        title="Apply the engineering workflow"
        description="Creates the states, labels and work item types from PROJECT.md in every project you are a member of. Additive — nothing is deleted, and running it twice changes nothing."
        action={
          <Button variant="secondary" size="lg" onClick={bootstrap} loading={isBootstrapping}>
            Apply to {joinedProjectIds.length} projects
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">States</p>
            <ul className="flex flex-wrap gap-1.5">
              {data.workflow.states.map((state) => (
                <li key={state.name}>
                  <Pill>
                    <span
                      className="mr-1.5 inline-block size-2 rounded-full"
                      style={{ backgroundColor: state.color }}
                    />
                    {state.name}
                    <span className="ml-1.5 text-placeholder">{state.owner.replace(/_/g, " ")}</span>
                  </Pill>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Work item types</p>
            <ul className="flex flex-wrap gap-1.5">
              {data.workflow.issue_types.map((type) => (
                <li key={type.name}>
                  <Pill>
                    {type.name}
                    {!type.velocity && <span className="ml-1.5 text-placeholder">no velocity</span>}
                  </Pill>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Labels</p>
            <ul className="flex flex-wrap gap-1.5">
              {data.workflow.labels.map((label) => (
                <li key={label.name}>
                  <Pill>
                    <span
                      className="mr-1.5 inline-block size-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </Pill>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">
              Suggested modules (business domains)
            </p>
            <p className="text-13 text-secondary">{data.workflow.module_suggestions.join(" · ")}</p>
            <p className="mt-1 text-11 text-placeholder">
              Modules are created per project in the Workspaces module screen — they carry the business domain that
              module-based reporting groups by.
            </p>
          </div>

          <div>
            <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Transition ownership</p>
            <ul className="flex flex-col gap-1">
              {data.workflow.transitions.map((transition) => (
                <li key={`${transition.from}-${transition.to}`} className="text-13 text-secondary">
                  {transition.from} → {transition.to}
                  <span className="ml-2 text-11 text-placeholder">{transition.owner.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-11 text-placeholder">
            Projects in scope:{" "}
            {joinedProjectIds
              .map((id) => getProjectById(id)?.name)
              .filter(Boolean)
              .join(", ") || "none"}
          </p>
        </div>
      </Section>
    </div>
  );
});
