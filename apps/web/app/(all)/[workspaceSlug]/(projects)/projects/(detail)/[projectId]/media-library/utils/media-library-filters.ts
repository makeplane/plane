import { FilterAdapter } from "@plane/shared-state";
import type {
  TFilterConditionNodeForDisplay,
  TFilterConfig,
  TFilterExpression,
  TFilterProperty,
  TFilterValue,
  TSupportedOperators,
} from "@plane/types";
import { COLLECTION_OPERATOR, COMPARISON_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
import {
  createFilterConfig,
  createOperatorConfigEntry,
  getDatePickerConfig,
  getDateRangePickerConfig,
  getMultiSelectConfig,
  getSingleSelectConfig,
} from "@plane/utils";

import type { TMediaItem } from "../types";

export type TMediaLibraryFilterProperty = string;

export type TMediaLibraryExternalFilter = {
  expression?: TFilterExpression<TMediaLibraryFilterProperty> | null;
};

const META_PROPERTY_PREFIX = "meta.";

export const META_FILTER_EXCLUDED_KEYS = new Set([
  "duration",
  "duration_sec",
  "durationSec",
  "for",
  "hls",
  "kind",
  "source",
  "source_format",
  "source format",
]);

const META_FILTER_ALLOWED_KEYS = new Set([
  "category",
  "level",
  "season",
  "opposition",
  "sport",
  "program",
  "start time",
  "start date",
]);

const toMetaProperty = (key: string) => `${META_PROPERTY_PREFIX}${key}`;
const START_DATE_META_KEY = "start date";
const START_TIME_META_KEY = "start time";
const START_DATE_META_KEY_ALIASES = ["start_date", "startDate", "start date"];
const START_TIME_META_KEY_ALIASES = ["start_time", "startTime", "start time"];

const toDisplayLabel = (value: string) => {
  if (!value) return value;
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : value;
};

const normalizeMetaKey = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const isAllowedMetaFilterKey = (key: string) => META_FILTER_ALLOWED_KEYS.has(normalizeMetaKey(key));
const isStartDateMetaFilterKey = (key: string) => normalizeMetaKey(key) === START_DATE_META_KEY;
const isStartTimeMetaFilterKey = (key: string) => normalizeMetaKey(key) === START_TIME_META_KEY;

const getMetaValueByKey = (meta: Record<string, unknown>, key: string) => {
  if (Object.prototype.hasOwnProperty.call(meta, key)) {
    return meta[key];
  }

  if (isStartDateMetaFilterKey(key)) {
    for (const alias of START_DATE_META_KEY_ALIASES) {
      if (Object.prototype.hasOwnProperty.call(meta, alias)) return meta[alias];
    }
  }

  if (isStartTimeMetaFilterKey(key)) {
    for (const alias of START_TIME_META_KEY_ALIASES) {
      if (Object.prototype.hasOwnProperty.call(meta, alias)) return meta[alias];
    }
  }

  return undefined;
};

const getMetaKeyFromProperty = (property: TFilterProperty) =>
  property.startsWith(META_PROPERTY_PREFIX) ? property.slice(META_PROPERTY_PREFIX.length) : "";

const META_OBJECT_DISPLAY_KEYS = ["name", "title", "label", "display_name", "displayName", "team_name", "teamName"];

const getObjectDisplayValues = (value: Record<string, unknown>): string[] => {
  for (const key of META_OBJECT_DISPLAY_KEYS) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return [candidate.trim()];
  }
  const rawValue = value.value;
  if (typeof rawValue === "string" && rawValue.trim()) return [rawValue.trim()];
  return [];
};

const normalizeMetaValues = (value: unknown): string[] => {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeMetaValues(entry));
  }
  if (typeof value === "object") {
    const displayValues = getObjectDisplayValues(value as Record<string, unknown>);
    if (displayValues.length > 0) return displayValues;
  }
  return [];
};

export const collectMetaFilterOptions = (items: TMediaItem[]) => {
  const valuesByKey = new Map<string, Set<string>>();

  for (const item of items) {
    const meta = item.meta ?? {};
    for (const [key, value] of Object.entries(meta)) {
      if (META_FILTER_EXCLUDED_KEYS.has(key)) continue;
      if (!isAllowedMetaFilterKey(key)) continue;
      const normalizedValues = normalizeMetaValues(value);
      if (normalizedValues.length === 0) continue;
      const existing = valuesByKey.get(key) ?? new Set<string>();
      for (const entry of normalizedValues) {
        if (entry.trim()) existing.add(entry);
      }
      valuesByKey.set(key, existing);
    }
  }

  const keys = Array.from(valuesByKey.keys()).sort((left, right) => left.localeCompare(right));
  const sortedValuesByKey = new Map<string, string[]>();

  for (const key of keys) {
    sortedValuesByKey.set(
      key,
      Array.from(valuesByKey.get(key) ?? []).sort((left, right) => left.localeCompare(right))
    );
  }

  return { keys, valuesByKey: sortedValuesByKey };
};

type TOperatorConfigParams = {
  allowedOperators: Set<TSupportedOperators>;
  allowNegative: boolean;
};

export const buildMetaFilterConfigs = (
  metaOptions: ReturnType<typeof collectMetaFilterOptions>,
  operatorConfigs: TOperatorConfigParams
): TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[] => {
  const configKeys = [...metaOptions.keys];
  if (!configKeys.some((key) => isStartDateMetaFilterKey(key))) configKeys.push("start_date");
  if (!configKeys.some((key) => isStartTimeMetaFilterKey(key))) configKeys.push("start_time");

  return configKeys.map((key) => {
    const values = metaOptions.valuesByKey.get(key) ?? [];
    const isTemporalFilter = isStartDateMetaFilterKey(key) || isStartTimeMetaFilterKey(key);
    const isConfigEnabled = isTemporalFilter ? false : values.length > 0;
    const baseParams = {
      isEnabled: values.length > 0 || isTemporalFilter,
      allowNegative: operatorConfigs.allowNegative,
      allowedOperators: operatorConfigs.allowedOperators,
    };

    if (isTemporalFilter) {
      return createFilterConfig<TMediaLibraryFilterProperty, TFilterValue>({
        id: toMetaProperty(key),
        label: toDisplayLabel(key),
        isEnabled: isConfigEnabled,
        allowMultipleFilters: false,
        supportedOperatorConfigsMap: new Map([
          createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, baseParams, (updatedParams) =>
            getDatePickerConfig({ ...updatedParams })
          ),
          createOperatorConfigEntry(COMPARISON_OPERATOR.RANGE, baseParams, (updatedParams) =>
            getDateRangePickerConfig({ ...updatedParams })
          ),
        ]),
      });
    }

    const optionTransforms = {
      items: values,
      getId: (value: string) => value,
      getLabel: (value: string) => toDisplayLabel(value),
      getValue: (value: string) => value,
    };

    return createFilterConfig<TMediaLibraryFilterProperty, TFilterValue>({
      id: toMetaProperty(key),
      label: toDisplayLabel(key),
      isEnabled: isConfigEnabled,
      allowMultipleFilters: false,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, baseParams, (updatedParams) =>
          getSingleSelectConfig(optionTransforms, { ...updatedParams })
        ),
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, baseParams, (updatedParams) =>
          getMultiSelectConfig(optionTransforms, {
            singleValueOperator: EQUALITY_OPERATOR.EXACT,
            ...updatedParams,
          })
        ),
      ]),
    });
  });
};

const parseDateComparableValue = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseTimeComparableValue = (value: string) => {
  const parsedDate = Date.parse(value);
  if (!Number.isNaN(parsedDate)) {
    const date = new Date(parsedDate);
    return date.getHours() * 60 + date.getMinutes();
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = (match[3] ?? "").toLowerCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    const isPM = meridiem === "pm";
    hours = (hours % 12) + (isPM ? 12 : 0);
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

const matchesRangeCondition = (
  itemValues: string[],
  conditionValues: string[],
  parser: (value: string) => number | null
) => {
  if (conditionValues.length < 2) return true;

  const lowerComparable = parser(conditionValues[0]);
  const upperComparable = parser(conditionValues[1]);
  if (lowerComparable === null || upperComparable === null) return true;

  const lowerBound = Math.min(lowerComparable, upperComparable);
  const upperBound = Math.max(lowerComparable, upperComparable);

  return itemValues.some((value) => {
    const comparable = parser(value);
    return comparable !== null && comparable >= lowerBound && comparable <= upperBound;
  });
};

export const matchesMediaLibraryFilters = (
  item: TMediaItem,
  conditions: TFilterConditionNodeForDisplay<TMediaLibraryFilterProperty, TFilterValue>[]
) => {
  if (conditions.length === 0) return true;

  return conditions.every((condition) => {
    const metaKey = getMetaKeyFromProperty(condition.property);
    if (!metaKey || META_FILTER_EXCLUDED_KEYS.has(metaKey) || !isAllowedMetaFilterKey(metaKey)) return true;

    const meta = (item.meta ?? {}) as Record<string, unknown>;
    const itemValues = normalizeMetaValues(getMetaValueByKey(meta, metaKey));
    if (itemValues.length === 0) return false;

    const conditionValues = (Array.isArray(condition.value) ? condition.value : [condition.value])
      .filter((value) => value !== null && value !== undefined && `${value}`.trim() !== "")
      .map((value) => String(value));

    if (conditionValues.length === 0) return true;

    if (condition.operator === EQUALITY_OPERATOR.EXACT || condition.operator === COLLECTION_OPERATOR.IN) {
      return conditionValues.some((value) => itemValues.includes(value));
    }

    if (condition.operator === COMPARISON_OPERATOR.RANGE) {
      if (isStartDateMetaFilterKey(metaKey)) {
        return matchesRangeCondition(itemValues, conditionValues, parseDateComparableValue);
      }
      if (isStartTimeMetaFilterKey(metaKey)) {
        return matchesRangeCondition(itemValues, conditionValues, parseTimeComparableValue);
      }
      return true;
    }

    return true;
  });
};

class MediaLibraryFiltersAdapter extends FilterAdapter<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter> {
  toInternal(externalFilter: TMediaLibraryExternalFilter): TFilterExpression<TMediaLibraryFilterProperty> | null {
    return externalFilter?.expression ?? null;
  }

  toExternal(internalFilter: TFilterExpression<TMediaLibraryFilterProperty> | null): TMediaLibraryExternalFilter {
    return { expression: internalFilter ?? null };
  }
}

export const mediaLibraryFiltersAdapter = new MediaLibraryFiltersAdapter();
