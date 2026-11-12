/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
// plane imports
import {
  Breadcrumb,
  BreadcrumbEllipsisTrigger,
  BreadcrumbItem as PropelBreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator as PropelBreadcrumbSeparator,
} from "@makeplane/propel/components/breadcrumb";
import {
  BreadcrumbLink as BreadcrumbLinkSlot,
  BreadcrumbPage as BreadcrumbPageSlot,
} from "@makeplane/propel/elements/breadcrumb";
import { Menu, MenuContent, MenuItem, MenuLinkItem } from "@makeplane/propel/components/menu";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local imports
import { BreadcrumbItemContext, useBreadcrumbCurrent } from "./breadcrumb-context";
import { getCollapsedCrumb, readCrumbLabel } from "./helpers";
import type { TCollapsedCrumb, TCrumbLabelProps } from "./helpers";

/** Viewport width, in px, at or below which the leading crumbs collapse into the overflow menu. */
const COLLAPSE_BREAKPOINT = 640;

type BreadcrumbsProps = {
  className?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  /**
   * Landmark name for the trail (`<nav aria-label>`). Pre-translated — pass the caller's `t()`
   * output. Defaults to the translated `aria_labels.breadcrumb.trail`.
   */
  ariaLabel?: string;
  /**
   * Accessible name for the overflow trigger that reveals the collapsed crumbs. Pre-translated.
   * Defaults to the translated `aria_labels.breadcrumb.show_more`.
   */
  showMoreLabel?: string;
  /**
   * Viewport width, in px, at or below which the leading crumbs collapse into the overflow menu.
   * The threshold is the viewport's, not the trail's own width — that is what the legacy trail
   * measured, and matching it keeps the collapse point identical across the 123 call sites.
   *
   * @default 640
   */
  collapseBreakpoint?: number;
};

/** The pulsing stand-in shown per crumb while the trail's data is loading. */
export function BreadcrumbItemLoader() {
  return (
    <div className="flex h-7 animate-pulse items-center gap-2">
      <div className="group flex h-full items-center gap-2 rounded-sm px-2 py-1 text-body-xs-medium">
        <span className="h-full w-5 rounded-sm bg-layer-1" />
        <span className="h-full w-16 rounded-sm bg-layer-1" />
      </div>
    </div>
  );
}

// breadcrumb item
/**
 * `TCrumbLabelProps` is here so a call site can name and route the crumb on the `Breadcrumbs.Item`
 * itself rather than on the wrapper inside it. All four are collapsed-row metadata only: none of
 * them reaches the DOM — `aria-label` included, which is read by `getCollapsedCrumb` and is not
 * rendered as an attribute on anything. Put an `aria-label` meant for the visible crumb on the
 * crumb's own markup.
 */
type BreadcrumbItemProps = TCrumbLabelProps & {
  component?: React.ReactNode;
  showSeparator?: boolean;
  isLast?: boolean;
  /**
   * Row label used when this crumb collapses into the overflow menu. Derived from the crumb's own
   * `label` prop or its text when omitted; pass it when the crumb's markup hides its name.
   */
  label?: string;
  /** Destination used when this crumb collapses into the overflow menu. Derived when omitted. */
  href?: string;
  /** Activation used when this crumb collapses into the overflow menu. Derived when omitted. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
};

/**
 * One step in the trail. Renders the crumb and, unless it is the last one, the separator that
 * follows it — both as direct children of the `<ol>`, so the markup stays a flat list.
 */
function BreadcrumbItem(props: BreadcrumbItemProps) {
  const { component, showSeparator = true } = props;
  const isLast = useBreadcrumbCurrent(props.isLast);
  return (
    <>
      <BreadcrumbItemContext.Provider value={isLast}>
        <PropelBreadcrumbItem>{component}</PropelBreadcrumbItem>
      </BreadcrumbItemContext.Provider>
      {showSeparator && !isLast && <BreadcrumbSeparator />}
    </>
  );
}

// breadcrumb icon
type BreadcrumbIconProps = {
  children: React.ReactNode;
  className?: string;
};

/** The leading glyph slot inside a crumb. */
function BreadcrumbIcon(props: BreadcrumbIconProps) {
  const { children, className } = props;
  return (
    <div
      className={cn(
        "flex size-4 shrink-0 items-center justify-center overflow-hidden text-icon-secondary [&>svg]:size-4",
        className
      )}
    >
      {children}
    </div>
  );
}

// breadcrumb label
type BreadcrumbLabelProps = {
  children: React.ReactNode;
  className?: string;
};

/** The crumb's text, clamped to one line. */
function BreadcrumbLabel(props: BreadcrumbLabelProps) {
  const { children, className } = props;
  return (
    <div className={cn("relative line-clamp-1 block max-w-[150px] truncate overflow-hidden", className)}>
      {children}
    </div>
  );
}

// breadcrumb separator
type BreadcrumbSeparatorProps = {
  /** @deprecated Accepted and ignored. Propel owns the separator's chrome. */
  className?: string;
  /** @deprecated Accepted and ignored. Propel owns the separator's chrome. */
  containerClassName?: string;
  /** @deprecated Accepted and ignored. Propel owns the separator's chrome. */
  iconClassName?: string;
  /** @deprecated Accepted and ignored. Propel's separator has no divider rule. */
  showDivider?: boolean;
};

/** The chevron between two crumbs. */
function BreadcrumbSeparator(_props: BreadcrumbSeparatorProps = {}) {
  return <PropelBreadcrumbSeparator />;
}

// breadcrumb wrapper
type BreadcrumbItemWrapperProps = {
  label?: string;
  disableTooltip?: boolean;
  children: React.ReactNode;
  /** @deprecated Accepted and ignored. Propel owns the crumb's chrome. */
  className?: string;
  /**
   * @deprecated Accepted and ignored. Propel ships two crumb looks — the hoverable pill
   * (`BreadcrumbLink`) and the static current page (`BreadcrumbPage`) — and nothing in between, so
   * there is no part that renders a non-last crumb as inert text. Rendering `type="text"` as
   * `BreadcrumbPage` would put `aria-current="page"` on a middle crumb, which is the worse of the
   * two errors, so a non-last crumb always gets the pill and picks up a hover state it did not have
   * before. `isLast` still decides which crumb is the current page. Remove this prop from call sites
   * once Propel grows a static, non-current crumb part.
   */
  type?: "link" | "text";
  isLast?: boolean;
};

/**
 * The crumb pill itself. The last crumb is the current page; every other crumb is the navigable
 * pill. Consumers wrap this in their own router `Link` or `button`, so it renders a `<span>` rather
 * than an anchor of its own.
 */
function BreadcrumbItemWrapper(props: BreadcrumbItemWrapperProps) {
  const { label, disableTooltip = false, children } = props;
  const isLast = useBreadcrumbCurrent(props.isLast);
  // derived values
  const crumb = isLast ? (
    <BreadcrumbPageSlot>{children}</BreadcrumbPageSlot>
  ) : (
    <BreadcrumbLinkSlot render={<span />}>{children}</BreadcrumbLinkSlot>
  );

  return (
    <Tooltip label={label} side="bottom" disabled={disableTooltip}>
      {crumb}
    </Tooltip>
  );
}

/**
 * Reads the overflow-menu row a collapsed child resolves to. The name may be declared on the direct
 * child itself (`Breadcrumbs.Item crumbLabel`) as well as inside its `component` tree, which is where
 * `getCollapsedCrumb` looks — Ruling 39 — so a wrapper-rendered crumb can be named from either side.
 */
function resolveCollapsedCrumb(child: React.ReactNode): TCollapsedCrumb {
  const itemProps = React.isValidElement<BreadcrumbItemProps>(child) ? child.props : undefined;
  return getCollapsedCrumb(itemProps?.component ?? child, {
    label: readCrumbLabel(itemProps),
    href: itemProps?.crumbHref ?? itemProps?.href,
    onClick: itemProps?.crumbOnClick ?? itemProps?.onClick,
  });
}

/**
 * A stable key for one entry of `React.Children.toArray(children)`. `toArray` already keys every element
 * by its slot in the original children (`.0`, `.$id`), so a crumb keeps its identity when a sibling
 * before it is conditionally dropped. Text children carry no key, so they fall back to their text.
 */
function getCrumbKey(child: React.ReactNode): React.Key {
  if (React.isValidElement(child) && child.key !== null) return child.key;
  return `text:${String(child)}`;
}

/**
 * Turns a collapsed crumb into a real menu row, so the crumbs behind the ellipsis are
 * `role="menuitem"` and reachable with the arrow keys rather than inert markup in a `role="menu"`.
 */
function CollapsedCrumbRow({ crumb }: { crumb: TCollapsedCrumb }) {
  const { label, href, onClick } = crumb;
  if (href) return <MenuLinkItem variant="neutral" label={label} href={href} onClick={onClick} />;
  return <MenuItem variant="neutral" label={label} onClick={onClick} disabled={!onClick} />;
}

/**
 * The trail of crumbs above every page header. Keeps the retired UI package's compound API — `Breadcrumbs.Item`
 * / `.Icon` / `.Label` / `.Separator` / `.ItemWrapper` — on top of Propel's breadcrumb parts, so
 * migrating a call site is an import change.
 *
 * Below `collapseBreakpoint` (640px by default) the leading crumbs collapse into an overflow menu
 * behind an ellipsis trigger and only the current page stays in the trail, matching what the legacy
 * trail did on narrow viewports. Each collapsed crumb becomes a real `MenuItem` / `MenuLinkItem`, so
 * the hidden steps stay keyboard-reachable. A collapsed crumb that resolves to no label — a wrapper
 * component that names nothing (Ruling 39), or one that renders `null` — gets no row, and when no
 * row is left the ellipsis is not rendered at all, so the menu never opens onto blank rows.
 *
 * There is no `onBack`. The legacy trail's back arrow was how a narrow viewport got to the crumbs it
 * had hidden; the overflow menu is that route now, so the arrow has nothing left to do. The prop was
 * accepted and ignored through the migration and is gone with its last call site.
 */
function Breadcrumbs(props: BreadcrumbsProps) {
  const {
    className,
    children,
    isLoading = false,
    ariaLabel,
    showMoreLabel,
    collapseBreakpoint = COLLAPSE_BREAKPOINT,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= collapseBreakpoint);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // set the correct state on mount, before the first resize
    return () => window.removeEventListener("resize", handleResize);
  }, [collapseBreakpoint]);

  // derived values
  const trailLabel = ariaLabel ?? t("aria_labels.breadcrumb.trail");
  const overflowLabel = showMoreLabel ?? t("aria_labels.breadcrumb.show_more");
  const childrenArray = React.Children.toArray(children);
  const isCollapsed = isSmallScreen && childrenArray.length > 1;
  const collapsedCrumbs = isCollapsed
    ? childrenArray
        .slice(0, -1)
        .map((child) => ({ key: getCrumbKey(child), crumb: resolveCollapsedCrumb(child) }))
        .filter(({ crumb }) => crumb.label.trim() !== "")
    : [];
  const lastChild = childrenArray[childrenArray.length - 1];

  const renderCrumb = (child: React.ReactNode, isLast: boolean) => {
    if (isLoading) {
      return (
        <PropelBreadcrumbItem>
          <BreadcrumbItemLoader />
        </PropelBreadcrumbItem>
      );
    }
    if (React.isValidElement<BreadcrumbItemProps>(child))
      return (
        <BreadcrumbItemContext.Provider value={isLast}>
          {React.cloneElement(child, { isLast })}
        </BreadcrumbItemContext.Provider>
      );
    return child;
  };

  return (
    <div className={cn("flex min-w-0 flex-grow items-center overflow-hidden", className)}>
      <Breadcrumb aria-label={trailLabel}>
        <BreadcrumbList>
          {!isCollapsed &&
            childrenArray.map((child, index) => (
              <React.Fragment key={getCrumbKey(child)}>
                {renderCrumb(child, index === childrenArray.length - 1)}
              </React.Fragment>
            ))}
          {isCollapsed && (
            <>
              {collapsedCrumbs.length > 0 && (
                <>
                  <PropelBreadcrumbItem>
                    <Menu>
                      <BreadcrumbEllipsisTrigger aria-label={overflowLabel} />
                      <MenuContent side="bottom" align="start">
                        {collapsedCrumbs.map(({ key, crumb }) => (
                          <CollapsedCrumbRow key={key} crumb={crumb} />
                        ))}
                      </MenuContent>
                    </Menu>
                  </PropelBreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {renderCrumb(lastChild, true)}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

Breadcrumbs.Item = BreadcrumbItem;
Breadcrumbs.Icon = BreadcrumbIcon;
Breadcrumbs.Label = BreadcrumbLabel;
Breadcrumbs.Separator = BreadcrumbSeparator;
Breadcrumbs.ItemWrapper = BreadcrumbItemWrapper;

Breadcrumbs.displayName = "blocks.Breadcrumbs";
BreadcrumbItem.displayName = "blocks.BreadcrumbItem";
BreadcrumbIcon.displayName = "blocks.BreadcrumbIcon";
BreadcrumbLabel.displayName = "blocks.BreadcrumbLabel";
BreadcrumbSeparator.displayName = "blocks.BreadcrumbSeparator";
BreadcrumbItemWrapper.displayName = "blocks.BreadcrumbItemWrapper";

export { Breadcrumbs, BreadcrumbItem, BreadcrumbIcon, BreadcrumbLabel, BreadcrumbSeparator, BreadcrumbItemWrapper };
export type {
  BreadcrumbsProps,
  BreadcrumbItemProps,
  BreadcrumbIconProps,
  BreadcrumbLabelProps,
  BreadcrumbSeparatorProps,
  BreadcrumbItemWrapperProps,
};
