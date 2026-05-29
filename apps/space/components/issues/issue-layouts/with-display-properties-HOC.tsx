import { observer } from "mobx-react";
// plane imports
import type { IIssueDisplayProperties } from "@plane/types";

interface IWithDisplayPropertiesHOC {
  displayProperties: IIssueDisplayProperties;
  shouldRenderProperty?: (displayProperties: IIssueDisplayProperties) => boolean;
  displayPropertyKey: keyof IIssueDisplayProperties | (keyof IIssueDisplayProperties)[];
  children: React.ReactNode;
}

export const WithDisplayPropertiesHOC = observer(function WithDisplayPropertiesHOC({
  displayProperties,
  shouldRenderProperty,
  displayPropertyKey,
  children,
}: IWithDisplayPropertiesHOC) {
  let shouldDisplayPropertyFromFilters = false;
  if (Array.isArray(displayPropertyKey))
    shouldDisplayPropertyFromFilters = displayPropertyKey.every((key) => !!displayProperties[key]);
  else shouldDisplayPropertyFromFilters = !!displayProperties[displayPropertyKey];

  const renderProperty =
    shouldDisplayPropertyFromFilters && (shouldRenderProperty ? shouldRenderProperty(displayProperties) : true);

  if (!renderProperty) return null;

  return <>{children}</>;
});
