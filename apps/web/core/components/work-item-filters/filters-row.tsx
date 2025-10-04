import { observer } from "mobx-react";
// plane imports
import { IWorkItemFilterInstance } from "@plane/shared-state";
import { TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
// components
import { FiltersRow, TFiltersRowProps } from "@/components/rich-filters/filters-row";

type TWorkItemFiltersRowProps = TFiltersRowProps<TWorkItemFilterProperty, TWorkItemFilterExpression> & {
  filter: IWorkItemFilterInstance;
};

export const WorkItemFiltersRow = observer((props: TWorkItemFiltersRowProps) => <FiltersRow {...props} />);
