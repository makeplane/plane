/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Children, Fragment, isValidElement } from "react";
import type { ReactNode } from "react";
import { Icon } from "@makeplane/propel/components/icon";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuTriggerButton,
  ToolbarSeparator,
} from "@makeplane/propel/components/toolbar";
import type { ToolbarButtonProps, ToolbarMenuTriggerButtonProps } from "@makeplane/propel/components/toolbar";
import { ChevronDownOutline } from "@makeplane/propel/icons";

export type EntityDetailWidgetToolbarProps = {
  /** `EntityDetailWidgetToolbarGroup`s; falsy children are skipped, so groups can render conditionally. */
  children: ReactNode;
  /** Accessible name of the toolbar. */
  "aria-label": string;
};

/**
 * The bordered action bar above an entity's widgets (sub-items, relations, links, attachments). A
 * flat, medium Propel `Toolbar` keeps roving focus across every action; a separator is drawn between
 * each pair of rendered groups.
 */
export function EntityDetailWidgetToolbar(props: EntityDetailWidgetToolbarProps) {
  const { children, "aria-label": ariaLabel } = props;
  const groups = Children.toArray(children).filter(isValidElement);

  if (groups.length === 0) return null;

  return (
    <div className="inline-flex w-fit max-w-full rounded-lg border border-subtle bg-layer-1">
      {/* The toolbar's own padding is p-1.5; the bar trims it vertically to stay 36px tall. */}
      <Toolbar size="md" elevation="flat" aria-label={ariaLabel} render={<div className="flex-wrap px-1.5 py-1" />}>
        {groups.map((group, index) => (
          // Children.toArray gives every element a stable key
          <Fragment key={group.key}>
            {index > 0 && <ToolbarSeparator />}
            {group}
          </Fragment>
        ))}
      </Toolbar>
    </div>
  );
}

export type EntityDetailWidgetToolbarGroupProps = {
  children: ReactNode;
};

/** A cluster of related toolbar actions. */
export function EntityDetailWidgetToolbarGroup(props: EntityDetailWidgetToolbarGroupProps) {
  return <ToolbarGroup>{props.children}</ToolbarGroup>;
}

export type EntityDetailWidgetToolbarTextButtonProps = Omit<ToolbarButtonProps, "icon" | "label" | "aria-label"> & {
  icon: ReactNode;
  label: string;
};

/**
 * Icon + text action. Rest props (ref, handlers, aria-*) are forwarded, so it can be the `render`
 * element of a menu trigger. An open menu trigger forwards `data-pressed`, which would paint the
 * toggle's selected look on this plain action, so that attribute is dropped.
 */
export function EntityDetailWidgetToolbarTextButton(
  props: EntityDetailWidgetToolbarTextButtonProps & { "data-pressed"?: unknown }
) {
  const { icon, label, "data-pressed": _pressed, ...rest } = props;
  return <ToolbarButton {...rest} icon={icon} label={label} />;
}

export type EntityDetailWidgetToolbarMenuButtonProps = Omit<
  ToolbarMenuTriggerButtonProps,
  "children" | "aria-label"
> & {
  icon: ReactNode;
  "aria-label": string;
};

/** Icon + disclosure chevron, for actions that open a menu of choices. */
export function EntityDetailWidgetToolbarMenuButton(props: EntityDetailWidgetToolbarMenuButtonProps) {
  const { icon, ...rest } = props;
  return (
    <ToolbarMenuTriggerButton {...rest}>
      {icon}
      <span className="inline-flex transition-transform duration-200 group-aria-expanded:rotate-180">
        <Icon icon={ChevronDownOutline} tint="secondary" />
      </span>
    </ToolbarMenuTriggerButton>
  );
}

export type EntityDetailWidgetToolbarIconButtonProps = Omit<ToolbarButtonProps, "icon" | "label" | "aria-label"> & {
  icon: ReactNode;
  "aria-label": string;
};

/** Icon-only action; the accessible name is required. */
export function EntityDetailWidgetToolbarIconButton(props: EntityDetailWidgetToolbarIconButtonProps) {
  const { icon, ...rest } = props;
  return <ToolbarButton {...rest} icon={icon} />;
}
