import type { IRosterPlayer, TCoachingCardPlaylist } from "@plane/types";
import type { TCustomPlaylist } from "@/services/media-library.service";
import type { SgTagRow } from "./types";

export const CARD_PROGRESS_OPTIONS = ["New Player", "Practice Player", "In-Progress", "Improvement"] as const;
export type CardProgressStatus = (typeof CARD_PROGRESS_OPTIONS)[number];

export type CardClip = {
  key: string;
  id: string;
  title: string;
  thumbnail: string | null;
  durationSeconds: number | null;
  timecode: string;
  team: string;
  detail: string;
  result: string;
  secondaryDetail: string;
  group: string;
};

export type CardPlaylist = { id: string; name: string; clips: CardClip[] };

export type CardFormValues = {
  playerIds: string[];
  feedback: string;
  progressStatus: CardProgressStatus;
  playlists: { id: string; clipIds: string[] }[];
};

const cleanText = (value: string | null | undefined) => {
  const text = value?.trim() ?? "";
  return ["--", "-", "n/a"].includes(text.toLowerCase()) ? "" : text;
};

export const formatCardPlayer = (player: IRosterPlayer) => {
  const jersey = player.jersey_number?.trim().replace(/^#/, "");
  return [player.player_name.trim() || "Unnamed player", jersey ? `#${jersey}` : ""].filter(Boolean).join(", ");
};

export const formatCardDuration = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export const buildCardPlaylists = (playlists: TCustomPlaylist[], availableRows: SgTagRow[]): CardPlaylist[] => {
  const rowsById = new Map(availableRows.map((row) => [row.id, row]));
  const rowsBySourceId = new Map<string, SgTagRow>();
  for (const row of availableRows) {
    for (const id of [row.clipId, row.sourceTagId]) {
      if (id && !rowsBySourceId.has(id)) rowsBySourceId.set(id, row);
    }
  }
  return playlists.map((playlist) => ({
    id: playlist.id,
    name: playlist.name.trim() || "Playlist",
    clips: (playlist.clips ?? []).map((clip, index) => {
      const row =
        rowsById.get(clip.id) ??
        rowsBySourceId.get(clip.id) ??
        (clip.sourceTagId ? (rowsById.get(clip.sourceTagId) ?? rowsBySourceId.get(clip.sourceTagId)) : undefined);
      const start = clip.startSeconds ?? row?.clipStartSeconds;
      const end = clip.endSeconds ?? row?.clipEndSeconds;
      const duration = clip.durationSeconds ?? row?.clipDurationSeconds;
      const detail = cleanText(row?.primaryDetail) || cleanText(clip.primaryDetail);
      const result = cleanText(row?.result) || cleanText(clip.result);
      return {
        key: JSON.stringify([playlist.id, clip.id, index]),
        id: clip.id,
        title: cleanText(row?.action) || cleanText(clip.title) || `Clip ${index + 1}`,
        thumbnail: row?.thumbnailUrl || clip.thumbnail || playlist.thumbnail || null,
        durationSeconds:
          duration != null && Number.isFinite(duration) && duration >= 0
            ? duration
            : start != null && end != null && Number.isFinite(start) && Number.isFinite(end) && end >= start
              ? end - start
              : null,
        timecode: cleanText(clip.timecode) || cleanText(row?.timecode),
        team: cleanText(row?.team) || cleanText(clip.team),
        detail,
        result,
        secondaryDetail:
          cleanText(row?.secondaryDetail) ||
          (clip.tags ?? []).map(cleanText).find((tag) => tag && tag !== detail && tag !== result) ||
          "",
        group: cleanText(row?.groupValue) || cleanText(clip.groupValue),
      };
    }),
  }));
};

export const buildCoachingCardPlaylists = (
  groups: CardPlaylist[],
  selections: CardFormValues["playlists"]
): TCoachingCardPlaylist[] => {
  const selectedClipIdsByPlaylist = new Map(selections.map((selection) => [selection.id, new Set(selection.clipIds)]));

  return groups.flatMap((group) => {
    const selectedClipIds = selectedClipIdsByPlaylist.get(group.id);
    if (!selectedClipIds) return [];

    const clips = group.clips
      .filter((clip) => selectedClipIds.has(clip.id))
      .map((clip) => ({
        key: clip.key,
        id: clip.id,
        title: clip.title,
        thumbnail: clip.thumbnail,
        duration_seconds: clip.durationSeconds,
        timecode: clip.timecode,
        team: clip.team,
        detail: clip.detail,
        result: clip.result,
        secondary_detail: clip.secondaryDetail,
        group: clip.group,
      }));

    return clips.length > 0 ? [{ id: group.id, name: group.name, clips }] : [];
  });
};
