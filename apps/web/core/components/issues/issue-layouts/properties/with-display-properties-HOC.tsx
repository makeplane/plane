import type { ReactNode } from "react";
import { observer } from "mobx-react";
import type { IIssueDisplayProperties } from "@plane/types";

interface IWithDisplayPropertiesHOC {
  displayProperties: IIssueDisplayProperties;
  shouldRenderProperty?: (displayProperties: IIssueDisplayProperties) => boolean;
  displayPropertyKey: keyof IIssueDisplayProperties | (keyof IIssueDisplayProperties)[];
  children: ReactNode;
}

export const WithDisplayPropertiesHOC = observer(
  ({ displayProperties, shouldRenderProperty, displayPropertyKey, children }: IWithDisplayPropertiesHOC) => {

    const getDisplayFlag = (key: keyof IIssueDisplayProperties) => {
      // If the backend does NOT return the key → default to true (show it)
      if (!(key in displayProperties)) return true;

      // Otherwise use the backend value
      return !!displayProperties[key];
    };

    let shouldDisplayPropertyFromFilters = false;

    if (Array.isArray(displayPropertyKey)) {
      shouldDisplayPropertyFromFilters = displayPropertyKey.every((key) => getDisplayFlag(key));
    } else {
      shouldDisplayPropertyFromFilters = getDisplayFlag(displayPropertyKey);
    }

    const renderProperty =
      shouldDisplayPropertyFromFilters && (shouldRenderProperty ? shouldRenderProperty(displayProperties) : true);

    if (!renderProperty) return null;

    return <>{children}</>;
  }
);

