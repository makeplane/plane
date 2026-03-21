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

import { useMemo } from "react";
import { GripVertical, Link2Off } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn, getCustomPropertyTypeDetails } from "@plane/utils";
// components
import { PropertyTypeIcon } from "@/components/custom-properties/common/property-icon";
// local imports
import type { LinkedPropertyData } from "./types";

type LinkedPropertyListItemProps = {
  property: LinkedPropertyData;
  canUnlink: boolean;
  canReorder: boolean;
  onUnlink: () => void;
};

export function LinkedPropertyListItem(props: LinkedPropertyListItemProps) {
  const { property, canUnlink, canReorder, onUnlink } = props;
  // hooks
  const { t } = useTranslation();
  // derived values
  const propertyTypeDetails = property.property_type
    ? getCustomPropertyTypeDetails(property.property_type, property.relation_type)
    : undefined;

  const menuItems: TContextMenuItem[] = useMemo(
    () => [
      {
        key: "unlink",
        title: t("work_item_types.settings.linked_properties.unlink_confirmation.confirm"),
        icon: Link2Off,
        action: onUnlink,
        shouldRender: canUnlink,
      },
    ],
    [canUnlink, onUnlink, t]
  );
  const visibleMenuItems = menuItems.filter((item) => item.shouldRender);

  return (
    <div className="group relative flex w-full items-center justify-between gap-2 rounded-lg border border-subtle bg-layer-2 p-3">
      {/* Left section: drag handle + icon + name + global badge */}
      <div className="flex items-center gap-2 overflow-hidden">
        {canReorder && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 cursor-grab text-secondary opacity-0 group-hover:opacity-100">
            <GripVertical size={14} />
          </span>
        )}
        {propertyTypeDetails?.iconKey && (
          <PropertyTypeIcon iconKey={propertyTypeDetails.iconKey} className="size-4 shrink-0" />
        )}
        <span className={cn("truncate text-body-sm-regular", property.is_active ? "text-primary" : "text-secondary")}>
          {property.display_name}
        </span>
        {property.is_global && (
          <span className="shrink-0 rounded-sm border border-accent-strong px-1.5 py-0.5 text-caption-sm-medium text-accent-primary">
            {t("common.global")}
          </span>
        )}
      </div>
      {/* Right section: type badge + mandatory/active badges + quick actions */}
      <div className="flex shrink-0 items-center gap-2">
        {property.is_required && (
          <span className="shrink-0 rounded-sm bg-accent-subtle px-1.5 py-1 text-caption-sm-medium text-accent-primary">
            {t("common.mandatory")}
          </span>
        )}
        {property.is_active && (
          <span className="shrink-0 rounded-sm bg-success-subtle-1 px-1.5 py-1 text-caption-sm-medium text-success-primary">
            {t("common.active")}
          </span>
        )}
        {visibleMenuItems.length > 0 && (
          <CustomMenu placement="bottom-end" menuItemsClassName="z-20" buttonClassName="p-0.5" closeOnSelect ellipsis>
            {visibleMenuItems.map((item) => (
              <CustomMenu.MenuItem
                key={item.key}
                onClick={item.action}
                className="flex items-center gap-2"
                disabled={item.disabled}
              >
                {item.icon && <item.icon className="h-3 w-3" />}
                <span className="text-caption-xs-regular">{item.title}</span>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        )}
      </div>
    </div>
  );
}
