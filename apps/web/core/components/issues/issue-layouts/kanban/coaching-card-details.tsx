import { useState } from "react";
import { Clapperboard, UserRound, Video } from "lucide-react";
import type { TIssue } from "@plane/types";
import { cn } from "@plane/utils";
import { buildCustomPlaylistThumbnailUrl } from "@/components/issues/issue-detail/sg-event-detail-page/utils";

export const isCoachingCardIssue = (issue: TIssue) =>
  issue.category === "Coaching Card" && issue.coaching_card_data?.kind === "coaching_card";

export const CoachingCardKanbanDetails = ({ issue }: { issue: TIssue }) => {
  const [failedThumbnail, setFailedThumbnail] = useState("");
  const card = issue.coaching_card_data;
  if (!card) return null;

  const firstClip = card.playlists[0]?.clips[0];
  const rawThumbnail = card.summary.primary_thumbnail || firstClip?.thumbnail || "";
  const thumbnail = rawThumbnail.startsWith("/") ? rawThumbnail : buildCustomPlaylistThumbnailUrl(rawThumbnail);
  const jersey = card.player.jersey_number.trim().replace(/^#/, "");
  const group = firstClip?.group || card.sport;
  const detailChips = [firstClip?.detail, firstClip?.result, firstClip?.secondary_detail].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-custom-text-100" title={issue.name}>
            {issue.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-custom-text-300">Source: {card.source_issue.name}</p>
        </div>
        <span className="shrink-0 rounded border border-custom-primary-100/40 bg-custom-primary-100/10 px-1.5 py-0.5 text-[10px] font-medium text-custom-primary-100">
          {card.progress_status}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-2">
        <div className="relative aspect-video min-w-0 overflow-hidden rounded border border-custom-border-200 bg-custom-background-80">
          {thumbnail && failedThumbnail !== thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setFailedThumbnail(thumbnail)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-custom-text-300">
              <Video className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          {firstClip?.title && (
            <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded bg-black/75 px-1.5 py-0.5 text-[9px] uppercase text-white">
              {firstClip.title}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center rounded border border-custom-border-200 bg-custom-background-80 px-1 text-center">
          <Clapperboard className="mb-1 h-4 w-4 text-custom-text-300" aria-hidden="true" />
          <span className="text-lg font-semibold tabular-nums text-custom-text-100">{card.summary.clip_count}</span>
          <span className="text-[9px] uppercase text-custom-text-300">
            tag{card.summary.clip_count === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {card.feedback && (
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs leading-5 text-custom-text-200">
          {card.feedback}
        </p>
      )}

      <div className="flex min-w-0 items-center justify-between gap-2 border-t border-custom-border-200 pt-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-custom-text-100">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-custom-text-300" aria-hidden="true" />
          <span className="truncate">
            {jersey ? `#${jersey} ` : ""}
            {card.player.name}
          </span>
          {card.player.position && <span className="shrink-0 text-custom-text-300">· {card.player.position}</span>}
        </span>
        <span
          className={cn(
            "max-w-[40%] shrink-0 truncate rounded border border-custom-border-300 px-1.5 py-0.5 text-[10px] text-custom-text-200",
            !group && "hidden"
          )}
        >
          {group}
        </span>
      </div>

      {detailChips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {detailChips.slice(0, 3).map((detail, index) => (
            <span
              key={`${index}-${detail}`}
              className={cn(
                "max-w-full truncate rounded border border-custom-border-300 px-1.5 py-0.5 text-[10px] text-custom-text-200",
                index === 1 && "text-custom-primary-100"
              )}
            >
              {detail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
