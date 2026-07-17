import { AMERICAN_FOOTBALL_SAMPLE_TAGS } from "./matrix-view/config/matrix-mock-data";
import type { SgTagRow } from "./types";

export const buildMockFootballRows = (): SgTagRow[] =>
  AMERICAN_FOOTBALL_SAMPLE_TAGS.map((tag, index) => {
    const startSeconds = (index + 1) * 126;
    const endSeconds = startSeconds + 8;
    const formatTimestamp = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    return {
      action: tag.action,
      clipId: tag.clipId ?? `mock-clip-${index + 1}`,
      clipDurationSeconds: endSeconds - startSeconds,
      clipEndSeconds: endSeconds,
      clipRangeSource: "explicit",
      clipStartSeconds: startSeconds,
      context: tag.context ?? {},
      groupValue: tag.groupValue ?? "Quarter 1",
      id: tag.id,
      matrixParticipant: tag.player ?? null,
      matrixPeriod: tag.groupValue ?? null,
      player: tag.player ?? "--",
      playlistFallbackTimestamp: tag.playlistFallbackTimestamp ?? formatTimestamp(startSeconds),
      playlistTimestamp: tag.playlistTimestamp ?? formatTimestamp(startSeconds),
      primaryDetail: tag.team ?? "--",
      result: tag.result ?? "--",
      secondaryDetail: tag.groupValue ?? "--",
      sourceTagId: tag.sourceTagId ?? tag.id,
      sourceUrl: tag.sourceUrl ?? "",
      team: tag.team ?? "--",
      thumbnailUrl: tag.thumbnailUrl ?? "",
      timecode: `${formatTimestamp(startSeconds)} - ${formatTimestamp(endSeconds)}`,
    };
  });
