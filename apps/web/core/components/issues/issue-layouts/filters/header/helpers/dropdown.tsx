/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
// ui
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import type { TPopoverMenuPlacement } from "@plane/blocks/common";
import { toSideAndAlign } from "@plane/blocks/common";
import type { IconElement } from "@plane/blocks/types";

type Props = {
  children: React.ReactNode;
  icon?: IconElement;
  miniIcon?: React.ReactNode;
  title?: string;
  placement?: TPopoverMenuPlacement;
  disabled?: boolean;
  tabIndex?: number;
  menuButton?: React.ReactNode;
  isFiltersApplied?: boolean;
};

export function FiltersDropdown(props: Props) {
  const {
    children,
    miniIcon,
    icon,
    title = "Dropdown",
    placement,
    disabled = false,
    tabIndex,
    menuButton,
    isFiltersApplied = false,
  } = props;

  return (
    <div>
      <Popover>
        {menuButton ? (
          <PopoverTrigger render={<button type="button" />}>{menuButton}</PopoverTrigger>
        ) : (
          <>
            {/* Base UI anchors the panel to whichever trigger opened it, so each breakpoint gets its own trigger. */}
            <div className="hidden @4xl:flex">
              <PopoverTrigger
                disabled={disabled}
                render={
                  <Button
                    disabled={disabled}
                    variant="secondary"
                    icon={icon}
                    tabIndex={tabIndex}
                    size="md"
                    stretch="auto"
                    label={title}
                    render={(renderProps) => (
                      // propel: the applied-filters dot needs a positioned host, so it rides the render target.
                      <button {...renderProps} type="button" className={`${renderProps.className ?? ""} relative`}>
                        {renderProps.children}
                        {isFiltersApplied && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent-primary" />
                        )}
                      </button>
                    )}
                  />
                }
              />
            </div>
            {/* Below @4xl the compact trigger is the mini icon alone — Propel's `Button` always renders its
                `label`, so an icon-only trigger has to be an `IconButton`. */}
            <div className="flex @4xl:hidden">
              <PopoverTrigger
                disabled={disabled}
                render={
                  miniIcon ? (
                    <IconButton
                      disabled={disabled}
                      variant="secondary"
                      tabIndex={tabIndex}
                      size="md"
                      icon={miniIcon}
                      aria-label={title}
                    />
                  ) : (
                    <Button
                      disabled={disabled}
                      variant="secondary"
                      tabIndex={tabIndex}
                      size="md"
                      stretch="auto"
                      label={title}
                    />
                  )
                }
              />
            </div>
          </>
        )}
        <PopoverContent variant="rich" {...toSideAndAlign(placement ?? "auto")}>
          <PopoverBody tabIndex={0} render={<div className="flex flex-col" />}>
            <div className="flex max-h-[30rem] min-h-0 w-[18.75rem] flex-col overflow-hidden lg:max-h-[37.5rem]">
              {children}
            </div>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </div>
  );
}
