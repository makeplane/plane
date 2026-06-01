/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// ui
import { ArrowDownWideNarrow, ArrowUpNarrowWide, CheckIcon, ChevronDownIcon, Eraser, MoveRight } from "lucide-react";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import type { IIssueDisplayFilterOptions, TIssueOrderByOptions } from "@plane/types";
import { CustomMenu, Row } from "@plane/ui";
import useLocalStorage from "@/hooks/use-local-storage";

// Sort keys for the work item name column. Ascending => A→Z, descending => Z→A.
const NAME_ASCENDING_ORDER_KEY: TIssueOrderByOptions = "name";
const NAME_DESCENDING_ORDER_KEY: TIssueOrderByOptions = "-name";
// Shared sentinel used across spreadsheet headers to represent "no active sort".
const CLEAR_SORTING_ORDER_KEY: TIssueOrderByOptions = "-created_at";
// Identifier for this column in the shared spreadsheet sorting local-storage state.
const ITEM_KEY = "name";

interface Props {
  label: string;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  onClose?: () => void;
}

export function WorkItemHeaderColumn(props: Props) {
  const { label, displayFilters, handleDisplayFilterUpdate, onClose } = props;
  // i18n
  const { t } = useTranslation();
  // local storage — reuse the same keys as other spreadsheet columns so only one column shows as active
  const { storedValue: selectedMenuItem, setValue: setSelectedMenuItem } = useLocalStorage(
    "spreadsheetViewSorting",
    ""
  );
  const { storedValue: activeSortingProperty, setValue: setActiveSortingProperty } = useLocalStorage(
    "spreadsheetViewActiveSortingProperty",
    ""
  );

  const handleOrderBy = (order: TIssueOrderByOptions) => {
    handleDisplayFilterUpdate({ order_by: order });
    setSelectedMenuItem(`${order}_${ITEM_KEY}`);
    setActiveSortingProperty(order === CLEAR_SORTING_ORDER_KEY ? "" : ITEM_KEY);
  };

  return (
    <CustomMenu
      customButtonClassName="clickable"
      customButtonTabIndex={-1}
      customButton={
        <Row className="flex cursor-pointer items-center gap-1.5 text-13 font-medium text-secondary hover:text-primary">
          <span>{label}</span>
          <div className="flex">
            {activeSortingProperty === ITEM_KEY && (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full">
                {NAME_ASCENDING_ORDER_KEY === displayFilters.order_by ? (
                  <ArrowDownWideNarrow className="h-3 w-3" />
                ) : (
                  <ArrowUpNarrowWide className="h-3 w-3" />
                )}
              </div>
            )}
            <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
          </div>
        </Row>
      }
      onMenuClose={onClose}
      placement="bottom-start"
      closeOnSelect
    >
      <CustomMenu.MenuItem onClick={() => handleOrderBy(NAME_ASCENDING_ORDER_KEY)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            selectedMenuItem === `${NAME_ASCENDING_ORDER_KEY}_${ITEM_KEY}`
              ? "text-primary"
              : "text-secondary hover:text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowDownWideNarrow className="h-3 w-3 stroke-[1.5]" />
            <span>A</span>
            <MoveRight className="h-3 w-3" />
            <span>Z</span>
          </div>
          {selectedMenuItem === `${NAME_ASCENDING_ORDER_KEY}_${ITEM_KEY}` && <CheckIcon className="h-3 w-3" />}
        </div>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => handleOrderBy(NAME_DESCENDING_ORDER_KEY)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            selectedMenuItem === `${NAME_DESCENDING_ORDER_KEY}_${ITEM_KEY}`
              ? "text-primary"
              : "text-secondary hover:text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowUpNarrowWide className="h-3 w-3 stroke-[1.5]" />
            <span>Z</span>
            <MoveRight className="h-3 w-3" />
            <span>A</span>
          </div>
          {selectedMenuItem === `${NAME_DESCENDING_ORDER_KEY}_${ITEM_KEY}` && <CheckIcon className="h-3 w-3" />}
        </div>
      </CustomMenu.MenuItem>
      {selectedMenuItem &&
        selectedMenuItem !== "" &&
        displayFilters?.order_by !== CLEAR_SORTING_ORDER_KEY &&
        selectedMenuItem.includes(ITEM_KEY) && (
          <CustomMenu.MenuItem className="mt-0.5" onClick={() => handleOrderBy(CLEAR_SORTING_ORDER_KEY)}>
            <div className="flex items-center gap-2 px-1">
              <Eraser className="h-3 w-3" />
              <span>{t("common.actions.clear_sorting")}</span>
            </div>
          </CustomMenu.MenuItem>
        )}
    </CustomMenu>
  );
}
