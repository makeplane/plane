import type {
  MatrixFilterOption,
  MatrixFilterOptions,
  MatrixFilterState,
  MatrixSourceTag,
  SportMatrixAction,
  SportMatrixConfig,
} from "../types/matrix.types";

export const EMPTY_MATRIX_FILTER_STATE: MatrixFilterState = {
  search: "",
  teams: [],
  players: [],
  categories: [],
  periods: [],
};

const normalize = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeAction = (value: string | null | undefined) =>
  normalize(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const hasValue = (value: string | null | undefined) => {
  const normalized = normalize(value);
  return !["", "--", "\u2014", "n/a", "na", "none", "null", "undefined"].includes(normalized);
};

const buildActionLookup = (config: SportMatrixConfig) => {
  const lookup = new Map<string, SportMatrixAction>();
  config.actions.forEach((action) => {
    [action.id, action.label, ...action.aliases].forEach((alias) => {
      const key = normalizeAction(alias);
      if (key && !lookup.has(key)) lookup.set(key, action);
    });
  });
  return lookup;
};

const buildContextLookup = (tag: MatrixSourceTag) => {
  const context = new Map<string, string>();
  Object.entries(tag.context ?? {}).forEach(([key, value]) => {
    const normalizedKey = normalizeAction(key);
    const normalizedValue = normalizeAction(value);
    if (normalizedKey && normalizedValue) context.set(normalizedKey, normalizedValue);
  });
  if (hasValue(tag.result)) context.set("result", normalizeAction(tag.result));
  return context;
};

const resolveActions = (tag: MatrixSourceTag, config: SportMatrixConfig, lookup: Map<string, SportMatrixAction>) => {
  const resolved = new Map<string, SportMatrixAction>();
  const primaryAction = lookup.get(normalizeAction(tag.action));
  if (primaryAction) resolved.set(primaryAction.id, primaryAction);
  const sourceAction = normalizeAction(tag.action);
  const context = buildContextLookup(tag);
  config.actions.forEach((action) => {
    const matches = action.contextRules?.some(
      (rule) =>
        rule.sourceActions.some((candidate) => normalizeAction(candidate) === sourceAction) &&
        Object.entries(rule.values).every(([key, values]) => {
          const contextValue = context.get(normalizeAction(key));
          return Boolean(contextValue && values.some((candidate) => normalizeAction(candidate) === contextValue));
        })
    );
    if (matches) resolved.set(action.id, action);
  });
  return Array.from(resolved.values());
};

const toOptions = (values: readonly (string | null | undefined)[]): MatrixFilterOption[] => {
  const valuesByKey = new Map<string, string>();
  values.forEach((value) => {
    if (!hasValue(value)) return;
    const label = String(value).trim();
    const key = normalize(label);
    if (!valuesByKey.has(key)) valuesByKey.set(key, label);
  });
  return Array.from(valuesByKey.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([, label]) => ({ value: label, label }));
};

export const createEmptyMatrixFilters = (): MatrixFilterState => ({
  search: "",
  teams: [],
  players: [],
  categories: [],
  periods: [],
});

export const clearMatrixFilters = createEmptyMatrixFilters;

export const hasActiveMatrixFilters = (filters: MatrixFilterState) =>
  Boolean(
    filters.search.trim() ||
      filters.teams.length ||
      filters.players.length ||
      filters.categories.length ||
      filters.periods.length
  );

export const buildMatrixFilterOptions = (
  sourceTags: readonly MatrixSourceTag[],
  config: SportMatrixConfig
): MatrixFilterOptions => {
  const lookup = buildActionLookup(config);
  const observedCategories = new Set<string>();
  sourceTags.forEach((tag) => {
    const actions = resolveActions(tag, config, lookup);
    if (actions.length === 0) observedCategories.add("other");
    actions.forEach((action) => observedCategories.add(action.category));
  });
  const categoryOptions = config.categories
    .filter((category) => observedCategories.has(category.id))
    .sort((left, right) => left.order - right.order)
    .map((category) => ({ value: category.id, label: category.label }));
  if (observedCategories.has("other")) categoryOptions.push({ value: "other", label: "Other" });

  return {
    teams: toOptions(sourceTags.map((tag) => tag.team)),
    players: toOptions(sourceTags.map((tag) => tag.player)),
    categories: categoryOptions,
    periods: toOptions(sourceTags.map((tag) => tag.groupValue)),
  };
};

const matchesSelectedValues = (value: string | null | undefined, selected: readonly string[]) => {
  if (selected.length === 0) return true;
  const normalizedValue = normalize(value);
  return selected.some((entry) => normalize(entry) === normalizedValue);
};

export const filterMatrixSourceTags = (
  sourceTags: readonly MatrixSourceTag[],
  filters: MatrixFilterState,
  config: SportMatrixConfig
): MatrixSourceTag[] => {
  const lookup = buildActionLookup(config);
  const search = normalize(filters.search);
  const actionSearch = normalizeAction(filters.search);
  const selectedCategories = new Set(filters.categories.map(normalize));

  return sourceTags.filter((tag) => {
    const configuredActions = resolveActions(tag, config, lookup);
    const categories = configuredActions.length > 0 ? configuredActions.map((action) => action.category) : ["other"];
    if (!matchesSelectedValues(tag.team, filters.teams)) return false;
    if (!matchesSelectedValues(tag.player, filters.players)) return false;
    if (!matchesSelectedValues(tag.groupValue, filters.periods)) return false;
    if (selectedCategories.size > 0 && !categories.some((category) => selectedCategories.has(normalize(category)))) {
      return false;
    }
    if (!search) return true;

    return [
      tag.action,
      ...configuredActions.flatMap((action) => [action.label, action.category]),
      tag.player,
      tag.team,
      tag.groupValue,
      tag.result,
      ...Object.values(tag.context ?? {}),
    ]
      .filter((value): value is string => typeof value === "string")
      .some((value) => normalize(value).includes(search) || normalizeAction(value).includes(actionSearch));
  });
};
