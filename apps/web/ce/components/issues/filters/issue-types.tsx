/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Loader } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterIssueTypes = observer(function FilterIssueTypes(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // router
  const { projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectIssueTypes } = useIssueTypes();
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // derived values
  const projectDetails = getProjectById(projectId?.toString());
  const issueTypes = getProjectIssueTypes(projectId?.toString(), false);
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (issueTypes ?? []).filter((issueType) =>
      issueType.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortBy(filteredOptions, [(issueType) => !(appliedFilters ?? []).includes(issueType.id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, issueTypes]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;
    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  if (!projectDetails?.is_issue_type_enabled) return null;

  return (
    <>
      <FilterHeader
        title={`${t("work_item_types.label")}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {issueTypes ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((issueType) => (
                  <FilterOption
                    key={issueType.id}
                    isChecked={!!appliedFilters?.includes(issueType.id)}
                    onClick={() => handleUpdate(issueType.id)}
                    icon={<Logo logo={issueType.logo_props} size={14} />}
                    title={issueType.name}
                  />
                ))}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-11 text-placeholder italic">No matches found</p>
            )
          ) : (
            <Loader className="space-y-2">
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
            </Loader>
          )}
        </div>
      )}
    </>
  );
});
