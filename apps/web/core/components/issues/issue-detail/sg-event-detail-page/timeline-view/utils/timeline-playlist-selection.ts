import type { SgTagRow } from "../../types";

const parseTimePartSeconds = (value: string) => {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];

  return null;
};

const getPlaylistRangeStartSeconds = (value: string | null | undefined) => {
  if (!value?.trim()) return null;

  const [start] = value.split("-");
  return start ? parseTimePartSeconds(start) : null;
};

const hasPlayableTimelineRow = (row: SgTagRow) =>
  Boolean(row.playlistTimestamp?.trim() || row.playlistFallbackTimestamp?.trim());

const getTimelinePlaylistSortSeconds = (row: SgTagRow) => {
  if (typeof row.clipStartSeconds === "number" && Number.isFinite(row.clipStartSeconds)) return row.clipStartSeconds;

  return (
    getPlaylistRangeStartSeconds(row.playlistTimestamp) ??
    getPlaylistRangeStartSeconds(row.playlistFallbackTimestamp) ??
    Number.POSITIVE_INFINITY
  );
};

export const getTimelinePlaylistRows = (rows: SgTagRow[], selectedTagIds: string[]) => {
  const selectedIdSet = new Set(selectedTagIds);
  const seenIds = new Set<string>();

  return rows
    .filter((row) => {
      if (!selectedIdSet.has(row.id) || seenIds.has(row.id) || !hasPlayableTimelineRow(row)) return false;

      seenIds.add(row.id);
      return true;
    })
    .sort((left, right) => getTimelinePlaylistSortSeconds(left) - getTimelinePlaylistSortSeconds(right));
};
