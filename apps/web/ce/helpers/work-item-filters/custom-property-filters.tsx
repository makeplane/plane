import type { LucideIcon } from "lucide-react";
import { Hash, ListFilter, ToggleLeft, Type } from "lucide-react";
// plane imports
import type {
  TFilterConfig,
  TFilterProperty,
  TIssueProperty,
  TIssuePropertyOption,
  TSupportedOperators,
} from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR, COMPARISON_OPERATOR } from "@plane/types";
import {
  createFilterConfig,
  createOperatorConfigEntry,
  getMultiSelectConfig,
  getSingleSelectConfig,
  getDatePickerConfig,
  getDateRangePickerConfig,
} from "@plane/utils";
import type { TFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";

export type TCustomPropertyFilterProperty = `customproperty_${string}`;

export const getCustomPropertyFilterKey = (propertyId: string): TCustomPropertyFilterProperty =>
  `customproperty_${propertyId}`;

type TCustomPropertyFilterMeta = {
  property_type: TIssueProperty["property_type"];
};

type TCreateCustomPropertyFilterParams = TFiltersOperatorConfigs & {
  property: TIssueProperty;
  filterIcon: LucideIcon;
};

const BOOLEAN_OPTIONS = [
  { id: "true", label: "True", value: "true" },
  { id: "false", label: "False", value: "false" },
];

const getPropertyIcon = (propertyType: TIssueProperty["property_type"]): LucideIcon => {
  switch (propertyType) {
    case "number":
      return Hash;
    case "boolean":
      return ToggleLeft;
    case "select":
    case "multi_select":
      return ListFilter;
    default:
      return Type;
  }
};

const getSelectOptions = (options: TIssuePropertyOption[]) =>
  options.map((opt, index) => ({
    id: `${index}-${opt.value}`,
    label: opt.value,
    value: opt.value,
    color: opt.color,
  }));

export const getCustomPropertyFilterConfig = (
  params: TCreateCustomPropertyFilterParams
): TFilterConfig<TFilterProperty> | null => {
  const { property, allowedOperators, allowNegative } = params;
  const key = getCustomPropertyFilterKey(property.id);
  const filterIcon = getPropertyIcon(property.property_type);
  const operatorConfigs = { allowedOperators, allowNegative };

  const baseMeta = {
    customPropertyMeta: {
      property_type: property.property_type,
    } satisfies TCustomPropertyFilterMeta,
  };

  switch (property.property_type) {
    case "select":
      return createFilterConfig<TFilterProperty>({
        id: key,
        label: property.name,
        filterIcon,
        isEnabled: true,
        ...baseMeta,
        supportedOperatorConfigsMap: new Map([
          createOperatorConfigEntry(COLLECTION_OPERATOR.IN, operatorConfigs, (updatedParams) =>
            getMultiSelectConfig(
              {
                items: getSelectOptions(property.options ?? []),
                getId: (item) => item.id,
                getLabel: (item) => item.label,
                getValue: (item) => item.value,
                getIconData: (item) => item.color,
              },
              {
                singleValueOperator: EQUALITY_OPERATOR.EXACT as TSupportedOperators,
                ...updatedParams,
              },
              {
                getOptionIcon: (color) =>
                  color ? (
                    <span className="flex size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  ) : null,
              }
            )
          ),
        ]),
      });

    case "multi_select":
      return createFilterConfig<TFilterProperty>({
        id: key,
        label: property.name,
        filterIcon,
        isEnabled: true,
        ...baseMeta,
        supportedOperatorConfigsMap: new Map([
          createOperatorConfigEntry(COLLECTION_OPERATOR.IN, operatorConfigs, (updatedParams) =>
            getMultiSelectConfig(
              {
                items: getSelectOptions(property.options ?? []),
                getId: (item) => item.id,
                getLabel: (item) => item.label,
                getValue: (item) => item.value,
              },
              {
                singleValueOperator: EQUALITY_OPERATOR.EXACT as TSupportedOperators,
                ...updatedParams,
              }
            )
          ),
        ]),
      });

    case "boolean":
      return createFilterConfig<TFilterProperty>({
        id: key,
        label: property.name,
        filterIcon,
        isEnabled: true,
        ...baseMeta,
        supportedOperatorConfigsMap: new Map([
          createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, operatorConfigs, (updatedParams) =>
            getSingleSelectConfig(
              {
                items: BOOLEAN_OPTIONS,
                getId: (item) => item.id,
                getLabel: (item) => item.label,
                getValue: (item) => item.value,
              },
              updatedParams
            )
          ),
        ]),
      });

    case "date":
      return createFilterConfig<TFilterProperty>({
        id: key,
        label: property.name,
        filterIcon,
        isEnabled: true,
        ...baseMeta,
        supportedOperatorConfigsMap: new Map([
          createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, operatorConfigs, (updatedParams) =>
            getDatePickerConfig(updatedParams)
          ),
          createOperatorConfigEntry(COMPARISON_OPERATOR.RANGE, operatorConfigs, (updatedParams) =>
            getDateRangePickerConfig(updatedParams)
          ),
        ]),
      });

    case "number":
    case "text":
      return createFilterConfig<TFilterProperty>({
        id: key,
        label: property.name,
        filterIcon,
        isEnabled: true,
        ...baseMeta,
        supportedOperatorConfigsMap: new Map([
          createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, operatorConfigs, (updatedParams) => ({
            ...updatedParams,
            ...baseMeta,
          })),
        ]),
      });

    default:
      return null;
  }
};
