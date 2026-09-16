import { useState } from "react";
import { CalendarDays, Layers3, Play, Video } from "lucide-react";
import type { TCoachingCardClip, TIssue } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
import {
  buildCustomPlaylistThumbnailUrl,
  formatLooseLabel,
} from "@/components/issues/issue-detail/sg-event-detail-page/utils";

export const isCoachingCardIssue = (issue: TIssue) =>
  issue.category === "Coaching Card" && issue.coaching_card_data?.kind === "coaching_card";

const getThumbnailUrl = (thumbnail?: string | null) => {
  if (!thumbnail) return "";
  return thumbnail.startsWith("/") ? thumbnail : buildCustomPlaylistThumbnailUrl(thumbnail);
};

const formatClipDuration = (durationSeconds?: number | null) => {
  if (durationSeconds === null || durationSeconds === undefined || !Number.isFinite(durationSeconds)) return "";
  const roundedSeconds = Math.max(0, Math.round(durationSeconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getClipStartTime = (timecode?: string) => timecode?.split("-")[0]?.trim() ?? "";

const CoachingCardThumbnail = ({
  clip,
  fallbackThumbnail,
  children,
}: {
  clip?: TCoachingCardClip;
  fallbackThumbnail?: string | null;
  children?: React.ReactNode;
}) => {
  const thumbnail = getThumbnailUrl(clip?.thumbnail || fallbackThumbnail);
  const [failedThumbnail, setFailedThumbnail] = useState("");
  const hasThumbnail = Boolean(thumbnail) && failedThumbnail !== thumbnail;

  return (
    <div className="relative min-w-0 overflow-hidden bg-custom-background-80">
      {hasThumbnail ? (
        <img
          src={thumbnail}
          alt={clip?.title ? `Clip: ${clip.title}` : "Coaching card video clip"}
          className="h-full w-full object-cover"
          onError={() => setFailedThumbnail(thumbnail)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-custom-text-300">
          <Video className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      {children}
    </div>
  );
};

export const CoachingCardKanbanDetails = ({
  issue,
  projectIdentifier,
}: {
  issue: TIssue;
  projectIdentifier?: string;
}) => {
  const card = issue.coaching_card_data;
  if (!card) return null;

  const clips = card.playlists.flatMap((playlist) => playlist.clips);
  const firstClip = clips[0];
  const secondClip = clips.find((clip, index) => index > 0 && clip.thumbnail !== firstClip?.thumbnail) ?? clips[1];
  const jersey = card.player.jersey_number.trim().replace(/^#/, "");
  const playerLabel = `${card.player.name}${jersey ? ` #${jersey}` : ""}`;
  const rawPrimaryContext = firstClip?.title || card.summary.primary_clip_title;
  const primaryContext = rawPrimaryContext ? formatLooseLabel(rawPrimaryContext) : "";
  const sourceIdentifier = projectIdentifier
    ? `${projectIdentifier}-${card.source_issue.sequence_id}`
    : `#${card.source_issue.sequence_id}`;
  const clipStartTime = getClipStartTime(firstClip?.timecode);
  const clipDuration = formatClipDuration(firstClip?.duration_seconds);
  const metadata = [
    card.progress_status,
    firstClip?.group,
    firstClip?.detail,
    firstClip?.result,
    firstClip?.secondary_detail,
  ]
    .filter((value): value is string => Boolean(value))
    .slice(0, 6);

  return (
    <div className="space-y-2.5">
      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-custom-text-300">
        <Layers3 className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="shrink-0">Source {sourceIdentifier}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate" title={card.source_issue.name}>
          {card.source_issue.name}
        </span>
      </div>

      <p className="line-clamp-2 text-[13px] leading-5 text-custom-text-100" title={issue.name}>
        <span className="font-semibold">Coaching card</span>
        <span className="text-custom-text-300"> · </span>
        {playerLabel}
        {primaryContext && (
          <>
            <span className="text-custom-text-300"> — </span>
            {primaryContext}
          </>
        )}
      </p>

      <div className="grid h-[82px] grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[3px] overflow-hidden rounded-md border border-custom-border-200">
        <CoachingCardThumbnail clip={firstClip} fallbackThumbnail={card.summary.primary_thumbnail}>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pb-1.5 pt-6 text-white">
            <span className="min-w-0 truncate text-[9px] font-medium uppercase">
              {clipStartTime || firstClip?.group || firstClip?.title || "Video clip"}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[9px] tabular-nums">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/65" aria-hidden="true">
                <Play className="h-2.5 w-2.5 fill-current" />
              </span>
              {clipDuration}
            </span>
          </div>
        </CoachingCardThumbnail>

        <CoachingCardThumbnail clip={secondClip} fallbackThumbnail={card.summary.primary_thumbnail}>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-1 text-center text-white">
            <span className="text-[11px] font-medium tabular-nums">
              {card.summary.playlist_count} playlist{card.summary.playlist_count === 1 ? "" : "s"}
            </span>
            <span className="mt-1 text-[9px] text-white/75">
              {card.summary.clip_count} tag{card.summary.clip_count === 1 ? "" : "s"}
            </span>
          </div>
        </CoachingCardThumbnail>
      </div>

      {card.feedback && (
        <p className="line-clamp-2 whitespace-pre-wrap break-words text-xs leading-[1.4] text-custom-text-200">
          {card.feedback}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1">
        <span className="inline-flex h-5 items-center gap-1 rounded border border-custom-border-300 px-1.5 text-[10px] text-custom-text-300">
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {renderFormattedDate(issue.created_at)}
        </span>
        {metadata.map((value, index) => (
          <span
            key={`${index}-${value}`}
            className={cn(
              "inline-flex h-5 max-w-full items-center truncate rounded border border-custom-border-300 px-1.5 text-[10px] text-custom-text-200",
              index === 0 && "border-custom-primary-100/40 bg-custom-primary-100/10 text-custom-primary-100",
              index === 3 && "text-custom-primary-100"
            )}
            title={value}
          >
            {value}
          </span>
        ))}
      </div>

      <div className="flex min-w-0 items-center gap-2 border-t border-custom-border-200 pt-2">
        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded bg-custom-primary-100/15 px-1 text-[11px] font-semibold text-custom-primary-100">
          {jersey || card.player.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 truncate text-xs font-medium text-custom-text-100">{card.player.name}</span>
        {card.player.position && (
          <span className="shrink-0 text-[11px] text-custom-text-300">· {card.player.position}</span>
        )}
      </div>
    </div>
  );
};
