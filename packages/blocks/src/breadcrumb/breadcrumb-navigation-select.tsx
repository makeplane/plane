/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type * as React from "react";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { ChevronDownOutline, TickOutline } from "@makeplane/propel/icons";
import type { IconElement } from "../types/icon";
import { cn } from "@plane/utils";
// local imports
import { Select } from "../select/select";
import { BreadcrumbItemContext, useBreadcrumbCurrent } from "./breadcrumb-context";
import { BreadcrumbIcon, BreadcrumbLabel } from "./breadcrumbs";

/**
 * One switchable destination behind a breadcrumb crumb.
 *
 * Navigation is the consumer's: blocks holds no router. A row runs its own `onClick`, and `href`
 * makes the row a real link so it can be middle-clicked, opened in a new tab, or copied.
 */
export type BreadcrumbNavigationItem = {
  /** Stable identity. Matched against `selectedItemKey` to mark the current row. */
  key: string;
  /** Row label, the string the in-dropdown search filters on, and the trigger's text when selected. */
  label: string;
  /** Leading glyph, used both in the row and — for the selected item — on the crumb itself. */
  icon?: IconElement;
  /** Secondary line under the label, usually the reason a row is disabled. */
  description?: string;
  /**
   * Destination for a row that has no `onClick`. The option element then renders as an `<a href>`,
   * so the row carries what a `<div>` cannot — new tab, copy link, status bar — and a plain click
   * navigates the browser.
   *
   * **Mutually exclusive with `onClick`, and `onClick` wins.** Base UI's combobox bails out of
   * selection whenever the pressed element sits inside an `<a href>` ("let the link handle the
   * click"), so an anchor row can never also run `onClick` / `onChange`. A row that has both is
   * rendered as a plain option and this URL is ignored.
   */
  href?: string;
  /** Invoked when the row is chosen. Not called for the row that is already selected. */
  onClick?: () => void;
  /** Replaces `icon` + `label` in the row. `label` still supplies the search text and trigger copy. */
  content?: React.ReactNode;
  /**
   * Whether the row ignores activation. Arrow keys still highlight it — base-ui's combobox does not
   * skip disabled rows — but neither a click nor Enter selects it.
   */
  disabled?: boolean;
  /** Set `false` to drop the row entirely. @default true */
  shouldRender?: boolean;
};

export type BreadcrumbNavigationSelectProps = {
  /** The switchable destinations, in order. */
  navigationItems: BreadcrumbNavigationItem[];
  /** `key` of the destination the crumb currently shows. */
  selectedItemKey: string;
  /** Crumb glyph. Defaults to the selected item's `icon`. */
  icon?: IconElement;
  /** Crumb text. Defaults to the selected item's `label`. */
  label?: string;
  /** Rendered after the crumb, outside both controls — e.g. a favourite toggle. */
  suffix?: React.ReactNode;
  /** Called with the chosen row's `key`, after that row's `onClick`. Never for the current row. */
  onChange?: (key: string) => void;
  /**
   * Navigating to the crumb itself, run by its label control. Suppressed while `isLast`, since the
   * crumb is then the page you are on. With no `handleOnClick`, a selected item carrying an `href`
   * makes the label a plain link instead.
   */
  handleOnClick?: () => void;
  /** Render the crumb as a single button with no dropdown. */
  navigationDisabled?: boolean;
  /** The current page uses one dropdown trigger for its label and chevron. */
  isLast?: boolean;
  /** Whether the dropdown carries a search field. @default true */
  showSearch?: boolean;
  /** Placeholder for that search field. Pre-translated. */
  searchPlaceholder?: string;
  /** Shown when the list is empty. Pre-translated. */
  emptyMessage?: React.ReactNode;
  /**
   * Property name folded into the chevron's accessible name, ahead of the selected label — the
   * dropdown trigger is a `combobox`, which is not named by its content. Pre-translated.
   */
  placeholder?: string;
};

/**
 * The navigating half owns its hover surface independently of the dropdown control.
 */
const NAVIGATION_CLASSNAME =
  "text-body-xs-medium flex h-full min-w-0 items-center gap-1.5 rounded-md px-1 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong";

/** Adjacent controls have no layout gap; each paints its own rounded surface. */
const PAIR_CLASSNAME = "inline-flex h-6 min-w-0 items-center";

/**
 * The hand-drawn dropdown row, used only when an item brings its own `content`. Every other list
 * gets the Select's standard row: glyph, label, description, trailing check.
 */
function NavigationRow({ item, isSelected }: { item: BreadcrumbNavigationItem; isSelected: boolean }) {
  return (
    <>
      <span className={cn("flex min-w-0 flex-1 items-center gap-2", item.disabled && "opacity-60")}>
        {item.content ?? (
          <>
            {item.icon && <span className="grid size-4 shrink-0 place-items-center">{item.icon}</span>}
            <span className="min-w-0">
              <span className="block truncate">{item.label}</span>
              {item.description && <span className="block whitespace-pre-line text-tertiary">{item.description}</span>}
            </span>
          </>
        )}
      </span>
      {isSelected && <TickOutline className="size-3.5 shrink-0" />}
    </>
  );
}

/**
 * A breadcrumb crumb you can switch: the current destination plus a dropdown of its siblings, built
 * on `@plane/blocks/select`. Replaces `@plane/ui`'s `BreadcrumbNavigationDropdown` and
 * `BreadcrumbNavigationSearchDropdown` — one component, with `showSearch` covering the difference.
 *
 * The crumb is a pair of sibling controls inside one `Select`, matching the legacy split: a label
 * that navigates to the crumb, and a chevron (`Select.Trigger variant="icon-sm"`) that opens the
 * list. Two siblings rather than one control, so neither is a button nested inside another, and the
 * controls paint their own hover and open states. `navigationDisabled` drops the chevron
 * and leaves the label on its own. The current crumb uses one combined label-and-chevron trigger.
 */
export function BreadcrumbNavigationSelect(props: BreadcrumbNavigationSelectProps) {
  const {
    navigationItems,
    selectedItemKey,
    icon,
    label,
    suffix,
    onChange,
    handleOnClick,
    navigationDisabled = false,
    isLast: isLastProp,
    showSearch = true,
    searchPlaceholder,
    emptyMessage,
    placeholder,
  } = props;
  const isLast = useBreadcrumbCurrent(isLastProp);
  // derived values
  const items = navigationItems.filter((item) => item.shouldRender !== false);
  const selectedItem = items.find((item) => item.key === selectedItemKey) ?? null;
  const triggerLabel = label ?? selectedItem?.label;
  const triggerIcon = icon ?? selectedItem?.icon;
  const hasCustomContent = items.some((item) => item.content !== undefined);

  // Nothing to show and nothing to name the crumb with — matching the legacy dropdown, which
  // returned null when `selectedItemKey` matched no item.
  if (!triggerLabel) return null;

  const canNavigate = !isLast;
  // With no callback to run, a selected item that carries a URL still gives the label somewhere to go.
  const navigationHref = canNavigate && !handleOnClick ? selectedItem?.href : undefined;

  const handleSelect = (key: string) => {
    const item = items.find((candidate) => candidate.key === key);
    // Base UI already blocks a disabled row; this keeps a programmatic caller honest too.
    if (!item || item.disabled) return;
    if (key === selectedItemKey) {
      if (canNavigate) handleOnClick?.();
      return;
    }
    item.onClick?.();
    onChange?.(key);
  };

  const navigationContent = (
    <>
      {triggerIcon && <BreadcrumbIcon>{triggerIcon}</BreadcrumbIcon>}
      <BreadcrumbLabel>{triggerLabel}</BreadcrumbLabel>
    </>
  );

  const isNavigable = canNavigate && (!!handleOnClick || !!navigationHref);
  // The label's own control: a link when the crumb only has a URL, a button otherwise. `isLast`
  // leaves it inert — you are already on this page.
  const navigation = navigationHref ? (
    <a href={navigationHref} className={cn(NAVIGATION_CLASSNAME, "text-tertiary hover:bg-layer-transparent-hover")}>
      {navigationContent}
    </a>
  ) : (
    // Enabled and focusable even when it has nowhere to go — the legacy crumb stayed a real button
    // on the current page and simply did nothing, rather than dropping out of the tab order.
    <button
      type="button"
      aria-current={isLast ? "page" : undefined}
      onClick={() => {
        if (canNavigate) handleOnClick?.();
      }}
      className={cn(
        NAVIGATION_CLASSNAME,
        isLast ? "text-primary" : "text-tertiary",
        isNavigable ? "cursor-pointer hover:bg-layer-transparent-hover" : "cursor-default"
      )}
    >
      {navigationContent}
    </button>
  );

  // The label clamps at 150px, so the full name lives in a tooltip on both forms.
  const crumb = navigationDisabled ? (
    // Just the label: the `breadcrumb` trigger chrome always paints a chevron, which would promise a
    // dropdown this form does not have.
    <Tooltip label={triggerLabel} side="bottom">
      <span className="inline-flex h-6 min-w-0 items-center">{navigation}</span>
    </Tooltip>
  ) : (
    <Select<BreadcrumbNavigationItem>
      getValues={() => items}
      value={selectedItem}
      onChange={handleSelect}
      getOptionValue={(item) => item.key}
      getOptionLabel={(item) => item.label}
      getOptionDisabled={(item) => item.disabled === true}
      // `onClick` wins: base-ui skips selection entirely on an anchor row, so a row that has to run
      // a callback must not be one.
      getOptionHref={(item) => (item.onClick ? undefined : item.href)}
      getOptionIcon={(item) =>
        item.icon ? <span className="grid size-4 shrink-0 place-items-center">{item.icon}</span> : undefined
      }
      getOptionDescription={(item) => item.description || undefined}
      // `content` replaces a row's markup wholesale, and the standard row has no slot for that — so
      // only a list carrying one falls back to hand-drawn rows.
      renderOption={
        hasCustomContent ? (item) => <NavigationRow item={item} isSelected={item.key === selectedItemKey} /> : undefined
      }
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      showSearch={showSearch}
      emptyMessage={emptyMessage}
      pinSelected={false}
    >
      {/* Siblings, not nested: the label navigates, the chevron opens the list. Each control owns
          its hover surface; the wrapper only aligns them. */}
      {isLast ? (
        <BreadcrumbItemContext.Provider value>
          <Tooltip label={triggerLabel} side="bottom">
            <span className="flex h-full min-w-0 items-center">
              <Select.Trigger<BreadcrumbNavigationItem>
                variant="breadcrumb"
                prependIcon={triggerIcon}
                label={triggerLabel}
              />
            </span>
          </Tooltip>
        </BreadcrumbItemContext.Provider>
      ) : (
        <span className={PAIR_CLASSNAME}>
          <Tooltip label={triggerLabel} side="bottom">
            <span className="flex h-full min-w-0 items-center">{navigation}</span>
          </Tooltip>
          <Select.Trigger<BreadcrumbNavigationItem>
            variant="icon-sm"
            className="group/breadcrumb-switcher size-6 rounded-md bg-transparent p-1 text-icon-secondary outline-none hover:bg-layer-transparent-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong focus-visible:outline-solid data-popup-open:bg-layer-transparent-hover data-popup-open:text-icon-primary"
            prependIcon={
              <ChevronDownOutline className="size-3.5 -rotate-90 transition-transform group-hover/breadcrumb-switcher:rotate-0 group-aria-expanded/breadcrumb-switcher:rotate-0 rtl:rotate-90 rtl:group-hover/breadcrumb-switcher:rotate-0 rtl:group-aria-expanded/breadcrumb-switcher:rotate-0" />
            }
          />
        </span>
      )}
    </Select>
  );

  if (!suffix) return crumb;

  return (
    <span className="flex min-w-0 items-center gap-1">
      {crumb}
      {suffix}
    </span>
  );
}

BreadcrumbNavigationSelect.displayName = "blocks.BreadcrumbNavigationSelect";
