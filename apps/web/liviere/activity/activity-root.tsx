/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the "Activity" page of a project. Rows are days (newest on top), columns are the
// 96 quarters of the day; the colour says how many actions happened in that quarter. Admins and members
// add log entries here (what they did, from when to when); agents do it through the API. The "Work log" view
// (?view=log) lists the entries by day instead of the grid; the "Report" view (?view=report, ?source=) counts
// the time of the period and downloads it as PDF, Markdown or CSV. Days and quarters are in the project's time
// zone; the period is in the URL (range.ts).

import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { Tab, Tabs, TabsList } from "@makeplane/propel/components/tabs";
import { AddOutline } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { DateRangeSelect } from "@plane/blocks/property-select";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn, getDate, renderFormattedPayloadDate } from "@plane/utils";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions, useUserProfile } from "@/hooks/store/user";
import { useQueryParams } from "@/hooks/use-query-params";
import { projectActivityService } from "./activity.service";
import { ActivityEventList } from "./activity-events";
import { ActivityGrid } from "./activity-grid";
import { ActivityLogList } from "./activity-log-list";
import { ActivityLogModal } from "./activity-log-modal";
import { ActivityReport } from "./activity-report";
import { MAX_RANGE_DAYS, RANGE_PRESETS, parseRange, rangeQueryChange, resolveRange, validCustomRange } from "./range";
import type { TRangeSelection } from "./range";
import { REPORT_SOURCES } from "./types";
import type { TActivityEvent, TReportSource } from "./types";
import { refreshProjectActivity, useActivityHeatmap, useCurrentQuarter } from "./use-activity";

const VIEW_PARAM = "view";
const LOG_VIEW = "log";
const REPORT_VIEW = "report";
const SOURCE_PARAM = "source";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export type TSelectedBucket = { date: string; slot: number };

export const ProjectActivityRoot = observer(function ProjectActivityRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t, currentLocale } = useTranslation();
  const { getProjectById } = useProject();
  const { data: userProfile } = useUserProfile();
  // Days and quarters in the project's time zone, as the API, reports and plane-log count them; the browser's
  // only until the project is loaded
  const browserTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const timeZone = getProjectById(projectId)?.timezone || browserTimeZone;
  const [actor, setActor] = useState<string | null>(null);
  const [selected, setSelected] = useState<TSelectedBucket | null>(null);
  // Log entry dialog: null closed, {} new entry, {entry} change
  const [logDialog, setLogDialog] = useState<{ entry?: TActivityEvent } | null>(null);
  const [deleting, setDeleting] = useState<TActivityEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Bumped after an entry changed: reloads the work log view
  const [logVersion, setLogVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateQueryParams } = useQueryParams();
  const viewParam = searchParams.get(VIEW_PARAM);
  const view = viewParam === LOG_VIEW || viewParam === REPORT_VIEW ? viewParam : "grid";
  const setView = (value: string) => {
    setSelected(null);
    router.replace(
      value === LOG_VIEW || value === REPORT_VIEW
        ? updateQueryParams({ paramsToAdd: { [VIEW_PARAM]: value } })
        : updateQueryParams({ paramsToRemove: [VIEW_PARAM] })
    );
  };
  const sourceParam = searchParams.get(SOURCE_PARAM);
  const reportSource: TReportSource = (REPORT_SOURCES as readonly string[]).includes(sourceParam ?? "")
    ? (sourceParam as TReportSource)
    : "mixed";
  const setReportSource = (value: TReportSource) =>
    router.replace(
      value === "mixed"
        ? updateQueryParams({ paramsToRemove: [SOURCE_PARAM] })
        : updateQueryParams({ paramsToAdd: { [SOURCE_PARAM]: value } })
    );
  const rangeSelection = parseRange(searchParams);
  const setRange = (selection: TRangeSelection) => {
    setSelected(null);
    router.replace(updateQueryParams(rangeQueryChange(selection)));
  };
  const entriesChanged = () => setLogVersion((current) => current + 1);
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
  const canChange = (event: TActivityEvent) => isAdmin || (!!currentUser && event.actor?.id === currentUser.id);

  const deleteEntry = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await projectActivityService.deleteLog(workspaceSlug, projectId, deleting.id);
      await refreshProjectActivity(projectId);
      entriesChanged();
      setDeleting(null);
    } catch {
      setToast({ type: "error", title: t("error"), message: t("liviere.activity.log.delete_error") });
    } finally {
      setIsDeleting(false);
    }
  };

  // Moves on every quarter, so the grid marks the current one and a new day appears after midnight
  const now = useCurrentQuarter(timeZone);
  const range = resolveRange(rangeSelection, now.date);
  const query = { from: range.from, to: range.to, tz: timeZone, actor };
  const { data: heatmap, error, isLoading } = useActivityHeatmap(workspaceSlug, projectId, query);

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col gap-5 overflow-y-auto px-6 py-5">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {/* Tabs and the member select fill their parent by default; here they are items of the toolbar */}
        <div className="w-fit">
          <Tabs value={view} variant="contained" stretch="auto" onValueChange={(value) => setView(String(value))}>
            <TabsList aria-label={t("liviere.activity.title")}>
              <Tab value="grid" label={t("liviere.activity.view_grid")} />
              <Tab value={LOG_VIEW} label={t("liviere.activity.view_log")} />
              <Tab value={REPORT_VIEW} label={t("liviere.activity.view_report")} />
            </TabsList>
          </Tabs>
        </div>
        <div className="flex overflow-hidden rounded-md border border-subtle">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRange({ preset })}
              className={cn(
                "px-3 py-1 text-13 text-secondary hover:bg-layer-transparent-hover",
                rangeSelection.preset === preset && "bg-layer-transparent-selected font-medium text-primary"
              )}
            >
              {t(`liviere.activity.ranges.${preset}`)}
            </button>
          ))}
        </div>
        <div className="w-fit">
          {/* Shows the dates of the chosen period; picking two days makes a custom range */}
          <DateRangeSelect
            variant="select-md"
            value={{ from: getDate(range.from) ?? null, to: getDate(range.to) ?? null }}
            onChange={(value) => {
              const custom = validCustomRange(
                renderFormattedPayloadDate(value.from) ?? null,
                renderFormattedPayloadDate(value.to) ?? null
              );
              if (custom) setRange({ preset: null, ...custom });
              else if (value.from && value.to)
                setToast({
                  type: "error",
                  title: t("error"),
                  message: t("liviere.activity.range_too_long", { days: MAX_RANGE_DAYS }),
                });
            }}
            maxDate={getDate(now.date)}
            mergeDates
            weekStartsOn={userProfile?.start_of_the_week}
            isActive={!rangeSelection.preset || undefined}
            tooltipHeading={t("liviere.activity.range_custom")}
            showTooltip
          />
        </div>
        <div className="w-56">
          <MemberSelect
            projectId={projectId}
            value={actor}
            // The clear row emits "", which means all members
            onChange={(value: string) => {
              setActor(value || null);
              setSelected(null);
            }}
            variant="select-md"
            placeholder={t("liviere.activity.all_members")}
            clearable
            clearLabel={t("liviere.activity.all_members")}
          />
        </div>
        {actor && (
          <button
            type="button"
            className="text-13 text-tertiary underline-offset-2 hover:underline"
            onClick={() => {
              setActor(null);
              setSelected(null);
            }}
          >
            {t("liviere.activity.all_members")}
          </button>
        )}
        <div className="ml-auto">
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            icon={<Icon icon={AddOutline} />}
            label={t("liviere.activity.log.add")}
            onClick={() => setLogDialog({})}
          />
        </div>
        {view === "grid" && heatmap && (
          <span className="text-13 text-secondary">
            {t("liviere.activity.summary", {
              active: heatmap.summary.active_buckets,
              hours: heatmap.summary.active_hours.toLocaleString(currentLocale, { maximumFractionDigits: 2 }),
              events: heatmap.summary.events,
            })}
          </span>
        )}
      </div>

      {view === REPORT_VIEW ? (
        <ActivityReport
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          query={query}
          locale={currentLocale}
          source={reportSource}
          onSourceChange={setReportSource}
        />
      ) : view === LOG_VIEW ? (
        <ActivityLogList
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          query={query}
          locale={currentLocale}
          containerRef={containerRef}
          version={logVersion}
          canAdd
          onAdd={() => setLogDialog({})}
          canChange={canChange}
          onEdit={(entry) => setLogDialog({ entry })}
          onDelete={setDeleting}
        />
      ) : (
        <>
          {error ? (
            <p className="text-13 text-danger-primary">{t("liviere.activity.load_error")}</p>
          ) : isLoading && !heatmap ? (
            <Loader className="flex flex-col gap-1">
              {Array.from({ length: 7 }, (_, index) => (
                <Loader.Item key={index} height="12px" width="100%" />
              ))}
            </Loader>
          ) : heatmap ? (
            <ActivityGrid
              heatmap={heatmap}
              locale={currentLocale}
              now={now}
              selected={selected}
              onSelect={setSelected}
            />
          ) : null}

          <p className="text-12 text-tertiary">{t("liviere.activity.footnote", { timezone: timeZone })}</p>

          {selected && (
            <ActivityEventList
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              query={query}
              selected={selected}
              locale={currentLocale}
              onClose={() => setSelected(null)}
              canChange={canChange}
              onEdit={(entry) => setLogDialog({ entry })}
              onDelete={setDeleting}
            />
          )}
        </>
      )}

      {logDialog && (
        <ActivityLogModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          entry={logDialog.entry}
          bucket={view === LOG_VIEW ? null : selected}
          timeZone={timeZone}
          onSaved={entriesChanged}
          onClose={() => setLogDialog(null)}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleting}
        handleClose={() => setDeleting(null)}
        handleSubmit={() => void deleteEntry()}
        isSubmitting={isDeleting}
        title={t("liviere.activity.log.delete_title")}
        content={t("liviere.activity.log.delete_confirm")}
        primaryButtonText={{ loading: t("deleting"), default: t("delete") }}
        secondaryButtonText={t("cancel")}
      />
    </div>
  );
});
