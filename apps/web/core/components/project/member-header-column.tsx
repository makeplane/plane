/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// ui
import { observer } from "mobx-react";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import {
  ChevronDownOutline,
  EraserOutline,
  SortAscendingOutline,
  SortDescendingOutline,
} from "@makeplane/propel/icons";
// constants
import type { IProjectMemberDisplayProperties, TMemberOrderByOptions } from "@plane/constants";
import { MEMBER_PROPERTY_DETAILS } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
// types
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
    <Menu>
      <MenuTrigger
        tabIndex={-1}
        render={
          <button
            type="button"
            className="clickable flex w-full cursor-pointer items-center justify-between gap-1.5 py-2 text-13 text-secondary hover:text-primary"
          />
        }
      >
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
      </MenuTrigger>
      <MenuContent side="bottom" align="end">
        {propertyDetails.isSortingAllowed && (
          <>
            <MenuItem
              icon={<Icon icon={SortDescendingOutline} />}
              label={`${propertyDetails.ascendingOrderTitle} \u2192 ${propertyDetails.descendingOrderTitle}`}
              selected={activeSortingProperty === propertyDetails.ascendingOrderKey}
              onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey, property)}
            />
            <MenuItem
              icon={<Icon icon={SortAscendingOutline} />}
              label={`${propertyDetails.descendingOrderTitle} \u2192 ${propertyDetails.ascendingOrderTitle}`}
              selected={activeSortingProperty === propertyDetails.descendingOrderKey}
              onClick={() => handleOrderBy(propertyDetails.descendingOrderKey, property)}
            />
            {(activeSortingProperty === propertyDetails.ascendingOrderKey ||
              activeSortingProperty === propertyDetails.descendingOrderKey) && (
              <MenuItem
                key={property}
                icon={<Icon icon={EraserOutline} />}
                label={t("common.actions.clear_sorting")}
                onClick={handleClearSorting}
              />
            )}
          </>
        )}
      </MenuContent>
    </Menu>
  );
});
