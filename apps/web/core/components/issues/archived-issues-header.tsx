import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EHeaderVariant, Header } from "@plane/ui";
// components
import { ArchiveTabsList } from "@/components/archives";
import { DisplayFiltersSelection, FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";

export const ArchivedIssuesHeader: FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { currentProjectDetails } = useProject();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  // i18n
  const { t } = useTranslation();
  // for archived issues list layout is the only option
  const activeLayout = "list";

  const handleDisplayFiltersUpdate = (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
    if (!workspaceSlug || !projectId) return;

    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, {
      ...issueFilters?.displayFilters,
      ...updatedDisplayFilter,
    });
  };

  const handleDisplayPropertiesUpdate = (property: Partial<IIssueDisplayProperties>) => {
    if (!workspaceSlug || !projectId) return;

    updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.DISPLAY_PROPERTIES, property);
  };

  return (
    <Header variant={EHeaderVariant.SECONDARY}>
      <Header.LeftItem>
        <ArchiveTabsList />
      </Header.LeftItem>
      <Header.RightItem className="items-center">
        <FiltersDropdown title={t("common.display")} placement="bottom-end">
          <DisplayFiltersSelection
            displayFilters={issueFilters?.displayFilters || {}}
            displayProperties={issueFilters?.displayProperties || {}}
            handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
            handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.archived_issues.layoutOptions[activeLayout] : undefined
            }
            cycleViewDisabled={!currentProjectDetails?.cycle_view}
            moduleViewDisabled={!currentProjectDetails?.module_view}
          />
        </FiltersDropdown>
      </Header.RightItem>
    </Header>
  );
});
