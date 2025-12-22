import type { ReactNode } from "react";
import { observer } from "mobx-react";
import type { IIssueDisplayProperties } from "@plane/types";

interface IWithDisplayPropertiesHOC {
  displayProperties?: IIssueDisplayProperties;
  shouldRenderProperty?: (displayProperties: IIssueDisplayProperties) => boolean;
  displayPropertyKey: keyof IIssueDisplayProperties | (keyof IIssueDisplayProperties)[];
  children: ReactNode;
}

export const WithDisplayPropertiesHOC = observer(
  ({
    displayProperties,
    shouldRenderProperty,
    displayPropertyKey,
    children,
  }: IWithDisplayPropertiesHOC) => {
    // If displayProperties is not ready yet → allow render
    if (!displayProperties) {
      return <>{children}</>;
    }

    const getDisplayFlag = (key: keyof IIssueDisplayProperties): boolean => {
      // key missing → show by default
      if (!Object.prototype.hasOwnProperty.call(displayProperties, key)) {
        return true;
      }

      // key exists → respect backend value
      return Boolean(displayProperties[key]);
    };

    const shouldDisplay =
      Array.isArray(displayPropertyKey)
        ? displayPropertyKey.every(getDisplayFlag)
        : getDisplayFlag(displayPropertyKey);

    if (!shouldDisplay) return null;

    if (shouldRenderProperty && !shouldRenderProperty(displayProperties)) {
      return null;
    }

    return <>{children}</>;
  }
);
