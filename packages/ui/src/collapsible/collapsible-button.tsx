/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type { ISvgIcons } from "@plane/propel/icons";
import { DropdownIcon } from "@plane/propel/icons";
import { cn } from "../utils";

/**
 * Header content for a `Collapsible`. It renders *inside* the toggle button, so everything
 * it takes has to be inert markup.
 *
 * There is deliberately no action slot here: an action rendered from this component would
 * be a button inside a button, and clicking it would collapse the section too. Pass it to
 * `Collapsible`'s `actionElement` instead, which renders it as a sibling of the button.
 */
type Props = {
  isOpen: boolean;
  title: React.ReactNode;
  hideChevron?: boolean;
  indicatorElement?: React.ReactNode;
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
    className = "",
    titleClassName = "",
    ChevronIcon = DropdownIcon,
  } = props;
  return (
    <div className={cn("flex h-12 items-center justify-between gap-3 border-b border-subtle px-2.5 py-3", className)}>
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-3">
          {!hideChevron && (
            <ChevronIcon
              className={cn("size-2 text-tertiary duration-300 hover:text-secondary", {
                "-rotate-90": !isOpen,
              })}
            />
          )}
          <span className={cn("text-14 font-medium text-primary", titleClassName)}>{title}</span>
        </div>
        {/* eslint-disable-next-line oxc/const-comparisons -- pre-existing, unrelated to this fix */}
        {indicatorElement && indicatorElement}
      </div>
    </div>
  );
}
