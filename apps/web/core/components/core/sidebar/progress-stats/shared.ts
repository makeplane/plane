import type { TWorkItemFilterCondition } from "@plane/shared-state";
import type { TFilterConditionNodeForDisplay, TFilterValue, TWorkItemFilterProperty } from "@plane/types";

export const PROGRESS_STATS = [
  {
    key: "stat-states",
    i18n_title: "common.states",
  },
  {
    key: "stat-assignees",
    i18n_title: "common.assignees",
  },
  {
    key: "stat-labels",
    i18n_title: "common.labels",
  },
];

type TSelectedFilterProgressStatsType = TFilterConditionNodeForDisplay<TWorkItemFilterProperty, TFilterValue>;

export type TSelectedFilterProgressStats = {
  assignees: TSelectedFilterProgressStatsType | undefined;
  labels: TSelectedFilterProgressStatsType | undefined;
  stateGroups: TSelectedFilterProgressStatsType | undefined;
};

export const createFilterUpdateHandler =
  <T extends string>(
    property: TWorkItemFilterProperty,
    selectedValues: T[],
    handleFiltersUpdate: (condition: TWorkItemFilterCondition) => void
  ) =>
  (value: T | undefined) => {
    const updatedValues = value ? [...selectedValues] : [];

    if (value) {
      if (updatedValues.includes(value)) {
        updatedValues.splice(updatedValues.indexOf(value), 1);
      } else {
        updatedValues.push(value);
      }
    }

    handleFiltersUpdate({ property, operator: "in", value: updatedValues });
  };
