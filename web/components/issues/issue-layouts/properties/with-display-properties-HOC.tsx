import { observer } from "mobx-react-lite";
import { ReactNode } from "react";
import { IIssueDisplayProperties } from "types";

interface IWithDisplayPropertiesHOC {
  displayProperties: IIssueDisplayProperties;
  shouldRenderProperty?: boolean;
  displayPropertyKey: string;
  children: ReactNode;
}

export const WithDisplayPropertiesHOC = observer(
  ({ displayProperties, shouldRenderProperty = true, displayPropertyKey, children }: IWithDisplayPropertiesHOC) => {
    const shouldDisplayPropertyFromFilters = displayProperties[displayPropertyKey];

    const renderProperty = shouldDisplayPropertyFromFilters && shouldRenderProperty;

    if (!renderProperty) return null;

    return <>{children}</>;
  }
);
