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

import React from "react";
import { observer } from "mobx-react";
import { InfoIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// plane imports
import type { EIssuePropertyType, TIssueProperty, TIssuePropertyDisplayContext } from "@plane/types";
import { cn, getFormattedWorkItemProperties } from "@plane/utils";
// local imports
import { IssuePropertyLogo } from "@/components/work-item-types/properties/common/issue-property-logo";

function PropertyDetail({ property }: { property: Partial<TIssueProperty<EIssuePropertyType>> | undefined }) {
  if (!property) return null;
  return (
    <>
      <div className="flex-shrink-0 flex">
        {property.logo_props?.in_use && property.logo_props.icon && (
          <IssuePropertyLogo icon_props={property.logo_props.icon} colorClassName="text-tertiary" size={14} />
        )}
      </div>
      <span className="w-full cursor-default truncate">
        <span className="flex gap-0.5 items-center">
          <span className="truncate">{property.display_name ?? property.name ?? property.id ?? ""}</span>
          {property.is_required && <span className="text-danger-primary">*</span>}
          {property.description && (
            <Tooltip tooltipContent={property.description} position="right">
              <InfoIcon className="flex-shrink-0 w-3 h-3 mx-0.5 cursor-pointer" />
            </Tooltip>
          )}
        </span>
      </span>
    </>
  );
}

export const IntakePropertyValues = observer(function IntakePropertyValues(props: TIssuePropertyDisplayContext) {
  const { entries, workItemType } = props;

  const propertiesWithValues = getFormattedWorkItemProperties(workItemType, entries);

  if (!propertiesWithValues.length) return null;

  return (
    <>
      {propertiesWithValues.map(({ property, propertyId, propertyTypeKey, displayValues }) => {
        const isUrlType = propertyTypeKey === "URL";
        return (
          <div key={propertyId} className="flex gap-2">
            <div className="flex w-2/5 flex-shrink-0 gap-1.5 text-13 text-tertiary items-start">
              <PropertyDetail property={property} />
            </div>
            <div className="w-3/5 space-y-1 text-13 text-placeholder">
              {displayValues.length ? (
                displayValues.map((value, index) =>
                  isUrlType ? (
                    <a
                      key={`${propertyId}-${index}`}
                      href={value}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-words text-accent-primary hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    <span key={`${propertyId}-${index}`} className="block break-words">
                      {value}
                    </span>
                  )
                )
              ) : (
                <span className="text-tertiary">No value</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
});
