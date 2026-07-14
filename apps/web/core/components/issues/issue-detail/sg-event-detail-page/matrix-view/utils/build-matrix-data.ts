import type {
  MatrixCell,
  MatrixColumn,
  MatrixData,
  MatrixEntityDimension,
  MatrixOrientation,
  MatrixRow,
  MatrixSourceTag,
  SportMatrixAction,
  SportMatrixConfig,
} from "../types/matrix.types";

type ResolvedTag = {
  source: MatrixSourceTag;
  actionIds: string[];
  entityIds: string[];
};

type ResolvedEntity = {
  dimension: MatrixEntityDimension;
  id: string;
  isMetric: boolean;
  label: string;
};

const EMPTY_VALUES = new Set(["", "--", "\u2014", "n/a", "na", "none", "null", "undefined"]);

const hasValue = (value: string | null | undefined) =>
  !EMPTY_VALUES.has(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );

const normalizeKey = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const formatLabel = (value: string | null | undefined, fallback = "Unknown Action") => {
  const normalized = String(value ?? "").trim();
  if (!normalized || !hasValue(normalized)) return fallback;
  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const actionAxisId = (actionId: string) => `action:${encodeURIComponent(actionId.trim().toLowerCase())}`;
const entityAxisId = (dimension: MatrixEntityDimension, label: string) =>
  `entity:${dimension}:${encodeURIComponent(label.trim().toLowerCase())}`;
const cellId = (entityId: string, actionId: string) =>
  `cell:${encodeURIComponent(entityId)}:${encodeURIComponent(actionId)}`;

const average = (total: number, itemCount: number) => (itemCount > 0 ? Math.round((total / itemCount) * 100) / 100 : 0);

const uniquePush = (values: string[], value: string | null | undefined) => {
  const normalized = String(value ?? "").trim();
  if (normalized && !values.includes(normalized)) values.push(normalized);
};

const buildActionLookup = (config: SportMatrixConfig) => {
  const lookup = new Map<string, SportMatrixAction>();
  config.actions.forEach((action) => {
    [action.id, action.label, ...action.aliases].forEach((alias) => {
      const normalized = normalizeKey(alias);
      if (normalized && !lookup.has(normalized)) lookup.set(normalized, action);
    });
  });
  return lookup;
};

const resolveActionKey = (action: string, lookup: Map<string, SportMatrixAction>) => {
  const normalized = normalizeKey(action);
  const configured = lookup.get(normalized);
  return configured
    ? { configured, observedId: null }
    : { configured: null, observedId: normalized || "unknown_action" };
};

const buildContextLookup = (tag: MatrixSourceTag) => {
  const context = new Map<string, string>();
  Object.entries(tag.context ?? {}).forEach(([key, value]) => {
    const normalizedKey = normalizeKey(key);
    const normalizedValue = normalizeKey(value);
    if (normalizedKey && normalizedValue) context.set(normalizedKey, normalizedValue);
  });
  if (hasValue(tag.result)) context.set("result", normalizeKey(tag.result));
  return context;
};

const matchesContextRule = (
  tag: MatrixSourceTag,
  rule: NonNullable<SportMatrixAction["contextRules"]>[number],
  context: ReadonlyMap<string, string>
) => {
  const sourceAction = normalizeKey(tag.action);
  if (!rule.sourceActions.some((action) => normalizeKey(action) === sourceAction)) return false;
  return Object.entries(rule.values).every(([key, allowedValues]) => {
    const value = context.get(normalizeKey(key));
    return Boolean(value && allowedValues.some((allowedValue) => normalizeKey(allowedValue) === value));
  });
};

const resolveConfiguredActions = (
  tag: MatrixSourceTag,
  config: SportMatrixConfig,
  lookup: Map<string, SportMatrixAction>
) => {
  const resolved = new Map<string, SportMatrixAction>();
  const context = buildContextLookup(tag);
  const primaryAction = lookup.get(normalizeKey(tag.action));
  if (primaryAction) resolved.set(primaryAction.id, primaryAction);
  config.actions.forEach((action) => {
    if (action.contextRules?.some((rule) => matchesContextRule(tag, rule, context))) resolved.set(action.id, action);
  });
  return Array.from(resolved.values());
};

const buildActions = (sourceTags: readonly MatrixSourceTag[], config: SportMatrixConfig) => {
  const lookup = buildActionLookup(config);
  const categoryLabels = new Map(config.categories.map((category) => [category.id, category.label]));
  const configuredColumns: MatrixColumn[] = config.actions.map((action) => ({
    id: actionAxisId(action.id),
    label: action.label,
    kind: "action",
    category: action.category,
    group: categoryLabels.get(action.category) ?? formatLabel(action.category, "Other"),
    color: action.color,
    order: action.order,
    visible: action.visible,
  }));
  const unknownById = new Map<string, string>();

  sourceTags.forEach((tag) => {
    if (resolveConfiguredActions(tag, config, lookup).length > 0) return;
    const observedId = resolveActionKey(tag.action, lookup).observedId;
    if (observedId && !unknownById.has(observedId)) {
      unknownById.set(observedId, formatLabel(tag.action));
    }
  });

  const unknownColumns = Array.from(unknownById.entries())
    .sort((left, right) => left[1].localeCompare(right[1]) || left[0].localeCompare(right[0]))
    .map<MatrixColumn>(([observedId, label], index) => ({
      id: actionAxisId(`observed:${observedId}`),
      label,
      kind: "action",
      category: "other",
      group: "Other",
      color: "#a3a3a3",
      order: configuredColumns.length + index,
      visible: true,
    }));

  return {
    actions: [...configuredColumns, ...unknownColumns],
    lookup,
  };
};

const getEntityValues = (tag: MatrixSourceTag) => ({
  team: tag.team,
  period: tag.groupValue,
  player: tag.player,
});

const selectMetricDimension = (sourceTags: readonly MatrixSourceTag[], config: SportMatrixConfig) =>
  config.metricDimensionPriority.find((dimension) =>
    sourceTags.some((tag) => hasValue(getEntityValues(tag)[dimension]))
  ) ?? null;

const getTagEntities = (
  tag: MatrixSourceTag,
  config: SportMatrixConfig,
  metricDimension: Exclude<MatrixEntityDimension, "unassigned"> | null
) => {
  const values = getEntityValues(tag);
  const entities = config.rowDimensionPriority.flatMap<ResolvedEntity>((dimension) => {
    const value = values[dimension];
    if (!hasValue(value)) return [];
    const label = String(value).trim();
    return [{ dimension, id: entityAxisId(dimension, label), isMetric: dimension === metricDimension, label }];
  });
  if (!metricDimension || !hasValue(values[metricDimension])) {
    entities.push({
      dimension: "unassigned",
      id: entityAxisId("unassigned", "Unassigned"),
      isMetric: true,
      label: "Unassigned",
    });
  }
  return entities;
};

const buildEntities = (
  sourceTags: readonly MatrixSourceTag[],
  config: SportMatrixConfig,
  metricDimension: Exclude<MatrixEntityDimension, "unassigned"> | null
) => {
  const entitiesById = new Map<string, MatrixColumn>();

  sourceTags.forEach((tag) => {
    getTagEntities(tag, config, metricDimension).forEach(({ dimension, id, isMetric, label }) => {
      if (entitiesById.has(id)) return;
      const dimensionConfig =
        dimension === "unassigned"
          ? metricDimension
            ? config.entityDimensions[metricDimension]
            : null
          : config.entityDimensions[dimension];
      entitiesById.set(id, {
        id,
        label,
        kind: "entity",
        dimension,
        group: dimensionConfig?.label ?? "Other",
        isMetric,
        color: dimensionConfig?.color ?? "#a3a3a3",
        order: 0,
        visible: true,
      });
    });
  });

  const orderedDimensions: readonly MatrixEntityDimension[] = [...config.rowDimensionPriority, "unassigned"];
  const dimensionOrder = new Map<MatrixEntityDimension, number>(
    orderedDimensions.map((dimension, index) => [dimension, index])
  );
  return Array.from(entitiesById.values())
    .sort(
      (left, right) =>
        (dimensionOrder.get(left.dimension ?? "unassigned") ?? Number.MAX_SAFE_INTEGER) -
          (dimensionOrder.get(right.dimension ?? "unassigned") ?? Number.MAX_SAFE_INTEGER) ||
        left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: "base" })
    )
    .map((entity, order) => ({ ...entity, order }));
};

const resolveTagActionIds = (
  tag: MatrixSourceTag,
  config: SportMatrixConfig,
  lookup: Map<string, SportMatrixAction>,
  actionIdsByObservedKey: Map<string, string>
) => {
  const configuredActions = resolveConfiguredActions(tag, config, lookup);
  if (configuredActions.length > 0) return configuredActions.map((action) => actionAxisId(action.id));
  const resolved = resolveActionKey(tag.action, lookup);
  const observedKey = resolved.observedId ?? "unknown_action";
  return [actionIdsByObservedKey.get(observedKey) ?? actionAxisId(`observed:${observedKey}`)];
};

const buildRows = (
  rowAxis: readonly MatrixColumn[],
  columnAxis: readonly MatrixColumn[],
  cells: Record<string, MatrixCell>,
  orientation: MatrixOrientation
): MatrixRow[] =>
  rowAxis.map((axisItem) => {
    const rowCells: Record<string, MatrixCell> = {};
    let total = 0;
    let populatedCellCount = 0;
    columnAxis.forEach((column) => {
      const canonicalEntityId = orientation === "entities-by-actions" ? axisItem.id : column.id;
      const canonicalActionId = orientation === "entities-by-actions" ? column.id : axisItem.id;
      const currentCell = cells[cellId(canonicalEntityId, canonicalActionId)];
      if (!currentCell) return;
      rowCells[column.id] = currentCell;
      const contributesToSummary =
        column.visible && (orientation === "entities-by-actions" || column.isMetric === true);
      if (contributesToSummary) {
        total += currentCell.count;
        if (currentCell.count > 0) populatedCellCount += 1;
      }
    });

    return {
      ...axisItem,
      cells: rowCells,
      total,
      average: average(total, populatedCellCount),
    };
  });

const orient = (
  sport: MatrixData["sport"],
  entities: MatrixColumn[],
  actions: MatrixColumn[],
  cells: Record<string, MatrixCell>,
  sourceTagCount: number,
  orientation: MatrixOrientation
): MatrixData => {
  const rowAxis = orientation === "entities-by-actions" ? entities : actions;
  const columnAxis = orientation === "entities-by-actions" ? actions : entities;
  return {
    sport,
    orientation,
    entities,
    actions,
    rows: buildRows(rowAxis, columnAxis, cells, orientation),
    columns: columnAxis,
    cells,
    sourceTagCount,
  };
};

export const buildMatrixData = (
  sourceTags: readonly MatrixSourceTag[],
  config: SportMatrixConfig,
  orientation: MatrixOrientation = "entities-by-actions"
): MatrixData => {
  const inputTags = sourceTags.map((tag) => ({ ...tag }));
  const { actions, lookup } = buildActions(inputTags, config);
  const metricDimension = selectMetricDimension(inputTags, config);
  const entities = buildEntities(inputTags, config, metricDimension);
  const actionIdsByObservedKey = new Map<string, string>();
  actions.forEach((action) => {
    const encodedPrefix = "action:observed%3A";
    if (action.id.startsWith(encodedPrefix)) {
      actionIdsByObservedKey.set(decodeURIComponent(action.id.slice(encodedPrefix.length)), action.id);
    }
  });
  const entityIds = new Set(entities.map((entity) => entity.id));
  const resolvedTags: ResolvedTag[] = inputTags.map((source) => ({
    source,
    actionIds: resolveTagActionIds(source, config, lookup, actionIdsByObservedKey),
    entityIds: getTagEntities(source, config, metricDimension)
      .map((entity) => entity.id)
      .filter((entityId) => entityIds.has(entityId)),
  }));
  const cells: Record<string, MatrixCell> = {};

  entities.forEach((entity) => {
    actions.forEach((action) => {
      const id = cellId(entity.id, action.id);
      cells[id] = {
        id,
        rowId: entity.id,
        columnId: action.id,
        count: 0,
        tagIds: [],
        sourceRowIds: [],
        sourceUrls: [],
      };
    });
  });

  resolvedTags.forEach(({ source, actionIds: matchingActionIds, entityIds: matchingEntityIds }) => {
    matchingEntityIds.forEach((currentEntityId) => {
      matchingActionIds.forEach((actionId) => {
        const currentCell = cells[cellId(currentEntityId, actionId)];
        if (!currentCell) return;
        currentCell.count += 1;
        uniquePush(currentCell.sourceRowIds, source.id);
        uniquePush(currentCell.tagIds, source.sourceTagId || source.id);
        uniquePush(currentCell.sourceUrls, source.sourceUrl);
        if (hasValue(source.clipId)) {
          currentCell.clipIds ??= [];
          uniquePush(currentCell.clipIds, source.clipId);
        }
      });
    });
  });

  return orient(config.sport, entities, actions, cells, inputTags.length, orientation);
};

export const orientMatrixData = (matrix: MatrixData, orientation: MatrixOrientation): MatrixData =>
  orient(matrix.sport, matrix.entities, matrix.actions, matrix.cells, matrix.sourceTagCount, orientation);

export const transposeMatrixData = (matrix: MatrixData): MatrixData =>
  orientMatrixData(
    matrix,
    matrix.orientation === "entities-by-actions" ? "actions-by-entities" : "entities-by-actions"
  );
