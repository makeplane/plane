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

import type { FC } from "react";
import { observer } from "mobx-react";
import type { EUpdateStatus } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn, generateIconColors } from "@plane/utils";
import { StatusOptions, UpdateStatusIcons } from "./status-icons";

export type TStatusDropdown = {
  className?: string;
  selectedStatus: EUpdateStatus;
  setStatus: (status: EUpdateStatus) => void;
};

export const StatusDropdown = observer(function StatusDropdown(props: TStatusDropdown) {
  const { className, setStatus, selectedStatus } = props;

  function DropdownOptions() {
    return Object.keys(StatusOptions).map((key) => (
      <CustomMenu.MenuItem
        key={key}
        className="flex items-center gap-2 truncate"
        onClick={() => {
          setStatus(key as EUpdateStatus);
        }}
      >
        <UpdateStatusIcons statusType={key as EUpdateStatus} showBackground={false} />
        <div className="truncate font-medium text-13 capitalize">{key.replaceAll("-", " ").toLowerCase()}</div>
      </CustomMenu.MenuItem>
    ));
  }

  const color = StatusOptions[selectedStatus]?.color ? generateIconColors(StatusOptions[selectedStatus]?.color) : null;
  const textColor = color ? color.foreground : "transparent";
  const backgroundColor = color ? color.background : "transparent";

  return (
    <CustomMenu
      maxHeight={"md"}
      className={cn("flex justify-center text-11 text-secondary w-fit ", className)}
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
          <span className="font-medium text-13 my-auto capitalize">
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
