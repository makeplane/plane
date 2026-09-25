/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

//ui
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import {
  ChevronDownOutline,
  EraserOutline,
  SortAscendingOutline,
  SortDescendingOutline,
} from "@makeplane/propel/icons";
// constants
import { SPREADSHEET_PROPERTY_DETAILS } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssueOrderByOptions } from "@plane/types";
import { Row } from "@plane/blocks/layout";
import useLocalStorage from "@/hooks/use-local-storage";
import { SpreadSheetPropertyIcon } from "../../utils";

interface Props {
  property: keyof IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  onClose: () => void;
  isEpic?: boolean;
}

export function HeaderColumn(props: Props) {
  const { displayFilters, handleDisplayFilterUpdate, property, onClose, isEpic = false } = props;
  // i18n
  const { t } = useTranslation();
  const { storedValue: selectedMenuItem, setValue: setSelectedMenuItem } = useLocalStorage(
    "spreadsheetViewSorting",
    ""
  );
  const { storedValue: activeSortingProperty, setValue: setActiveSortingProperty } = useLocalStorage(
    "spreadsheetViewActiveSortingProperty",
    ""
  );
  const propertyDetails = SPREADSHEET_PROPERTY_DETAILS[property];

  const handleOrderBy = (order: TIssueOrderByOptions, itemKey: string) => {
    handleDisplayFilterUpdate({ order_by: order });

    setSelectedMenuItem(`${order}_${itemKey}`);
    setActiveSortingProperty(order === "-created_at" ? "" : itemKey);
  };

  if (!propertyDetails) return null;

  const ascendingMenuItemKey = `${propertyDetails.ascendingOrderKey}_${property}`;
  const descendingMenuItemKey = `${propertyDetails.descendingOrderKey}_${property}`;

  return (
    <Menu
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <MenuTrigger
        render={
          <button type="button" tabIndex={-1} className="clickable w-full">
            <Row className="flex w-full cursor-pointer items-center justify-between gap-1.5 py-2 text-13 text-secondary hover:text-primary">
              <div className="flex items-center gap-1.5">
                {<SpreadSheetPropertyIcon iconKey={propertyDetails.icon} className="h-4 w-4 text-placeholder" />}
                {property === "sub_issue_count" && isEpic
                  ? t("issue.label", { count: 2 })
                  : t(propertyDetails.i18n_title)}
              </div>
              <div className="ml-3 flex">
                {activeSortingProperty === property && (
                  <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full">
                    {propertyDetails.ascendingOrderKey === displayFilters.order_by ? (
                      <SortDescendingOutline className="h-3 w-3" />
                    ) : (
                      <SortAscendingOutline className="h-3 w-3" />
                    )}
                  </div>
                )}
                <ChevronDownOutline className="h-3 w-3" aria-hidden="true" />
              </div>
            </Row>
          </button>
        }
      />
      <MenuContent side="bottom" align="start">
        <MenuItem
          icon={<Icon icon={SortDescendingOutline} />}
          label={`${propertyDetails.ascendingOrderTitle} → ${propertyDetails.descendingOrderTitle}`}
          selected={selectedMenuItem === ascendingMenuItemKey}
          onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey, property)}
        />
        <MenuItem
          icon={<Icon icon={SortAscendingOutline} />}
          label={`${propertyDetails.descendingOrderTitle} → ${propertyDetails.ascendingOrderTitle}`}
          selected={selectedMenuItem === descendingMenuItemKey}
          onClick={() => handleOrderBy(propertyDetails.descendingOrderKey, property)}
        />
        {selectedMenuItem &&
          selectedMenuItem !== "" &&
          displayFilters?.order_by !== "-created_at" &&
          selectedMenuItem.includes(property) && (
            <MenuItem
              key={property}
              icon={<Icon icon={EraserOutline} />}
              label={t("common.actions.clear_sorting")}
              onClick={() => handleOrderBy("-created_at", property)}
            />
          )}
      </MenuContent>
    </Menu>
  );
}
