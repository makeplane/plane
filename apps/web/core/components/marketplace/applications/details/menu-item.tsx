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
// components
import { cn } from "@plane/utils";
import type { TPopoverMenuOptions } from "@/components/marketplace";
// helpers

export const ApplicationTileMenuItem = observer(function ApplicationTileMenuItem(props: TPopoverMenuOptions) {
  const { type, label = "", isActive, prependIcon, appendIcon, onClick, isDanger } = props;

  if (!isActive) {
    return <></>;
  }

  if (type === "menu-item")
    return (
      <div
        className={cn(
          "flex items-center gap-2 cursor-pointer mx-2 px-2 p-1 transition-all rounded-sm hover:bg-layer-1",
          isDanger ? " text-danger-primary" : " text-secondary"
        )}
        onClick={() => onClick && onClick()}
      >
        {prependIcon && prependIcon}
        <div
          className={cn(
            "whitespace-nowrap text-body-xs-regular text-secondary",
            isDanger ? "text-danger-primary" : "text-secondary"
          )}
        >
          {label}
        </div>
        {appendIcon && <div className="ml-auto">{appendIcon}</div>}
      </div>
    );

  return <div className="border-b border-subtle" />;
});
