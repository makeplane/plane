/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuTrigger } from "@makeplane/propel/components/menu";
// Element tier on purpose: the menu trigger is the one interactive element, so the chrome inside it
// must not render buttons of its own.
import { Button as ButtonElement, ButtonLabel } from "@makeplane/propel/elements/button";
import { IconButton as IconButtonElement } from "@makeplane/propel/elements/icon-button";
import { FilterOutline, SelectedFilterOutline } from "@makeplane/propel/icons";
import type { TPopoverMenuPlacement } from "@plane/blocks/common";
import { toSideAndAlign } from "@plane/blocks/common";
import type { IconElement } from "@plane/blocks/types";
import { cn } from "@plane/utils";
// components
import { DateFilterModalHost } from "@/components/common/filters/date-filter-modal-host";

type Props = {
  /** Menu rows: `MenuGroup`s, `MenuSubmenu`s, `MenuCheckboxItem`s, `MenuSeparator`s… */
  children: React.ReactNode;
  icon?: IconElement;
  miniIcon?: React.ReactNode;
  title?: string;
  placement?: TPopoverMenuPlacement;
  disabled?: boolean;
  tabIndex?: number;
  menuButton?: React.ReactNode;
  isFiltersApplied?: boolean;
  /** Renders the trigger as the icon-only Filters button, accent-tinted while filters are applied. */
  iconOnly?: boolean;
};

const APPLIED_DOT = <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent-primary" />;

/**
 * The shell shared by the header Filters and Display menus: a Propel `Menu` opened from the header
 * button (or a caller-supplied `menuButton`). It also hosts the custom date-range modal, which has to
 * outlive the menu popup that asks for it.
 */
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
    iconOnly = false,
  } = props;

  const renderTriggerContent = () => {
    if (menuButton) return menuButton;

    if (iconOnly) {
      const FilterIcon = isFiltersApplied ? SelectedFilterOutline : FilterOutline;
      return (
        <IconButtonElement
          variant="secondary"
          size="md"
          render={(renderProps) => (
            <span
              {...renderProps}
              className={cn(renderProps.className, {
                "border-accent-strong bg-accent-subtle text-accent-primary hover:bg-accent-subtle-hover active:bg-accent-subtle-active":
                  isFiltersApplied,
              })}
            />
          )}
        >
          <Icon
            icon={<FilterIcon className={cn({ "text-accent-primary [&_path]:fill-current": isFiltersApplied })} />}
          />
          <span className="sr-only">{title}</span>
        </IconButtonElement>
      );
    }

    return (
      <>
        <span className="relative hidden @4xl:flex">
          <ButtonElement variant="secondary" size="md" stretch="auto" render={<span />}>
            {icon}
            <ButtonLabel>{title}</ButtonLabel>
          </ButtonElement>
          {isFiltersApplied && APPLIED_DOT}
        </span>
        {/* Below @4xl the trigger collapses to the mini icon when there is one. */}
        <span className="relative flex @4xl:hidden">
          {miniIcon ? (
            <IconButtonElement variant="secondary" size="md" render={<span />}>
              {miniIcon}
              <span className="sr-only">{title}</span>
            </IconButtonElement>
          ) : (
            <ButtonElement variant="secondary" size="md" stretch="auto" render={<span />}>
              <ButtonLabel>{title}</ButtonLabel>
            </ButtonElement>
          )}
          {isFiltersApplied && APPLIED_DOT}
        </span>
      </>
    );
  };

  return (
    <DateFilterModalHost>
      <Menu>
        <MenuTrigger
          disabled={disabled}
          tabIndex={tabIndex}
          aria-label={props.title || undefined}
          render={
            <button
              type="button"
              className="flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            />
          }
        >
          {renderTriggerContent()}
        </MenuTrigger>
        <MenuContent {...toSideAndAlign(placement ?? "auto")}>{children}</MenuContent>
      </Menu>
    </DateFilterModalHost>
  );
}
