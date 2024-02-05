import isEmpty from "lodash/isEmpty";
// types
import {
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
  TViewFilterProps,
  TViewFilterQueryParams,
} from "@plane/types";

export class FiltersHelper {
  // computed filters
  computedFilters = (filters: TViewFilters, defaultValues?: Partial<TViewFilters>): TViewFilters => ({
    project: defaultValues?.project || filters?.project || [],
    module: defaultValues?.module || filters?.module || [],
    cycle: defaultValues?.cycle || filters?.cycle || [],
    priority: defaultValues?.priority || filters?.priority || [],
    state: defaultValues?.state || filters?.state || [],
    state_group: defaultValues?.state_group || filters?.state_group || [],
    assignees: defaultValues?.assignees || filters?.assignees || [],
    mentions: defaultValues?.mentions || filters?.mentions || [],
    subscriber: defaultValues?.subscriber || filters?.subscriber || [],
    created_by: defaultValues?.created_by || filters?.created_by || [],
    labels: defaultValues?.labels || filters?.labels || [],
    start_date: defaultValues?.start_date || filters?.start_date || [],
    target_date: defaultValues?.target_date || filters?.target_date || [],
  });

  // computed display filters
  computedDisplayFilters = (
    displayFilters: TViewDisplayFilters,
    defaultValues?: Partial<TViewDisplayFilters>
  ): TViewDisplayFilters => ({
    layout: defaultValues?.layout || displayFilters?.layout || "list",
    group_by: defaultValues?.group_by || displayFilters?.group_by || undefined,
    sub_group_by: defaultValues?.sub_group_by || displayFilters?.sub_group_by || undefined,
    order_by: defaultValues?.order_by || displayFilters?.order_by || "sort_order",
    type: defaultValues?.type || displayFilters?.type || undefined,
    sub_issue: defaultValues?.sub_issue || displayFilters?.sub_issue || false,
    show_empty_groups: defaultValues?.show_empty_groups || displayFilters?.show_empty_groups || false,
    calendar: {
      show_weekends: defaultValues?.calendar?.show_weekends || displayFilters?.calendar?.show_weekends || false,
      layout: defaultValues?.calendar?.layout || displayFilters?.calendar?.layout || "month",
    },
  });

  // computed display properties
  computedDisplayProperties = (
    displayProperties: TViewDisplayProperties,
    defaultValues?: Partial<TViewDisplayProperties>
  ): TViewDisplayProperties => ({
    assignee: defaultValues?.assignee || displayProperties?.assignee || true,
    start_date: defaultValues?.start_date || displayProperties?.start_date || true,
    due_date: defaultValues?.due_date || displayProperties?.due_date || true,
    labels: defaultValues?.labels || displayProperties?.labels || true,
    priority: defaultValues?.priority || displayProperties?.priority || true,
    state: defaultValues?.state || displayProperties?.state || true,
    sub_issue_count: defaultValues?.sub_issue_count || displayProperties?.sub_issue_count || true,
    attachment_count: defaultValues?.attachment_count || displayProperties?.attachment_count || true,
    link: defaultValues?.link || displayProperties?.link || true,
    estimate: defaultValues?.estimate || displayProperties?.estimate || true,
    key: defaultValues?.key || displayProperties?.key || true,
    created_on: defaultValues?.created_on || displayProperties?.created_on || true,
    updated_on: defaultValues?.updated_on || displayProperties?.updated_on || true,
  });

  // compute filters and display_filters issue query parameters
  computeAppliedFiltersQueryParameters = (
    filters: TViewFilterProps,
    acceptableParamsByLayout: string[]
  ): { params: any; query: string } => {
    const paramsObject: Partial<Record<TViewFilterQueryParams, string | boolean>> = {};
    let paramsString = "";

    const filteredParams: Partial<Record<TViewFilterQueryParams, undefined | string[] | boolean | string>> = {
      // issue filters
      priority: filters.filters?.priority || undefined,
      state_group: filters.filters?.state_group || undefined,
      state: filters.filters?.state || undefined,
      assignees: filters.filters?.assignees || undefined,
      mentions: filters.filters?.mentions || undefined,
      created_by: filters.filters?.created_by || undefined,
      labels: filters.filters?.labels || undefined,
      start_date: filters.filters?.start_date || undefined,
      target_date: filters.filters?.target_date || undefined,
      project: filters.filters?.project || undefined,
      subscriber: filters.filters?.subscriber || undefined,
      // display filters
      type: filters?.display_filters?.type || undefined,
      sub_issue: filters?.display_filters?.sub_issue || true,
    };

    Object.keys(filteredParams).forEach((key) => {
      const _key = key as TViewFilterQueryParams;
      const _value: string | boolean | string[] | undefined = filteredParams[_key];
      if (_value != undefined && acceptableParamsByLayout.includes(_key))
        paramsObject[_key] = Array.isArray(_value) ? _value.join(",") : _value;
    });

    if (paramsObject && !isEmpty(paramsObject)) {
      paramsString = Object.keys(paramsObject)
        .map((key) => {
          const _key = key as TViewFilterQueryParams;
          const _value: string | boolean | undefined = paramsObject[_key];
          if (!undefined) return `${_key}=${_value}`;
        })
        .join("&");
    }

    return { params: paramsObject, query: paramsString };
  };
}
