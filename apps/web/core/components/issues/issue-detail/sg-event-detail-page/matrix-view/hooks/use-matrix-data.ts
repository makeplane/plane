"use client";

import { useMemo } from "react";
import type { SportTableKind, SgTagRow } from "../../types";
import { resolveSportMatrixConfig } from "../config/sport-matrix-config";
import type { MatrixOrientation, MatrixSourceTag } from "../types/matrix.types";
import { buildMatrixData, orientMatrixData } from "../utils/build-matrix-data";
import { useMatrixFilters } from "./use-matrix-filters";

type UseMatrixDataArgs = {
  orientation: MatrixOrientation;
  sport: SportTableKind | string;
  tagRows: readonly SgTagRow[];
};

const toMatrixSourceTag = (row: SgTagRow): MatrixSourceTag => ({
  action: row.action,
  clipId: row.clipId,
  context: row.context,
  groupValue: row.matrixPeriod,
  id: row.id,
  player: row.matrixParticipant,
  playlistFallbackTimestamp: row.playlistFallbackTimestamp,
  playlistTimestamp: row.playlistTimestamp,
  result: row.result,
  sourceTagId: row.sourceTagId,
  sourceUrl: row.sourceUrl,
  team: row.team,
  thumbnailUrl: row.thumbnailUrl,
});

export const useMatrixData = ({ orientation, sport, tagRows }: UseMatrixDataArgs) => {
  const sportResolution = useMemo(() => resolveSportMatrixConfig(sport), [sport]);
  const sourceTags = useMemo(() => tagRows.map(toMatrixSourceTag), [tagRows]);
  const filterState = useMatrixFilters({ config: sportResolution.config, sourceTags });
  const canonicalMatrix = useMemo(
    () =>
      sportResolution.config
        ? buildMatrixData(filterState.filteredSourceTags, sportResolution.config, "entities-by-actions")
        : null,
    [filterState.filteredSourceTags, sportResolution.config]
  );
  const matrix = useMemo(
    () => (canonicalMatrix ? orientMatrixData(canonicalMatrix, orientation) : null),
    [canonicalMatrix, orientation]
  );

  return {
    ...filterState,
    matrix,
    sourceTags,
    sportResolution,
  };
};
