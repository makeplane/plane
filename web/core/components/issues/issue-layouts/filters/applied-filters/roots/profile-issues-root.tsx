import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssueFilterType } from "@plane/constants";
import { EIssuesStoreType, IIssueFilterOptions } from "@plane/types";
// hooks
// components
import { AppliedFiltersList } from "@/components/issues";
// types
import { useIssues, useLabel } from "@/hooks/store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

export const ProfileIssuesAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, userId } = useParams();
  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROFILE);

  const { workspaceLabels } = useLabel();
  // derived values
  const userFilters = issueFilters?.filters;

  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !userId) return;
    if (!value) {
      updateFilters(workspaceSlug.toString(), undefined, EIssueFilterType.FILTERS, { [key]: null }, userId.toString());
      return;
    }

    let newValues = issueFilters?.filters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(
      workspaceSlug.toString(),
      undefined,
      EIssueFilterType.FILTERS,
      {
        [key]: newValues,
      },
      userId.toString()
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !userId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(workspaceSlug.toString(), undefined, EIssueFilterType.FILTERS, { ...newFilters }, userId.toString());
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="p-4 flex-shrink-0">
      <AppliedFiltersList
        appliedFilters={appliedFilters}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={workspaceLabels ?? []}
        states={[]}
      />
    </div>
  );
});
