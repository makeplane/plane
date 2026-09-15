import { useState } from "react";
import { Video } from "lucide-react";
import type { IRosterPlayer } from "@plane/types";
import { cn } from "@plane/utils";
import { formatCardDuration, formatCardPlayer } from "./create-card-model";
import type { CardClip, CardPlaylist, CardProgressStatus } from "./create-card-model";
import { CreateCardScrollArea } from "./create-card-scroll-area";
import { buildCustomPlaylistThumbnailUrl } from "./utils";

export const CardClipThumbnail = ({
  clip,
  className,
  showLabel = false,
}: {
  clip?: CardClip;
  className?: string;
  showLabel?: boolean;
}) => {
  const [failedSource, setFailedSource] = useState("");
  const source = clip?.thumbnail?.startsWith("/") ? clip.thumbnail : buildCustomPlaylistThumbnailUrl(clip?.thumbnail);
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded border border-custom-border-200 bg-custom-background-80",
        className
      )}
    >
      {source && failedSource !== source ? (
        <img src={source} alt="" className="h-full w-full object-cover" onError={() => setFailedSource(source)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-custom-text-300">
          <Video className="h-5 w-5" />
        </div>
      )}
      {showLabel && clip && (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[9px] uppercase text-white">
          {clip.title}
        </span>
      )}
    </div>
  );
};

type Props = {
  players: IRosterPlayer[];
  playlists: CardPlaylist[];
  feedback: string;
  progressStatus: CardProgressStatus;
  sportLabel: string;
};

export const CreateCardPreview = ({ players, playlists, feedback, progressStatus, sportLabel }: Props) => {
  const player = players[0];
  const clip = playlists[0]?.clips[0];
  const clipCount = playlists.reduce((count, playlist) => count + playlist.clips.length, 0);
  const jersey = player?.jersey_number?.trim().replace(/^#/, "");
  const recipients = players.map(formatCardPlayer).join(", ");
  const details = [clip?.detail, clip?.result, clip?.secondaryDetail].filter(Boolean);
  return (
    <aside className="min-w-0 md:border-r md:border-custom-border-200 md:pr-5">
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-custom-text-300">
        Player preview
      </p>
      <div className="overflow-hidden rounded-xl border border-custom-border-300 bg-custom-background-90">
        <div className="border-b border-custom-border-200 p-3.5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-custom-text-300">
              Coaching card
            </span>
            <span className="rounded-md border border-custom-primary-100 bg-custom-primary-10 px-2 py-0.5 text-[10px] text-custom-primary-100">
              {progressStatus}
            </span>
          </div>
          <p className="text-[11px] text-custom-text-200">{[sportLabel, clip?.group].filter(Boolean).join(" · ")}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2 text-custom-text-100">
            {jersey && <span className="text-2xl font-semibold">#{jersey}</span>}
            <span className="text-sm font-medium uppercase">{player?.player_name || "Select a player"}</span>
          </div>
          {player?.position && <p className="mt-0.5 text-xs text-custom-text-200">{player.position}</p>}
        </div>
        <div className="space-y-3 p-3.5">
          <div className="relative">
            <CardClipThumbnail clip={clip} className="aspect-video w-full" />
            {clip && (
              <div className="absolute inset-x-2 bottom-2 flex min-w-0 items-center gap-1 text-[9px] text-white">
                <span className="max-w-[45%] truncate rounded bg-black/75 px-1.5 py-0.5 uppercase">{clip.title}</span>
                {clip.detail && (
                  <span className="min-w-0 truncate rounded bg-black/75 px-1.5 py-0.5">{clip.detail}</span>
                )}
                <span className="ml-auto shrink-0 rounded bg-black/75 px-1.5 py-0.5 tabular-nums">
                  {formatCardDuration(clip.durationSeconds)}
                </span>
              </div>
            )}
          </div>
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[10px] uppercase tracking-[0.12em] text-custom-text-300">Playlists</h3>
              <span className="text-[10px] text-custom-text-200">
                {playlists.length} playlists · {clipCount} tags
              </span>
            </div>
            <CreateCardScrollArea
              className="max-h-[min(38dvh,360px)] space-y-2.5 pr-1"
              message="Scroll for more tags"
              refreshKey={clipCount}
            >
              {playlists.map((playlist) => (
                <div key={playlist.id}>
                  <p className="mb-1 truncate text-xs text-custom-text-100" title={playlist.name}>
                    {playlist.name}{" "}
                    <span className="text-custom-text-300">
                      {playlist.clips.length} tag{playlist.clips.length === 1 ? "" : "s"}
                    </span>
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(60px,1fr))] gap-1.5">
                    {playlist.clips.map((item) => (
                      <CardClipThumbnail key={item.key} clip={item} showLabel className="h-11 w-full" />
                    ))}
                  </div>
                </div>
              ))}
              {clipCount === 0 && <p className="text-xs text-custom-text-300">No tags to preview.</p>}
            </CreateCardScrollArea>
          </section>
          <section>
            <h3 className="mb-1 text-[10px] uppercase tracking-[0.12em] text-custom-text-300">Feedback</h3>
            <p
              className={cn(
                "whitespace-pre-wrap break-words text-xs leading-5 text-custom-text-100",
                !feedback.trim() && "italic text-custom-text-300"
              )}
            >
              {feedback.trim() ? feedback : "Add feedback for this session…"}
            </p>
          </section>
          <div className="space-y-3 border-t border-custom-border-200 pt-3">
            {details.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {details.map((detail, index) => (
                  <span
                    key={`${index}-${detail}`}
                    className={cn(
                      "rounded border border-custom-border-300 px-1.5 py-0.5 text-[10px] text-custom-text-200",
                      index === 1 && "text-custom-primary-100"
                    )}
                  >
                    {detail}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] leading-4 text-custom-text-200">
              {players.length
                ? `Selected for ${players.length} player${players.length === 1 ? "" : "s"} · ${recipients}`
                : "Select recipients from the roster."}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
