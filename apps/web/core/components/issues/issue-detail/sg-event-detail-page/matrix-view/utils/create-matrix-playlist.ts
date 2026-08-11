import type { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import type { SgTagRow } from "../../types";
import { buildArchivedPlaylistUrl, getSgTagRowStreamName, playlistHasMediaSegments } from "../../utils";

type MatrixPlaylistEntry = {
  original_stream_name: string;
  timestamp: string;
};

type CreateMatrixPlaylistArgs = {
  mediaLibraryService: MediaLibraryService;
  rows: SgTagRow[];
  streamName?: string | null;
};

export type MatrixPlaylistResult = {
  fileName: string;
  rowIds: string[];
  url: string;
};

type BuildMatrixPlaylistItemArgs = {
  result: MatrixPlaylistResult;
  rows: SgTagRow[];
  workItemId: string | null;
};

const getRowTimestamp = (row: SgTagRow, preferFallback: boolean) => {
  const primaryTimestamp = row.playlistTimestamp?.trim() || "";
  const fallbackTimestamp = row.playlistFallbackTimestamp?.trim() || "";
  return preferFallback ? fallbackTimestamp || primaryTimestamp : primaryTimestamp || fallbackTimestamp;
};

export const getMatrixPlaylistRows = (rows: SgTagRow[]) => {
  const uniqueRows = new Map<string, SgTagRow>();
  for (const row of rows) {
    if (!getRowTimestamp(row, false) || uniqueRows.has(row.id)) continue;
    uniqueRows.set(row.id, row);
  }
  return Array.from(uniqueRows.values());
};

const buildPlaylistCandidate = (rows: SgTagRow[], fallbackStreamName: string, preferFallback: boolean) => {
  const entriesByKey = new Map<string, MatrixPlaylistEntry>();
  const rowIds: string[] = [];

  for (const row of rows) {
    const timestamp = getRowTimestamp(row, preferFallback);
    const streamName = getSgTagRowStreamName(row, fallbackStreamName);
    if (!timestamp) continue;
    if (!streamName) continue;

    const entry = { original_stream_name: streamName, timestamp };
    entriesByKey.set(`${streamName}\u0000${timestamp}`, entry);
    rowIds.push(row.id);
  }

  return {
    entries: Array.from(entriesByKey.values()),
    rowIds,
  };
};

export const createMatrixPlaylist = async ({
  mediaLibraryService,
  rows,
  streamName,
}: CreateMatrixPlaylistArgs): Promise<MatrixPlaylistResult> => {
  const normalizedStreamName = streamName?.trim() ?? "";
  const playlistRows = getMatrixPlaylistRows(rows);
  if (playlistRows.length === 0) {
    throw new Error("The selected tags do not contain playable stream timestamps.");
  }

  const playlistCandidates = [
    buildPlaylistCandidate(playlistRows, normalizedStreamName, false),
    buildPlaylistCandidate(playlistRows, normalizedStreamName, true),
  ];
  let firstGeneratedResult: MatrixPlaylistResult | null = null;
  const seenCandidates = new Set<string>();

  for (const { entries, rowIds } of playlistCandidates) {
    const candidateKey = JSON.stringify(entries);
    if (entries.length === 0 || seenCandidates.has(candidateKey)) continue;
    seenCandidates.add(candidateKey);

    const fileName = await mediaLibraryService.createPlaylist(entries);
    const url = fileName ? buildArchivedPlaylistUrl(fileName) : null;
    if (!fileName || !url) continue;

    const result = {
      fileName,
      rowIds,
      url,
    };
    firstGeneratedResult ??= result;

    if (await playlistHasMediaSegments(url)) {
      return result;
    }
  }

  if (firstGeneratedResult) {
    return firstGeneratedResult;
  }

  throw new Error("The selected tags did not produce a playable playlist.");
};

export const buildMatrixPlaylistItem = ({ result, rows, workItemId }: BuildMatrixPlaylistItemArgs): TMediaItem => ({
  action: "play_streaming",
  author: "",
  createdAt: "",
  description: "",
  docs: [],
  downloadSrc: result.url,
  duration: "",
  fileSrc: result.url,
  format: "m3u8",
  id: `sg-matrix-playlist-${result.fileName}`,
  itemsCount: rows.length,
  link: result.url,
  linkedFormat: "m3u8",
  linkedMediaType: "video",
  mediaType: "video",
  meta: {
    hls: true,
    hls_direct: true,
    playlistFileName: result.fileName,
    sourceTagIds: rows.map((row) => row.sourceTagId).filter((id): id is string => Boolean(id)),
    tagRowIds: result.rowIds,
  },
  primaryTag: "Matrix playlist",
  secondaryTag: "",
  thumbnail: "",
  title: `Matrix playlist (${rows.length} tag${rows.length === 1 ? "" : "s"})`,
  videoSrc: result.url,
  views: 0,
  workItemId,
});
