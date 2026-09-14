/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// ui
import { observer } from "mobx-react";
import { Eraser } from "lucide-react";
import {
  ArrowNarrowRightOutline,
  ChevronDownOutline,
  SortAscendingOutline,
  SortDescendingOutline,
  TickOutline,
} from "@makeplane/propel/icons";
// constants
import type { IProjectMemberDisplayProperties, TMemberOrderByOptions } from "@plane/constants";
import { MEMBER_PROPERTY_DETAILS } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import { CustomMenu } from "@plane/ui";
import type { IMemberFilters } from "@/store/member/utils";

interface Props {
  property: keyof IProjectMemberDisplayProperties;
  displayFilters?: IMemberFilters;
  handleDisplayFilterUpdate: (data: Partial<IMemberFilters>) => void;
}

export const MemberHeaderColumn = observer(function MemberHeaderColumn(props: Props) {
  const { displayFilters, handleDisplayFilterUpdate, property } = props;
  // i18n
  const { t } = useTranslation();

  const propertyDetails = MEMBER_PROPERTY_DETAILS[property];

  const activeSortingProperty = displayFilters?.order_by;

  const handleOrderBy = (order: TMemberOrderByOptions, _itemKey: keyof IProjectMemberDisplayProperties) => {
    handleDisplayFilterUpdate({ order_by: order });
  };

  const handleClearSorting = () => {
    handleDisplayFilterUpdate({ order_by: undefined });
  };

  if (!propertyDetails) return null;

  return (
    <CustomMenu
      customButtonClassName="clickable !w-full"
      customButtonTabIndex={-1}
      className="!w-full"
      customButton={
        <div className="flex w-full cursor-pointer items-center justify-between gap-1.5 py-2 text-13 text-secondary hover:text-primary">
          <span>{t(propertyDetails.i18n_title)}</span>
          <div className="ml-3 flex">
            {(activeSortingProperty === propertyDetails.ascendingOrderKey ||
              activeSortingProperty === propertyDetails.descendingOrderKey) && (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full">
                {propertyDetails.ascendingOrderKey === activeSortingProperty ? (
                  <SortDescendingOutline className="h-3 w-3" />
                ) : (
                  <SortAscendingOutline className="h-3 w-3" />
                )}
              </div>
            )}
            <ChevronDownOutline className="h-3 w-3" aria-hidden="true" />
          </div>
        </div>
      }
      placement="bottom-end"
      closeOnSelect
    >
      {propertyDetails.isSortingAllowed && (
        <>
          <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey, property)}>
            <div
              className={`flex items-center justify-between gap-1.5 px-1 ${
                activeSortingProperty === propertyDetails.ascendingOrderKey
                  ? "text-primary"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <SortDescendingOutline className="h-3 w-3 stroke-[1.5]" />
                <span>{propertyDetails.ascendingOrderTitle}</span>
                <ArrowNarrowRightOutline className="h-3 w-3" />
                <span>{propertyDetails.descendingOrderTitle}</span>
              </div>
              {activeSortingProperty === propertyDetails.ascendingOrderKey && <TickOutline className="h-3 w-3" />}
            </div>
          </CustomMenu.MenuItem>

          <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.descendingOrderKey, property)}>
            <div
              className={`flex items-center justify-between gap-1.5 px-1 ${
                activeSortingProperty === propertyDetails.descendingOrderKey
                  ? "text-primary"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <SortAscendingOutline className="h-3 w-3 stroke-[1.5]" />
                <span>{propertyDetails.descendingOrderTitle}</span>
                <ArrowNarrowRightOutline className="h-3 w-3" />
                <span>{propertyDetails.ascendingOrderTitle}</span>
              </div>
              {activeSortingProperty === propertyDetails.descendingOrderKey && <TickOutline className="h-3 w-3" />}
            </div>
          </CustomMenu.MenuItem>

          {(activeSortingProperty === propertyDetails.ascendingOrderKey ||
            activeSortingProperty === propertyDetails.descendingOrderKey) && (
            <CustomMenu.MenuItem className="mt-0.5" key={property} onClick={handleClearSorting}>
              <div className="flex items-center gap-2 px-1">
                <Eraser className="h-3 w-3" />
                <span>{t("common.actions.clear_sorting")}</span>
              </div>
            </CustomMenu.MenuItem>
          )}
        </>
      )}
    </CustomMenu>
  );
});
