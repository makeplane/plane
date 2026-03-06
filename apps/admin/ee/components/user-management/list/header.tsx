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

import { observer } from "mobx-react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDownIcon, Eraser, MoveRight } from "lucide-react";
import { CheckIcon } from "@plane/propel/icons";
import { Menu } from "@plane/propel/menu";
import type {
  IInstanceUserDisplayProperties,
  TInstanceUserOrderByOptions,
} from "@/plane-admin/constants/user-management";
import { INSTANCE_USER_PROPERTY_DETAILS } from "@/plane-admin/constants/user-management";
import type { IInstanceUserFilters } from "@/plane-admin/store/instance-user.store";

interface Props {
  property: keyof IInstanceUserDisplayProperties;
  filters?: IInstanceUserFilters;
  handleFilterUpdate: (data: Partial<IInstanceUserFilters>) => void;
}

export const MemberHeaderColumn = observer(function MemberHeaderColumn(props: Props) {
  const { filters, handleFilterUpdate, property } = props;

  const propertyDetails = INSTANCE_USER_PROPERTY_DETAILS[property];
  const activeSortingProperty = filters?.order_by;

  const handleOrderBy = (order: TInstanceUserOrderByOptions) => {
    handleFilterUpdate({ order_by: order });
  };

  const handleClearSorting = () => {
    handleFilterUpdate({ order_by: "-is_active" });
  };

  if (!propertyDetails) return null;

  return (
    <Menu
      customButtonClassName="clickable !w-full"
      customButtonTabIndex={-1}
      optionsClassName="!w-full"
      customButton={
        <div className="flex w-full cursor-pointer items-center gap-1.5">
          <span className="text-11 text-placeholder">{propertyDetails.title}</span>
          <div className="ml-3 flex">
            {(activeSortingProperty === propertyDetails.ascendingOrderKey ||
              activeSortingProperty === propertyDetails.descendingOrderKey) && (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full">
                {propertyDetails.ascendingOrderKey === activeSortingProperty ? (
                  <ArrowDownWideNarrow className="h-3 w-3" />
                ) : (
                  <ArrowUpNarrowWide className="h-3 w-3" />
                )}
              </div>
            )}
            <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
          </div>
        </div>
      }
      placement="bottom"
      closeOnSelect
    >
      {propertyDetails.isSortingAllowed && (
        <>
          <Menu.MenuItem onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey)}>
            <div className={"flex items-center justify-between gap-1.5 px-1 text-caption-sm-medium"}>
              <div className="flex items-center gap-2">
                <ArrowDownWideNarrow className="h-3 w-3 stroke-[1.5]" />
                <span>{propertyDetails.ascendingOrderTitle}</span>
                <MoveRight className="h-3 w-3" />
                <span>{propertyDetails.descendingOrderTitle}</span>
              </div>
              {activeSortingProperty === propertyDetails.ascendingOrderKey && <CheckIcon className="h-3 w-3" />}
            </div>
          </Menu.MenuItem>

          <Menu.MenuItem onClick={() => handleOrderBy(propertyDetails.descendingOrderKey)}>
            <div className={"flex items-center gap-1.5 px-1 text-caption-sm-medium"}>
              <div className="flex items-center gap-2">
                <ArrowUpNarrowWide className="h-3 w-3 stroke-[1.5]" />
                <span>{propertyDetails.descendingOrderTitle}</span>
                <MoveRight className="h-3 w-3" />
                <span>{propertyDetails.ascendingOrderTitle}</span>
              </div>
              {activeSortingProperty === propertyDetails.descendingOrderKey && <CheckIcon className="h-3 w-3" />}
            </div>
          </Menu.MenuItem>

          {(activeSortingProperty === propertyDetails.ascendingOrderKey ||
            activeSortingProperty === propertyDetails.descendingOrderKey) && (
            <Menu.MenuItem className="mt-0.5" onClick={handleClearSorting}>
              <div className="flex items-center gap-2 px-1">
                <Eraser className="h-3 w-3" />
                <span>Clear sorting</span>
              </div>
            </Menu.MenuItem>
          )}
        </>
      )}
    </Menu>
  );
});
