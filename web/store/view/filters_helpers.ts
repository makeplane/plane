import isEmpty from "lodash/isEmpty";
// types
import { TFilters, TDisplayFilters, TDisplayProperties, TFilterProps, TFilterQueryParams } from "@plane/types";

export class FiltersHelper {
  // computed filters
  computedFilters = (filters: TFilters, defaultValues?: Partial<TFilters>): TFilters => ({
    project: filters?.project || defaultValues?.project || [],
    priority: filters?.priority || defaultValues?.priority || [],
    state: filters?.state || defaultValues?.state || [],
    state_group: filters?.state_group || defaultValues?.state_group || [],
    assignees: filters?.assignees || defaultValues?.assignees || [],
    mentions: filters?.mentions || defaultValues?.mentions || [],
    subscriber: filters?.subscriber || defaultValues?.subscriber || [],
    created_by: filters?.created_by || defaultValues?.created_by || [],
    labels: filters?.labels || defaultValues?.labels || [],
    start_date: filters?.start_date || defaultValues?.start_date || [],
    target_date: filters?.target_date || defaultValues?.target_date || [],
  });

  // computed display filters
  computedDisplayFilters = (
    displayFilters: TDisplayFilters,
    defaultValues?: Partial<TDisplayFilters>
  ): TDisplayFilters => ({
    layout: displayFilters?.layout || defaultValues?.layout || "list",
    group_by: displayFilters?.group_by || defaultValues?.group_by || "none",
    sub_group_by: displayFilters?.sub_group_by || defaultValues?.sub_group_by || undefined,
    order_by: displayFilters?.order_by || defaultValues?.order_by || "sort_order",
    type: displayFilters?.type || defaultValues?.type || undefined,
    sub_issue: displayFilters?.sub_issue || defaultValues?.sub_issue || false,
    show_empty_groups: displayFilters?.show_empty_groups || defaultValues?.show_empty_groups || false,
    calendar: {
      show_weekends: displayFilters?.calendar?.show_weekends || defaultValues?.calendar?.show_weekends || false,
      layout: displayFilters?.calendar?.layout || defaultValues?.calendar?.layout || "month",
    },
  });

  // computed display properties
  computedDisplayProperties = (
    displayProperties: TDisplayProperties,
    defaultValues?: Partial<TDisplayProperties>
  ): TDisplayProperties => ({
    assignee: displayProperties?.assignee || defaultValues?.assignee || true,
    start_date: displayProperties?.start_date || defaultValues?.start_date || true,
    due_date: displayProperties?.due_date || defaultValues?.due_date || true,
    labels: displayProperties?.labels || defaultValues?.labels || true,
    priority: displayProperties?.priority || defaultValues?.priority || true,
    state: displayProperties?.state || defaultValues?.state || true,
    sub_issue_count: displayProperties?.sub_issue_count || defaultValues?.sub_issue_count || true,
    attachment_count: displayProperties?.attachment_count || defaultValues?.attachment_count || true,
    link: displayProperties?.link || defaultValues?.link || true,
    estimate: displayProperties?.estimate || defaultValues?.estimate || true,
    key: displayProperties?.key || defaultValues?.key || true,
    created_on: displayProperties?.created_on || defaultValues?.created_on || true,
    updated_on: displayProperties?.updated_on || defaultValues?.updated_on || true,
  });

  // compute filters and display_filters issue query parameters
  computeAppliedFiltersQueryParameters = (
    filters: TFilterProps,
    acceptableParamsByLayout: string[]
  ): { params: any; query: string } => {
    const paramsObject: Partial<Record<TFilterQueryParams, string | boolean>> = {};
    let paramsString = "";

    const filteredParams: Partial<Record<TFilterQueryParams, undefined | string[] | boolean | string>> = {
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
      const _key = key as TFilterQueryParams;
      const _value: string | boolean | string[] | undefined = filteredParams[_key];
      if (_value != undefined && acceptableParamsByLayout.includes(_key))
        paramsObject[_key] = Array.isArray(_value) ? _value.join(",") : _value;
    });

    if (paramsObject && !isEmpty(paramsObject)) {
      paramsString = Object.keys(paramsObject)
        .map((key) => {
          const _key = key as TFilterQueryParams;
          const _value: string | boolean | undefined = paramsObject[_key];
          if (!undefined) return `${_key}=${_value}`;
        })
        .join("&");
    }

    return { params: paramsObject, query: paramsString };
  };
}
