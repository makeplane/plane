"use client";

import type { FC } from "react";
import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { Signal, Tag, CalendarClock, User, UserCircle2, Handshake, Volleyball, Calendar, Clock } from "lucide-react";

// i18n
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";

// utils
import { renderFormattedPayloadDate } from "@plane/utils";

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
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "../../types";

import OppositionTeamProperty from "@/plane-web/components/issues/issue-details/opposition-team-property";
import type { TIssueOperations } from "@/components/issues/issue-detail";

interface IPeekOverviewProperties {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  readOnly?: boolean;
  mediaItem?: TMediaItem;
  issueOperations: TIssueOperations;
}

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled, mediaItem, readOnly = false } = props;
  const { t } = useTranslation();

  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

  // derived values
  const issue = getIssueById(issueId);
  const mediaMeta = useMemo(() => (mediaItem?.meta ?? {}) as Record<string, unknown>, [mediaItem?.meta]);

  const getMetaStringValue = useCallback(
    (keys: string[]) => {
      for (const key of keys) {
        const value = mediaMeta[key];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return "";
    },
    [mediaMeta]
  );

  const pickIssueOrMetaString = useCallback(
    (issueValue: string | null | undefined, keys: string[]) => {
      if (typeof issueValue === "string" && issueValue.trim()) return issueValue.trim();
      const metaValue = getMetaStringValue(keys);
      return metaValue || null;
    },
    [getMetaStringValue]
  );

  const resolvedStartDate = pickIssueOrMetaString(issue?.start_date, ["start_date", "startDate"]);
  const resolvedStartTime = pickIssueOrMetaString(issue?.start_time, ["start_time", "startTime"]);
  const resolvedLevel = pickIssueOrMetaString(issue?.level, ["level"]);
  const resolvedProgram = pickIssueOrMetaString(issue?.program, ["program"]);
  const resolvedSport = pickIssueOrMetaString(issue?.sport, ["sport"]);
  const resolvedCategory = pickIssueOrMetaString(issue?.category, ["category"]);
  const issueSeasonValue =
    typeof issue?.year === "string" ? issue.year : issue?.year ? String(issue.year) : null;
  const resolvedSeason = pickIssueOrMetaString(issueSeasonValue, ["season"]);

  const resolvedOpposition = useMemo<any>(() => {
    const issueOpposition = issue?.opposition_team;
    if (issueOpposition && typeof issueOpposition === "object" && !Array.isArray(issueOpposition)) {
      return issueOpposition;
    }
    const metaOpposition = mediaMeta.opposition;
    if (metaOpposition && typeof metaOpposition === "object" && !Array.isArray(metaOpposition)) {
      return metaOpposition as any;
    }
    const oppositionLabel = getMetaStringValue(["opposition"]);
    if (oppositionLabel) {
      return {
        name: oppositionLabel,
        logo: "",
      };
    }
    return null;
  }, [getMetaStringValue, issue?.opposition_team, mediaMeta.opposition]);

  if (!issue && !mediaItem) return <></>;

  const createdByDetails = issue?.created_by ? getUserDetails(issue.created_by) : undefined;
  const createdByLabel =
    (createdByDetails?.display_name
      ? createdByDetails.display_name.includes("-intake")
        ? "Plane"
        : createdByDetails.display_name
      : "") ||
    getMetaStringValue(["created_by", "createdBy"]) ||
    mediaItem?.author ||
    "";

  const minDate = new Date();
  minDate.setDate(minDate.getDate());

  const eventDateTime = (() => {
    if (!resolvedStartDate || !resolvedStartTime) return null;
    const time = new Date(resolvedStartTime);
    const date = new Date(resolvedStartDate);
    if (Number.isNaN(time.getTime()) || Number.isNaN(date.getTime())) return null;
    date.setUTCHours(time.getUTCHours());
    date.setUTCMinutes(time.getUTCMinutes());
    date.setUTCSeconds(time.getUTCSeconds());
    return date;
  })();

  const isPastEvent = eventDateTime ? eventDateTime < new Date() : false;

  // final disabled flag
  const isLocked = disabled || isPastEvent || !issue;

  const buildManifestMeta = useCallback(
    (currentIssue: TIssue) => ({
      category: currentIssue.category || "Work items",
      start_date: currentIssue.start_date ?? null,
      start_time: currentIssue.start_time ?? null,
      level: currentIssue.level ?? null,
      program: currentIssue.program ?? null,
      sport: currentIssue.sport ?? null,
      opposition: currentIssue.opposition_team ?? null,
      season: currentIssue.year ?? null,
    }),
    []
  );

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
      if (!issue || isLocked) return;
      await issueOperations.update(workspaceSlug, projectId, issueId, data);
      const nextIssue = { ...issue, ...data } as TIssue;
      await updateManifestMeta(nextIssue);
    },
    [isLocked, issue, issueId, issueOperations, projectId, updateManifestMeta, workspaceSlug]
  );

  return (
    <div>
      <h6 className="text-sm font-medium">Event Details</h6>

      <div className={`w-full space-y-2 mt-3 ${isLocked && !readOnly ? "opacity-60" : ""}`}>
        {/* created by */}
        {createdByLabel ? (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <UserCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{t("common.created_by")}</span>
            </div>
            <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm text-custom-text-100 justify-between cursor-default">
              {createdByDetails ? (
                <ButtonAvatars
                  showTooltip
                  userIds={createdByDetails.display_name.includes("-intake") ? null : createdByDetails.id}
                />
              ) : null}
              <span className="flex-grow truncate leading-5">{createdByLabel}</span>
            </div>
          </div>
        ) : null}

        {/* start date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            <span>{t("common.order_by.start_date")}</span>
          </div>
          <DateDropdown
            value={resolvedStartDate}
            onChange={(val) =>
              void handlePropertyUpdate({
                start_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            placeholder={t("issue.add.start_date")}
            buttonVariant="transparent-with-text"
            minDate={minDate ?? undefined}
            disabled={isLocked}
            className="w-3/4 flex-grow group"
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${resolvedStartDate ? "text-custom-text-100" : "text-custom-text-400"}`}
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
            value={resolvedStartTime}
            onChange={(val) => {
              void handlePropertyUpdate({
                start_time: val,
              });
            }}
            placeholder={t("add_start_time")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${resolvedStartTime ? "text-custom-text-100" : "text-custom-text-400"}`}
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
            value={resolvedLevel}
            onChange={(level) => {
              void handlePropertyUpdate({
                level: level,
              });
            }}
            placeholder={t("add_level")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${resolvedLevel ? "text-custom-text-100" : "text-custom-text-400"}`}
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
            value={resolvedProgram}
            onChange={(program) => {
              void handlePropertyUpdate({
                program: program,
              });
            }}
            placeholder={t("add_program")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${resolvedProgram ? "text-custom-text-100" : "text-custom-text-400"}`}
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
            value={resolvedSport}
            onChange={(sport) => {
              void handlePropertyUpdate({
                sport: sport,
              });
            }}
            placeholder={t("add_sport")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${resolvedSport ? "text-custom-text-100" : "text-custom-text-400"}`}
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
            value={resolvedOpposition as any}
            onChange={(team) =>
              void handlePropertyUpdate({
                opposition_team: team as any,
              })
            }
            disabled={isLocked}
          />
        </div>

        {/* Category */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <p>Category</p>
          </div>

          <CategoryDropdown
            value={resolvedCategory}
            onChange={(category) => {
              void handlePropertyUpdate({
                category: category,
              });
            }}
            placeholder={t("add_category")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${resolvedCategory ? "text-custom-text-100" : "text-custom-text-400"}`}
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
            value={resolvedSeason}
            onChange={(year) => {
              void handlePropertyUpdate({
                year: year,
              });
            }}
            placeholder={t("add_year")}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            disabled={isLocked}
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${resolvedSeason ? "text-custom-text-100" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </div>
      </div>
    </div>
  );
});
