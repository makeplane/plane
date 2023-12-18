import { observer } from "mobx-react-lite";
import { ReactNode } from "react";
import {
  ICycleIssuesFilterStore,
  IModuleIssuesFilterStore,
  IProfileIssuesFilterStore,
  IProjectIssuesFilterStore,
  IViewIssuesFilterStore,
} from "store_legacy/issues";

interface IWithDisplayPropertiesHOC {
  issuesFilter:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  shouldRenderProperty?: boolean;
  displayPropertyKey: string;
  children: ReactNode;
}
export const WithDisplayPropertiesHOC = observer(
  ({ issuesFilter, shouldRenderProperty = true, displayPropertyKey, children }: IWithDisplayPropertiesHOC) => {
    const shouldDisplayPropertyFromFilters = issuesFilter.issueFilters.displayProperties[displayPropertyKey];

    const renderProperty = shouldDisplayPropertyFromFilters && shouldRenderProperty;

    if (!renderProperty) return null;

    return <>{children}</>;
  }
);
