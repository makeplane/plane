"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Rocket, TriangleAlert, CircleAlert } from "lucide-react";
// plane imports
import { EUpdateStatus } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

export const StatusOptions = [
  {
    key: EUpdateStatus.ON_TRACK,
    icon: Rocket,
  },
  {
    key: EUpdateStatus.OFF_TRACK,
    icon: CircleAlert,
  },
  {
    key: EUpdateStatus.AT_RISK,
    icon: TriangleAlert,
  },
];
export type TStatusDropdown = {
  className?: string;
  selectedStatus: string;
  setStatus: (status: EUpdateStatus) => void;
};

export const StatusDropdown: FC<TStatusDropdown> = observer((props) => {
  const { className, setStatus, selectedStatus } = props;

  const DropdownOptions = () =>
    StatusOptions?.map((status) => (
      <CustomMenu.MenuItem
        key={status.key}
        className="flex items-center gap-2 truncate"
        onClick={() => {
          setStatus(status.key);
        }}
      >
        <status.icon
          size={16}
          className={cn("my-auto", {
            "text-[#1FAD40]": status.key === EUpdateStatus.ON_TRACK,
            "text-[#CC0000]": status.key === EUpdateStatus.OFF_TRACK,
            "text-[#CC7700]": status.key === EUpdateStatus.AT_RISK,
          })}
        />
        <div className="truncate font-medium text-sm capitalize">{status.key.replaceAll("-", " ").toLowerCase()}</div>
      </CustomMenu.MenuItem>
    ));

  const selectedStatusObj = StatusOptions.find((status) => status.key === selectedStatus);

  return (
    <CustomMenu
      maxHeight={"md"}
      className={cn("flex justify-center text-xs text-custom-text-200 w-fit ", className)}
      placement="bottom-start"
      customButton={
        <button
          className={cn(`flex px-3 py-1 rounded-md gap-2`, {
            "bg-[#1FAD40]/20 text-[#1FAD40]": selectedStatus === EUpdateStatus.ON_TRACK,
            "bg-[#CC0000]/20 text-[#CC0000]": selectedStatus === EUpdateStatus.OFF_TRACK,
            "bg-[#CC7700]/20 text-[#CC7700]": selectedStatus === EUpdateStatus.AT_RISK,
          })}
        >
          {selectedStatusObj && <selectedStatusObj.icon size={16} className="my-auto" />}
          <span className="font-medium text-sm my-auto capitalize">
            {" "}
            {selectedStatusObj?.key.replaceAll("-", " ").toLowerCase()}
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
