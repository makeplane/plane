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

// plane imports
import { useTranslation } from "@plane/i18n";
import { Checkbox } from "@plane/ui";
import { cn, getCustomPropertyTypeDetails } from "@plane/utils";
// local imports
import { PropertyTypeIcon } from "@/components/custom-properties/common/property-icon";
import type { LinkedPropertyData } from "./types";

type LinkPropertiesModalItemProps = {
  property: LinkedPropertyData;
  isSelected: boolean;
  onToggle: () => void;
};

export function LinkPropertiesModalItem(props: LinkPropertiesModalItemProps) {
  const { property, isSelected, onToggle } = props;
  // hooks
  const { t } = useTranslation();
  // derived values
  const propertyTypeDetails = property.property_type
    ? getCustomPropertyTypeDetails(property.property_type, property.relation_type)
    : undefined;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        isSelected ? "border-accent-strong bg-accent-subtle" : "border-subtle bg-layer-2 hover:bg-layer-2-hover"
      )}
    >
      <Checkbox checked={isSelected} containerClassName="shrink-0" />
      {/* Property details */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate text-body-sm-medium text-primary">{property.display_name}</span>
        {property.description && (
          <span className="truncate text-body-xs-regular text-tertiary">{property.description}</span>
        )}
      </div>
      {/* Badges */}
      <div className="flex shrink-0 items-center gap-2">
        {propertyTypeDetails?.i18n_displayName && (
          <span
            className={cn(
              "flex shrink-0 w-fit gap-1 px-1.5 py-1 items-center justify-center text-caption-sm-medium text-tertiary bg-layer-3 rounded-md"
            )}
          >
            <PropertyTypeIcon iconKey={propertyTypeDetails.iconKey} className="size-3" />
            {t(propertyTypeDetails.i18n_displayName)}
          </span>
        )}
      </div>
    </button>
  );
}
