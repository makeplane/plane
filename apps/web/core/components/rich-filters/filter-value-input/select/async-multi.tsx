/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  SingleOrArray,
  TFilterProperty,
  TAsyncMultiSelectFilterFieldConfig,
  TFilterConditionNode,
  IFilterOption,
  TAsyncMultiSelectOptions,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { getFilterValueLength, toFilterArray } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";
// local imports
import { getCommonCustomSearchSelectProps, getFormattedOptions } from "./shared";
import { SelectedOptionsDisplay } from "./selected-options-display";

type TAsyncMultiSelectFilterValueInputProps<P extends TFilterProperty> = {
  config: TAsyncMultiSelectFilterFieldConfig<string>;
  condition: TFilterConditionNode<P, string>;
  isDisabled?: boolean;
  onChange: (values: SingleOrArray<string>) => void;
};

const getParams = (search: string, cursor: string) => {
  return { search, cursor: cursor || "10:0:0", per_page: "10" };
};

export const AsyncMultiSelectFilterValueInput = observer(function AsyncMultiSelectFilterValueInput<
  P extends TFilterProperty,
>(props: TAsyncMultiSelectFilterValueInputProps<P>) {
  const { config, condition, isDisabled, onChange } = props;

  const { fetchOptions, fetchSelected } = config;
  const selectedIds = toFilterArray(condition.value) as string[];

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [defaultOptions, setDefaultOptions] = useState<TAsyncMultiSelectOptions<string>>({
    results: [],
    next_cursor: "",
  });
  const [options, setOptions] = useState<IFilterOption<string>[]>([]);
  const [nextCursor, setNextCursor] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const params = getParams("", nextCursor);

        const [fetchedRes, selectedRes] = await Promise.all([
          fetchOptions(params),
          selectedIds?.length ? fetchSelected(selectedIds) : Promise.resolve([]),
        ]);
        const fetchedOptions = fetchedRes.results;
        const fetchedIds = new Set(fetchedOptions.map((option) => option.id));
        const selectedOnly = selectedRes.filter((option) => !fetchedIds.has(option.id));
        const mergedOptions = [...selectedOnly, ...fetchedOptions];

        setOptions(mergedOptions);
        setNextCursor(fetchedRes.next_cursor);
      } catch (error) {
        console.error("Failed to load options:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadOptions();
    return () => {
      setOptions([]);
      setNextCursor("");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSearch = useCallback(
    async (query: string) => {
      if (!query) return;

      try {
        const params = getParams(query, "");
        const res = await fetchOptions(params);

        setOptions(res.results);
        setNextCursor(res.next_cursor);
      } catch (error) {
        console.error("Failed to load search options:", error);
      }
    },
    [fetchOptions]
  );

  const debouncedSearchTerm = useDebounce(query, 500);

  useEffect(() => {
    void loadSearch(query.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const handleSelectChange = (values: string[]) => {
    // when selecting a new option from search options, we need to add the selected options to the options list
    if (query.trim()) {
      const optionsIds = defaultOptions.results.map((option) => option.id);
      const newValues = values.filter((vl) => !selectedIds.includes(vl) && !optionsIds.includes(vl));
      const selectedOptions = options.filter((option) => newValues.includes(option.id));
      setDefaultOptions((prevOptions) => {
        return { results: [...selectedOptions, ...prevOptions.results], next_cursor: prevOptions.next_cursor };
      });
    }
    onChange(values);
  };

  const formattedOptions = useMemo(() => getFormattedOptions<string>(options), [options]);

  const displayOptions = useMemo(() => [...defaultOptions.results, ...options], [defaultOptions.results, options]);

  const onSearchQueryChange = useCallback(
    (query: string) => {
      setQuery((prevQuery) => {
        if (!prevQuery.trim()) {
          setDefaultOptions({ results: options, next_cursor: nextCursor });
        }
        if (!query.trim()) {
          setOptions(defaultOptions.results);
          setNextCursor(defaultOptions.next_cursor);
        }
        return query;
      });
    },
    [options, nextCursor, defaultOptions]
  );

  const fetchMoreOptions = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const search = query.trim();
      const params = getParams(search, nextCursor);
      const res = await fetchOptions(params);

      const moreOptions = res.results;
      setOptions((prevOptions) => {
        const prevIds = new Set(prevOptions.map((option) => option.id));
        const newOptions = moreOptions.filter((option) => !prevIds.has(option.id));
        return [...prevOptions, ...newOptions];
      });
      setNextCursor(res.next_cursor);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, fetchOptions, query]);

  const onClose = useCallback(() => {
    setQuery("");
    if (query.trim()) {
      setOptions(defaultOptions.results);
      setNextCursor(defaultOptions.next_cursor);
    }
  }, [query, defaultOptions]);

  return (
    <CustomSearchSelect
      {...getCommonCustomSearchSelectProps(isDisabled)}
      value={toFilterArray(condition.value)}
      onChange={handleSelectChange}
      options={formattedOptions}
      multiple
      disabled={loading || isDisabled}
      customButton={
        <SelectedOptionsDisplay<string> selectedValue={loading ? [] : condition.value} options={displayOptions} />
      }
      defaultOpen={getFilterValueLength(condition.value) === 0}
      searchQuery={query}
      onSearchQueryChange={onSearchQueryChange}
      fetchMoreOptions={fetchMoreOptions}
      onClose={onClose}
    />
  );
});
