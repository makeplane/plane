"use client";

import { FC, useCallback } from "react";
import { cloneDeep } from "lodash-es";
import { observer } from "mobx-react";
// types
import { IIssueFilterOptions } from "@plane/types";
// components
import { useViewIssuesFilter } from "@/plane-web/hooks/store/use-view-issues-filter";
//
import { AppliedFiltersList } from "./filters-list";

type Props = {
  anchor: string;
};

export const ViewAppliedFilters: FC<Props> = observer((props) => {
  const { anchor } = props;
  // store hooks
  const { getIssueFilters, initIssueFilters, updateIssueFilters } = useViewIssuesFilter();
  // derived values
  const issueFilters = getIssueFilters(anchor);

  const handleFilters = useCallback(
    (key: keyof IIssueFilterOptions, value: string | null) => {
      let newValues = cloneDeep(issueFilters?.[key]) ?? [];

      if (value === null) newValues = [];
      else if (newValues.includes(value)) newValues.splice(newValues.indexOf(value), 1);

      updateIssueFilters(anchor, key, newValues);
    },
    [anchor, issueFilters, updateIssueFilters]
  );

  const handleRemoveAllFilters = () => {
    initIssueFilters(anchor, {}, true);
  };

  if (!issueFilters) return <></>;

  const appliedFilters: any = {};
  Object.entries(issueFilters).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key] = value;
  });

  if (Object.keys(appliedFilters).length === 0) return <></>;

  return (
    <div className="border-b border-custom-border-200 bg-custom-background-100 p-4">
      <AppliedFiltersList
        appliedFilters={appliedFilters || {}}
        handleRemoveFilter={handleFilters}
        handleClearAllFilters={handleRemoveAllFilters}
      />
    </div>
  );
});
