import { observer } from "mobx-react-lite";
import { ReactNode } from "react";
import {
  ICycleIssuesFilterStore,
  IModuleIssuesFilterStore,
  IProfileIssuesFilterStore,
  IProjectIssuesFilterStore,
  IViewIssuesFilterStore,
} from "store_legacy/issues";
import { IIssueDisplayProperties } from "types";

interface IWithDisplayPropertiesHOC {
  issuesFilter:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  getShouldRenderProperty: (displayProperties: IIssueDisplayProperties) => boolean;
  children: ReactNode;
}
export const WithDisplayPropertiesHOC = observer(
  ({ issuesFilter, getShouldRenderProperty, children }: IWithDisplayPropertiesHOC) => {
    const displayProperties = issuesFilter.issueFilters.displayProperties;

    const shouldRenderProperty = getShouldRenderProperty(displayProperties);

    if (!shouldRenderProperty) return null;

    return <>{children}</>;
  }
);
