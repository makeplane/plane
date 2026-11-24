/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the "Activity" page of a project. Rows are days (newest on top), columns are the
// 96 quarters of the day; the colour says how many actions happened in that quarter. Admins and members
// add log entries here (what they did, from when to when); agents do it through the API. The "Work log" view
// (?view=log) lists the entries by day instead of the grid.

import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tabs } from "@plane/propel/tabs";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useQueryParams } from "@/hooks/use-query-params";
import { projectActivityService } from "./activity.service";
import { ActivityEventList } from "./activity-events";
import { ActivityGrid } from "./activity-grid";
import { ActivityLogList } from "./activity-log-list";
import { ActivityLogModal } from "./activity-log-modal";
import { shiftDate } from "./grid";
import type { TActivityEvent } from "./types";
import { refreshProjectActivity, useActivityHeatmap, useCurrentQuarter } from "./use-activity";

const RANGES = [7, 30, 90];
const VIEW_PARAM = "view";
const LOG_VIEW = "log";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export type TSelectedBucket = { date: string; slot: number };

export const ProjectActivityRoot = observer(function ProjectActivityRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t, currentLocale } = useTranslation();
  // The viewer's clock: quarters are shown in the time zone of the browser
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const [days, setDays] = useState(30);
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
  const view = searchParams.get(VIEW_PARAM) === LOG_VIEW ? LOG_VIEW : "grid";
  const setView = (value: string) => {
    setSelected(null);
    router.replace(
      value === LOG_VIEW
        ? updateQueryParams({ paramsToAdd: { [VIEW_PARAM]: LOG_VIEW } })
        : updateQueryParams({ paramsToRemove: [VIEW_PARAM] })
    );
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
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("liviere.activity.log.delete_error") });
    } finally {
      setIsDeleting(false);
    }
  };

  // Moves on every quarter, so the grid marks the current one and a new day appears after midnight
  const now = useCurrentQuarter(timeZone);
  const to = now.date;
  const query = { from: shiftDate(to, -(days - 1)), to, tz: timeZone, actor };
  const { data: heatmap, error, isLoading } = useActivityHeatmap(workspaceSlug, projectId, query);

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col gap-5 overflow-y-auto px-6 py-5">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {/* Tabs fill their parent by default; here they are one item of the toolbar */}
        <Tabs value={view} onValueChange={(value) => setView(String(value))} className="h-auto w-fit">
          <Tabs.List className="flex h-7 w-fit">
            <Tabs.Trigger value="grid" size="md" className="h-6 px-3">
              {t("liviere.activity.view_grid")}
            </Tabs.Trigger>
            <Tabs.Trigger value={LOG_VIEW} size="md" className="h-6 px-3">
              {t("liviere.activity.view_log")}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
        <div className="flex overflow-hidden rounded-md border border-subtle">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => {
                setDays(range);
                setSelected(null);
              }}
              className={cn(
                "px-3 py-1 text-13 text-secondary hover:bg-layer-transparent-hover",
                days === range && "bg-layer-transparent-selected font-medium text-primary"
              )}
            >
              {t("liviere.activity.range_days", { days: range })}
            </button>
          ))}
        </div>
        <MemberDropdown
          projectId={projectId}
          value={actor}
          multiple={false}
          onChange={(value) => {
            setActor(value === actor ? null : value);
            setSelected(null);
          }}
          buttonVariant="border-with-text"
          placeholder={t("liviere.activity.all_members")}
          showUserDetails
        />
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
        <Button
          variant="secondary"
          size="sm"
          prependIcon={<Plus />}
          onClick={() => setLogDialog({})}
          className="ml-auto"
        >
          {t("liviere.activity.log.add")}
        </Button>
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

      {view === LOG_VIEW ? (
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
          onSaved={entriesChanged}
          onClose={() => setLogDialog(null)}
        />
      )}
      <AlertModalCore
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
