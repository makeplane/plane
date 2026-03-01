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

import { DropdownIcon } from "../icons";
import type { ISvgIcons } from "../icons";
import { cn } from "../utils";

type Props = {
  isOpen: boolean;
  title: React.ReactNode;
  hideChevron?: boolean;
  indicatorElement?: React.ReactNode;
  actionItemElement?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  ChevronIcon?: React.FC<ISvgIcons>;
};

export function CollapsibleButton(props: Props) {
  const {
    isOpen,
    title,
    hideChevron = false,
    indicatorElement,
    actionItemElement,
    className = "",
    titleClassName = "",
    ChevronIcon = DropdownIcon,
  } = props;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 h-12 px-2.5 py-3 border-b border-subtle flex-1",
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-3">
          {!hideChevron && (
            <ChevronIcon
              className={cn("size-2 text-tertiary hover:text-secondary duration-300", {
                "-rotate-90": !isOpen,
              })}
            />
          )}
          <span className={cn("text-14 text-primary font-medium", titleClassName)}>{title}</span>
        </div>
        {indicatorElement && indicatorElement}
      </div>
      {actionItemElement && isOpen && actionItemElement}
    </div>
  );
}
