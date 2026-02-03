"use client";

import type { FC } from "react";
import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { Signal, Tag, CalendarClock, User, UserCircle2, Handshake, Volleyball, Calendar, Clock } from "lucide-react";

// i18n
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";

// utils
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";

// components
import { CategoryDropdown } from "@/components/dropdowns/category-property";
import { DateDropdown } from "@/components/dropdowns/date";
import { LevelDropdown } from "@/components/dropdowns/level-property";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { ProgramDropdown } from "@/components/dropdowns/program-property";
import SportDropdown from "@/components/dropdowns/sport-property";
import { TimeDropdown } from "@/components/dropdowns/time-picker";
import { YearRangeDropdown } from "@/components/dropdowns/year-property";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { MediaLibraryService } from "@/services/media-library.service";

import OppositionTeamProperty from "@/plane-web/components/issues/issue-details/opposition-team-property";

import type { TIssueOperations } from "../issue-detail";

interface IPeekOverviewProperties {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TIssueOperations;
}

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled } = props;
  const { t } = useTranslation();

  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const createdByDetails = getUserDetails(issue?.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const stateDetails = getStateById(issue.state_id);

  const minDate = new Date();
  // const minDate = getDate(issue.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(issue.target_date);
  maxDate?.setDate(maxDate.getDate());

  // ⭐ NEW: Detect if event start date + time is in the past
  const eventDateTime = (() => {
    if (!issue?.start_date || !issue?.start_time) return null;

    // start_time is ISO timestamp: "2025-12-08T14:46:00Z"
    const time = new Date(issue.start_time);

    // start_date is "YYYY-MM-DD"
    const date = new Date(issue.start_date);

    // apply time (using UTC to avoid timezone mismatch)
    date.setUTCHours(time.getUTCHours());
    date.setUTCMinutes(time.getUTCMinutes());
    date.setUTCSeconds(time.getUTCSeconds());

    return date;
  })();

  const isPastEvent = eventDateTime ? eventDateTime < new Date() : false;

  // final disabled flag
  const isLocked = disabled || isPastEvent;

  const buildManifestMeta = useCallback((currentIssue: TIssue) => {
    return {
      category: currentIssue.category || "Work items",
      start_date: currentIssue.start_date ?? null,
      start_time: currentIssue.start_time ?? null,
      level: currentIssue.level ?? null,
      program: currentIssue.program ?? null,
      sport: currentIssue.sport ?? null,
      opposition: currentIssue.opposition_team ?? null,
      season: currentIssue.year ?? null,
    };
  }, []);

  const updateManifestMeta = useCallback(
    async (currentIssue: TIssue) => {
      if (!workspaceSlug || !projectId || !issueId) return;
      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
        const packageId = typeof manifest?.id === "string" ? manifest.id : null;
        if (!packageId) return;
        await mediaLibraryService.updateManifestMetadata(workspaceSlug, projectId, packageId, {
          work_item_id: issueId,
          meta: buildManifestMeta(currentIssue),
        });
      } catch {
        // Skip manifest updates if artifacts don't exist.
      }
    },
    [buildManifestMeta, issueId, mediaLibraryService, projectId, workspaceSlug]
  );

  const handlePropertyUpdate = useCallback(
    async (data: Partial<TIssue>) => {
      await issueOperations.update(workspaceSlug, projectId, issueId, data);
      const updatedIssue = getIssueById(issueId);
      if (!updatedIssue) return;
      await updateManifestMeta(updatedIssue);
    },
    [getIssueById, issueId, issueOperations, projectId, updateManifestMeta, workspaceSlug]
  );

  return (
    <div>
      <h6 className="text-sm font-medium">Event Details</h6>

      <div className={`w-full space-y-2 mt-3 ${isLocked ? "opacity-60" : ""}`}>
        {/* created by */}
        {createdByDetails && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <UserCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{t("common.created_by")}</span>
            </div>
            <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
              <ButtonAvatars
                showTooltip
                userIds={createdByDetails?.display_name.includes("-intake") ? null : createdByDetails?.id}
              />
              <span className="flex-grow truncate leading-5">
                {createdByDetails?.display_name.includes("-intake") ? "Plane" : createdByDetails?.display_name}
              </span>
            </div>
          </div>
        )}

        {/* start date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            <span>{t("common.order_by.start_date")}</span>
          </div>
          <DateDropdown
            value={issue.start_date}
            onChange={(val) =>
              void handlePropertyUpdate({
                start_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            placeholder={t("issue.add.start_date")}
            buttonVariant="transparent-with-text"
            minDate={minDate ?? undefined}
            // disabled={isLocked}
            className="w-3/4 flex-grow group"
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.start_date ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>

        {/* start time */}
        <div className="flex h-8 items-center gap-3 w-full">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{t("starting_time")}</span>
          </div>
          <TimeDropdown
            value={issue.start_time}
            onChange={(val) => {
              void handlePropertyUpdate({
                start_time: val,
              });
            }}
            placeholder={t("add_start_time")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            // disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.start_time ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>

        {/* Level */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Signal className="h-4 w-4 flex-shrink-0" />
            <p>{t("level_field")}</p>
          </div>

          <LevelDropdown
            value={issue?.level}
            onChange={(level) => {
              void handlePropertyUpdate({
                level: level,
              });
            }}
            placeholder={t("add_level")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            // disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.level ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>

        {/* Program */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <User className="h-4 w-4 flex-shrink-0" />
            <p>Program</p>
          </div>

          <ProgramDropdown
            value={issue?.program}
            onChange={(program) => {
              void handlePropertyUpdate({
                program: program,
              });
            }}
            placeholder={t("add_program")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            // disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.program ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>

        {/* Sport */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Volleyball className="h-4 w-4 flex-shrink-0" />
            <p>Sport</p>
          </div>

          <SportDropdown
            value={issue?.sport}
            onChange={(sport) => {
              void handlePropertyUpdate({
                sport: sport,
              });
            }}
            placeholder={t("add_sport")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            // disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.sport ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>

        {/* Opposition */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Handshake className="h-4 w-4 flex-shrink-0" />
            <p>Opposition</p>
          </div>

          <OppositionTeamProperty
            storageKey={`opp-team-${issueId}`}
            value={issue?.opposition_team}
            onChange={(team) =>
              void handlePropertyUpdate({
                opposition_team: team,
              })
            }
            // disabled={isLocked}
          />
        </div>

        {/* Category */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <p>Category</p>
          </div>

          <CategoryDropdown
            value={issue?.category}
            onChange={(category) => {
              void handlePropertyUpdate({
                category: category,
              });
            }}
            placeholder={t("add_category")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            // disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.category ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>

        {/* Year */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <p>Season</p>
          </div>

          <YearRangeDropdown
            value={issue?.year}
            onChange={(year) => {
              void handlePropertyUpdate({
                year: year,
              });
            }}
            placeholder={t("add_year")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            // disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.year ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>
      </div>
    </div>
  );
});
