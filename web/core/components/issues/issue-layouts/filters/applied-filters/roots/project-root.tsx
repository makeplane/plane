import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IIssueFilterOptions } from "@plane/types";
// hooks
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { AppliedFiltersList, SaveFilterView } from "@/components/issues";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useLabel, useProjectState, useUserPermissions } from "@/hooks/store";
import { useIssues } from "@/hooks/store/use-issues";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

// types

export const ProjectAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
  };
  // store hooks
  const { projectLabels } = useLabel();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT);
  const { allowPermissions } = useUserPermissions();

  const { projectStates } = useProjectState();
  // derived values
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const userFilters = issueFilters?.filters;
  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !projectId) return;
    if (!value) {
      updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
        [key]: null,
      });
      return;
    }

    let newValues = issueFilters?.filters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      [key]: newValues,
    });
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, { ...newFilters });
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem>
        <AppliedFiltersList
          appliedFilters={appliedFilters}
          handleClearAllFilters={handleClearAllFilters}
          handleRemoveFilter={handleRemoveFilter}
          labels={projectLabels ?? []}
          states={projectStates}
        />
      </Header.LeftItem>
      <Header.RightItem>
        {isEditingAllowed && (
          <SaveFilterView
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            filterParams={{
              filters: appliedFilters,
              display_filters: issueFilters?.displayFilters,
              display_properties: issueFilters?.displayProperties,
            }}
          />
        )}
      </Header.RightItem>
    </Header>
  );
});
