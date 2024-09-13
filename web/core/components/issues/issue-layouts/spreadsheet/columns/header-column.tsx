"use client";

//ui
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckIcon,
  ChevronDownIcon,
  Eraser,
  ListFilter,
  MoveRight,
} from "lucide-react";
import { observer } from "mobx-react";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssueOrderByOptions } from "@plane/types";
import { CustomMenu, Row } from "@plane/ui";
//hooks
import { SPREADSHEET_ORDERBY_PROPERTY, SPREADSHEET_PROPERTY_DETAILS } from "@/constants/spreadsheet";
//types
//constants

interface Props {
  property: keyof IIssueDisplayProperties;
  orderBy: TIssueOrderByOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  onClose: () => void;
}

export const HeaderColumn = observer((props: Props) => {
  const { orderBy, handleDisplayFilterUpdate, property, onClose } = props;

  const propertyDetails = SPREADSHEET_PROPERTY_DETAILS[property];

  const handleOrderBy = (order: TIssueOrderByOptions) => {
    handleDisplayFilterUpdate({ order_by: order });
  };

  const activeSortingProperty = orderBy ? SPREADSHEET_ORDERBY_PROPERTY?.[orderBy] : undefined;

  const isActiveSortingProperty = activeSortingProperty === property;

  return (
    <CustomMenu
      customButtonClassName="clickable !w-full"
      customButtonTabIndex={-1}
      className="!w-full"
      customButton={
        <Row className="flex w-full cursor-pointer items-center justify-between gap-1.5 py-2 text-sm text-custom-text-200 hover:text-custom-text-100">
          <div className="flex items-center gap-1.5">
            {<propertyDetails.icon className="h-4 w-4 text-custom-text-400" />}
            {propertyDetails.title}
          </div>
          <div className="ml-3 flex">
            {isActiveSortingProperty && (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full">
                <ListFilter className="h-3 w-3" />
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
      <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            orderBy === propertyDetails.ascendingOrderKey
              ? "text-custom-text-100"
              : "text-custom-text-200 hover:text-custom-text-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowDownWideNarrow className="h-3 w-3 stroke-[1.5]" />
            <span>{propertyDetails.ascendingOrderTitle}</span>
            <MoveRight className="h-3 w-3" />
            <span>{propertyDetails.descendingOrderTitle}</span>
          </div>

          {orderBy === propertyDetails.ascendingOrderKey && <CheckIcon className="h-3 w-3" />}
        </div>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.descendingOrderKey)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            orderBy === propertyDetails.descendingOrderKey
              ? "text-custom-text-100"
              : "text-custom-text-200 hover:text-custom-text-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowUpNarrowWide className="h-3 w-3 stroke-[1.5]" />
            <span>{propertyDetails.descendingOrderTitle}</span>
            <MoveRight className="h-3 w-3" />
            <span>{propertyDetails.ascendingOrderTitle}</span>
          </div>

          {orderBy === propertyDetails.descendingOrderKey && <CheckIcon className="h-3 w-3" />}
        </div>
      </CustomMenu.MenuItem>
      {orderBy && orderBy !== "-created_at" && isActiveSortingProperty && (
        <CustomMenu.MenuItem className={`mt-0.5`} key={property} onClick={() => handleOrderBy("-created_at")}>
          <div className="flex items-center gap-2 px-1">
            <Eraser className="h-3 w-3" />
            <span>Clear sorting</span>
          </div>
        </CustomMenu.MenuItem>
      )}
    </CustomMenu>
  );
});
