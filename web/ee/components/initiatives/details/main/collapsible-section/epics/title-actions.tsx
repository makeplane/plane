import { FC } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
// components
import { SubIssueDisplayFilters } from "@/components/issues/issue-detail-widgets/sub-issues";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type TEpicsTitleActionsProps = {
  disabled: boolean;
  toggleEpicModal: (value?: boolean) => void;
  initiativeId: string;
  workspaceSlug: string;
};

export const EpicsTitleActions: FC<TEpicsTitleActionsProps> = observer((props) => {
  const { disabled, toggleEpicModal, initiativeId, workspaceSlug } = props;

  // store hooks
  const {
    initiative: {
      epics: {
        filters: { getInitiativeEpicsFiltersById, updateSubIssueFilters },
      },
    },
  } = useInitiatives();

  // derived values
  const epicsFilters = getInitiativeEpicsFiltersById(initiativeId);
  const displayProperties = epicsFilters?.displayProperties;
  const displayFilters = epicsFilters?.displayFilters;

  const handleDisplayPropertiesUpdate = (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => {
    updateSubIssueFilters(workspaceSlug, EIssueFilterType.DISPLAY_PROPERTIES, updatedDisplayProperties, initiativeId);
  };

  const handleDisplayFiltersUpdate = (updatedDisplayFilters: Partial<IIssueDisplayFilterOptions>) => {
    updateSubIssueFilters(workspaceSlug, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilters, initiativeId);
  };

  const layoutDisplayFiltersOptions = ISSUE_DISPLAY_FILTERS_BY_PAGE.sub_work_items.list;

  const handlePropagation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 items-center" onClick={handlePropagation}>
      <SubIssueDisplayFilters
        isEpic
        layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
        displayProperties={displayProperties ?? {}}
        displayFilters={displayFilters ?? {}}
        handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
        handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
      />
      {!disabled && (
        <button type="button" onClick={() => toggleEpicModal()}>
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
