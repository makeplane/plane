"use client";

import { FC, useCallback } from "react";
import { cloneDeep } from "lodash-es";
import { observer } from "mobx-react";
// plane
import { IIssueFilterOptions } from "@plane/types";
// components
import { FiltersDropdown } from "@/components/issues/filters/helpers/dropdown";

// hooks
import { useView } from "@/plane-web/hooks/store/use-published-view";
import { useViewIssuesFilter } from "@/plane-web/hooks/store/use-view-issues-filter";
import { FilterSelection } from "../filters";

type Props = {
  anchor: string;
};

export const ViewIssueFilters: FC<Props> = observer((props) => {
  const { anchor } = props;
  // hooks
  const { possibleFiltersForView } = useView();
  const { getIssueFilters, updateIssueFilters } = useViewIssuesFilter();
  // derived values
  const issueFilters = getIssueFilters(anchor) ?? {};

  const handleFilters = useCallback(
    (key: keyof IIssueFilterOptions, values: string | string[]) => {
      if (!values) return;

      const newValues = cloneDeep(issueFilters?.[key]) ?? [];

      const currValues = Array.isArray(values) ? values : [values];
      for (const value of currValues) {
        if (newValues.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateIssueFilters(anchor, key, newValues);
    },
    [anchor, issueFilters, updateIssueFilters]
  );

  if (!possibleFiltersForView) return <></>;

  return (
    <div className="z-10 relative flex h-full w-full flex-col">
      <FiltersDropdown title="Filters" placement="bottom-end">
        <FilterSelection
          filters={issueFilters}
          possibleFiltersForView={possibleFiltersForView}
          handleFiltersUpdate={handleFilters}
        />
      </FiltersDropdown>
    </div>
  );
});
