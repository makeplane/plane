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

import React, { Fragment } from "react";
// components
import { cn } from "../utils";
import { Popover } from "./popover";
// helpers
// types
import type { TPopoverMenu } from "./types";

export function PopoverMenu<T>(props: TPopoverMenu<T>) {
  const {
    popperPosition = "bottom-end",
    popperPadding = 0,
    buttonClassName = "",
    button,
    disabled,
    panelClassName = "",
    data,
    popoverClassName = "",
    keyExtractor,
    render,
    popoverButtonRef,
    buttonRefClassName = "",
  } = props;

  return (
    <Popover
      popperPosition={popperPosition}
      popperPadding={popperPadding}
      buttonClassName={buttonClassName}
      button={button}
      disabled={disabled}
      panelClassName={cn(
        "my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2 text-11 shadow-raised-200 focus:outline-none",
        panelClassName
      )}
      popoverClassName={popoverClassName}
      popoverButtonRef={popoverButtonRef}
      buttonRefClassName={buttonRefClassName}
    >
      <Fragment>
        {data.map((item, index) => (
          <Fragment key={keyExtractor(item, index)}>{render(item, index)}</Fragment>
        ))}
      </Fragment>
    </Popover>
  );
}
