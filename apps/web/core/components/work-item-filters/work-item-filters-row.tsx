import { observer } from "mobx-react";
// plane imports
import { TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
// components
import { FiltersRow, TFiltersRowProps } from "@/components/rich-filters/filters-row";

type TWorkItemFiltersRowProps = TFiltersRowProps<TWorkItemFilterProperty, TWorkItemFilterExpression>;

export const WorkItemFiltersRow = observer((props: TWorkItemFiltersRowProps) => (
  <FiltersRow
    buttonConfig={{
      variant: "neutral-primary",
    }}
    {...props}
  />
));
