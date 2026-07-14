export type SupportedMatrixSport = "american-football" | "cricket" | "basketball" | "baseball" | "soccer";

export type MatrixOrientation = "entities-by-actions" | "actions-by-entities";

export type MatrixEntityDimension = "team" | "period" | "player" | "unassigned";

export type MatrixAxisKind = "entity" | "action";

export type MatrixSourceTag = {
  id: string;
  sourceTagId?: string | null;
  action: string;
  context?: Readonly<Record<string, string>>;
  player?: string | null;
  result?: string | null;
  team?: string | null;
  groupValue?: string | null;
  sourceUrl?: string;
  clipId?: string | null;
  thumbnailUrl?: string | null;
  playlistTimestamp?: string | null;
  playlistFallbackTimestamp?: string | null;
};

export type SportMatrixCategory = {
  id: string;
  label: string;
  color: string;
  order: number;
};

export type SportMatrixAction = {
  id: string;
  label: string;
  aliases: readonly string[];
  category: string;
  color: string;
  order: number;
  visible: boolean;
  contextRules?: readonly SportMatrixContextRule[];
};

export type SportMatrixContextRule = {
  sourceActions: readonly string[];
  values: Readonly<Record<string, readonly string[]>>;
};

export type SportMatrixEntityDimension = {
  dimension: Exclude<MatrixEntityDimension, "unassigned">;
  label: string;
  color: string;
};

export type SportMatrixConfig = {
  sport: SupportedMatrixSport;
  label: string;
  categories: readonly SportMatrixCategory[];
  actions: readonly SportMatrixAction[];
  metricDimensionPriority: readonly Exclude<MatrixEntityDimension, "unassigned">[];
  rowDimensionPriority: readonly Exclude<MatrixEntityDimension, "unassigned">[];
  entityDimensions: Readonly<Record<Exclude<MatrixEntityDimension, "unassigned">, SportMatrixEntityDimension>>;
};

export type MatrixSportResolution = {
  input: string;
  normalizedInput: string;
  sport: SupportedMatrixSport | null;
  config: SportMatrixConfig | null;
  isSupported: boolean;
};

export type MatrixCell = {
  /** Stable across orientations. `rowId` is always the canonical entity id. */
  id: string;
  rowId: string;
  /** Always the canonical action id, including when actions are displayed as rows. */
  columnId: string;
  count: number;
  tagIds: string[];
  sourceRowIds: string[];
  sourceUrls: string[];
  /** Present only when the source supplied explicit clip identifiers. */
  clipIds?: string[];
};

export type MatrixColumn = {
  id: string;
  label: string;
  kind: MatrixAxisKind;
  category?: string;
  dimension?: MatrixEntityDimension;
  group?: string;
  isMetric?: boolean;
  color?: string;
  order: number;
  visible: boolean;
};

export type MatrixRow = MatrixColumn & {
  cells: Record<string, MatrixCell>;
  total: number;
  average: number;
};

export type MatrixData = {
  sport: SupportedMatrixSport;
  orientation: MatrixOrientation;
  /** Canonical entity axis. It is invariant when the display orientation changes. */
  entities: MatrixColumn[];
  /** Canonical action axis. It is invariant when the display orientation changes. */
  actions: MatrixColumn[];
  /** Display rows for `orientation`. */
  rows: MatrixRow[];
  /** Display columns for `orientation`. */
  columns: MatrixColumn[];
  /** Canonical cells keyed by stable cell id. */
  cells: Record<string, MatrixCell>;
  sourceTagCount: number;
};

export type MatrixFilterState = {
  search: string;
  teams: readonly string[];
  players: readonly string[];
  categories: readonly string[];
  periods: readonly string[];
};

export type MatrixFilterOption = {
  value: string;
  label: string;
};

export type MatrixFilterOptions = {
  teams: MatrixFilterOption[];
  players: MatrixFilterOption[];
  categories: MatrixFilterOption[];
  periods: MatrixFilterOption[];
};

export type MatrixCellSelection = readonly string[];
