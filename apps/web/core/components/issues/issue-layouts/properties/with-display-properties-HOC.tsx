/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import type { IIssueDisplayProperties } from "@plane/types";

interface IWithDisplayPropertiesHOC {
  displayProperties: IIssueDisplayProperties;
  shouldRenderProperty?: (displayProperties: IIssueDisplayProperties) => boolean;
  displayPropertyKey: keyof IIssueDisplayProperties | (keyof IIssueDisplayProperties)[];
  children: ReactNode;
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
  else {
    const value = displayProperties[displayPropertyKey];
    // Custom properties default to visible when key is absent (undefined)
    if (typeof displayPropertyKey === "string" && displayPropertyKey.startsWith("customproperty_")) {
      shouldDisplayPropertyFromFilters = value !== false;
    } else {
      shouldDisplayPropertyFromFilters = !!value;
    }
  }

  const renderProperty =
    shouldDisplayPropertyFromFilters && (shouldRenderProperty ? shouldRenderProperty(displayProperties) : true);

  if (!renderProperty) return null;

  return <>{children}</>;
});
