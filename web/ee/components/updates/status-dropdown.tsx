"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { EUpdateStatus } from "@plane/types/src/enums";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { generateIconColors } from "@/helpers/color.helper";
import { StatusOptions, UpdateStatusIcons } from "./status-icons";

export type TStatusDropdown = {
  className?: string;
  selectedStatus: EUpdateStatus;
  setStatus: (status: EUpdateStatus) => void;
};

export const StatusDropdown: FC<TStatusDropdown> = observer((props) => {
  const { className, setStatus, selectedStatus } = props;

  const DropdownOptions = () =>
    Object.keys(StatusOptions).map((key) => (
      <CustomMenu.MenuItem
        key={key}
        className="flex items-center gap-2 truncate"
        onClick={() => {
          setStatus(key as EUpdateStatus);
        }}
      >
        <UpdateStatusIcons statusType={key as EUpdateStatus} showBackground={false} />
        <div className="truncate font-medium text-sm capitalize">{key.replaceAll("-", " ").toLowerCase()}</div>
      </CustomMenu.MenuItem>
    ));

  const color = StatusOptions[selectedStatus]?.color ? generateIconColors(StatusOptions[selectedStatus]?.color) : null;
  const textColor = color ? color.foreground : "transparent";
  const backgroundColor = color ? color.background : "transparent";

  return (
    <CustomMenu
      maxHeight={"md"}
      className={cn("flex justify-center text-xs text-custom-text-200 w-fit ", className)}
      placement="bottom-start"
      customButton={
        <button
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
          }}
          className={cn(`flex px-3 py-1 rounded-md gap-2 items-center`)}
        >
          <UpdateStatusIcons statusType={selectedStatus} showBackground={false} />
          <span className="font-medium text-sm my-auto capitalize">
            {" "}
            {selectedStatus.replaceAll("-", " ").toLowerCase()}
          </span>
        </button>
      }
      customButtonClassName="flex justify-center"
      closeOnSelect
    >
      <DropdownOptions />
    </CustomMenu>
  );
});
