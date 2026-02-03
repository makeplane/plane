import type {
  TFilterConditionNodeForDisplay,
  TFilterConfig,
  TFilterExpression,
  TFilterProperty,
  TFilterValue,
  TSupportedOperators,
} from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
import { FilterAdapter } from "@plane/shared-state";
import { createFilterConfig, createOperatorConfigEntry, getMultiSelectConfig, getSingleSelectConfig } from "@plane/utils";

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

const toMetaProperty = (key: string) => `${META_PROPERTY_PREFIX}${key}`;

const toDisplayLabel = (value: string) => {
  if (!value) return value;
  const normalized = value.replace(/[_-]+/g, " ").trim();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : value;
};

const getMetaKeyFromProperty = (property: TFilterProperty) =>
  property.startsWith(META_PROPERTY_PREFIX) ? property.slice(META_PROPERTY_PREFIX.length) : "";

const normalizeMetaValues = (value: unknown): string[] => {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeMetaValues(entry));
  }
  return [JSON.stringify(value)];
};

export const collectMetaFilterOptions = (items: TMediaItem[]) => {
  const valuesByKey = new Map<string, Set<string>>();

  for (const item of items) {
    const meta = item.meta ?? {};
    for (const [key, value] of Object.entries(meta)) {
      if (META_FILTER_EXCLUDED_KEYS.has(key)) continue;
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
): TFilterConfig<TMediaLibraryFilterProperty, string>[] =>
  metaOptions.keys.map((key) => {
    const values = metaOptions.valuesByKey.get(key) ?? [];
    const baseParams = {
      isEnabled: values.length > 0,
      allowNegative: operatorConfigs.allowNegative,
      allowedOperators: operatorConfigs.allowedOperators,
    };

    const optionTransforms = {
      items: values,
      getId: (value: string) => value,
      getLabel: (value: string) => toDisplayLabel(value),
      getValue: (value: string) => value,
    };

    return createFilterConfig<TMediaLibraryFilterProperty, string>({
      id: toMetaProperty(key),
      label: toDisplayLabel(key),
      isEnabled: values.length > 0,
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

export const matchesMediaLibraryFilters = (
  item: TMediaItem,
  conditions: TFilterConditionNodeForDisplay<TMediaLibraryFilterProperty, TFilterValue>[]
) => {
  if (conditions.length === 0) return true;

  return conditions.every((condition) => {
    const metaKey = getMetaKeyFromProperty(condition.property);
    if (!metaKey || META_FILTER_EXCLUDED_KEYS.has(metaKey)) return true;

    const itemValues = normalizeMetaValues(item.meta?.[metaKey]);
    if (itemValues.length === 0) return false;

    const conditionValues = (Array.isArray(condition.value) ? condition.value : [condition.value])
      .filter((value) => value !== null && value !== undefined && `${value}`.trim() !== "")
      .map((value) => String(value));

    if (conditionValues.length === 0) return true;

    if (condition.operator === EQUALITY_OPERATOR.EXACT || condition.operator === COLLECTION_OPERATOR.IN) {
      return conditionValues.some((value) => itemValues.includes(value));
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
