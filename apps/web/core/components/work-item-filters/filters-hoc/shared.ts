// plane imports
import { TSaveViewOptions, TUpdateViewOptions } from "@plane/constants";
import { IFilterInstance } from "@plane/shared-state";
import { EIssuesStoreType, IIssueFilters, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";

export type TSharedWorkItemFiltersProps = {
  entityType: EIssuesStoreType; // entity type (project, cycle, workspace, teamspace, etc)
  filtersToShowByLayout: TWorkItemFilterProperty[];
  updateFilters: (updatedFilters: TWorkItemFilterExpression) => void;
  isTemporary?: boolean;
} & ({ isTemporary: true; entityId?: string } | { isTemporary?: false; entityId: string }); // entity id (project_id, cycle_id, workspace_id, etc)

export type TSharedWorkItemFiltersHOCProps = TSharedWorkItemFiltersProps & {
  children:
    | React.ReactNode
    | ((props: {
        filter: IFilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression> | undefined;
      }) => React.ReactNode);
  initialWorkItemFilters: IIssueFilters | undefined;
};

export type TEnableSaveViewProps = {
  enableSaveView?: boolean;
  saveViewOptions?: Omit<TSaveViewOptions<TWorkItemFilterExpression>, "onViewSave">;
};

export type TEnableUpdateViewProps = {
  enableUpdateView?: boolean;
  updateViewOptions?: Omit<TUpdateViewOptions<TWorkItemFilterExpression>, "onViewUpdate">;
};
