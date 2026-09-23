/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

/** What the overflow menu needs to render a collapsed crumb as a real menu row. */
export type TCollapsedCrumb = {
  label: string;
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
};

/**
 * Ruling 39. What a crumb rendered through a wrapper component contributes to the collapsed
 * overflow row. `getTextContent` can only read a tree it can see, and a wrapper
 * (`<ProjectBreadcrumbWithPreference projectId=… />`) keeps its markup inside itself — its props
 * are ids, so the row it collapsed to was blank. Naming the crumb on the wrapper element fixes
 * that without the wrapper having to expose its internals.
 *
 * Intersect it into a wrapper's own props so every consumer can thread the name through. The
 * wrapper does not have to read them: they are declared on the element, and the trail reads them
 * off the element it was handed. Which is why the wrapper must NOT forward them to the DOM —
 * `crumbLabel` / `crumbHref` / `crumbOnClick` are not HTML attributes, and React warns for each one
 * that reaches an element. Destructure the props the wrapper actually renders and build its markup
 * from those, exactly as the reference implementations do (`breadcrumbs.stories.tsx` `ProjectCrumb`
 * and its twin in `breadcrumbs.test.tsx`):
 *
 * ```tsx
 * type Props = { projectId: string; projectName: string } & TCrumbLabelProps;
 *
 * function ProjectCrumb(props: Props) {
 *   const { projectId, projectName } = props;                 // never `{...props}` onto the <a>
 *   return <a href={`#/projects/${projectId}`}>…</a>;
 * }
 *
 * <Breadcrumbs.Item
 *   component={<ProjectCrumb projectId={id} projectName={name} crumbLabel={name} crumbHref={href} />}
 * />
 * ```
 *
 * If a wrapper does spread the rest of its props onto an element, strip these three first:
 * `const { crumbLabel, crumbHref, crumbOnClick, ...rest } = props;` — `aria-label` is the one prop
 * on this type that is a real DOM attribute, so leave it in `rest` and let it through.
 *
 * `crumbLabel` alone gives a labelled but inert row: the wrapper's `href` is inside its markup,
 * which the trail cannot see either. A wrapper that navigates must also declare `crumbHref` (or
 * `crumbOnClick`) — or the call site must pass `href` on the `Breadcrumbs.Item`.
 */
export type TCrumbLabelProps = {
  /** Row label used when this crumb collapses into the overflow menu. */
  crumbLabel?: string;
  /** Fallback row label, for a wrapper that already names itself for assistive technology. */
  "aria-label"?: string;
  /**
   * Destination used when this crumb collapses into the overflow menu. Wrapper crumbs usually build
   * their own route from ids they already hold, so declaring it here keeps every call site from
   * repeating it. Without it (or {@link crumbOnClick}) the collapsed row is inert.
   */
  crumbHref?: string;
  /** Activation used when this crumb collapses into the overflow menu, for a crumb with no route. */
  crumbOnClick?: (event: React.MouseEvent<HTMLElement>) => void;
};

/** Guard against a pathological tree; four levels covers `Link > ItemWrapper > Label > text`. */
const MAX_CRUMB_DEPTH = 4;

/** The only props this reads back off a crumb's tree. Everything else on the element is ignored. */
type CrumbProps = {
  children?: React.ReactNode;
  crumbLabel?: unknown;
  label?: unknown;
  "aria-label"?: unknown;
  crumbHref?: unknown;
  crumbOnClick?: unknown;
  href?: unknown;
  onClick?: unknown;
};

function getProps(node: React.ReactNode): CrumbProps | undefined {
  return React.isValidElement(node) ? (node.props as CrumbProps) : undefined;
}

/**
 * The name a single element declares for itself, most explicit first: the Ruling 39 `crumbLabel`,
 * then the `label` the crumb parts already carry for their tooltip, then the `aria-label` a wrapper
 * may have set for assistive technology. Returns `undefined` when the element names nothing, so the
 * caller can keep walking down to the rendered text.
 */
export function readCrumbLabel(props: CrumbProps | undefined): string | undefined {
  if (!props) return undefined;
  for (const candidate of [props.crumbLabel, props.label, props["aria-label"]]) {
    if (typeof candidate === "string" && candidate !== "") return candidate;
  }
  return undefined;
}

/** `Array.isArray` widens a `ReactNode` to `any[]`, so re-assert the element type it really holds. */
function asChildren(node: React.ReactNode): React.ReactNode[] {
  return node as React.ReactNode[];
}

/** Joins every string and number leaf under a node, so a crumb's visible text becomes its label. */
function getTextContent(node: React.ReactNode, depth = 0): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node))
    return asChildren(node)
      .map((child) => getTextContent(child, depth))
      .join("");
  if (depth >= MAX_CRUMB_DEPTH) return "";
  const props = getProps(node);
  if (!props) return "";
  // A crumb that names itself (`crumbLabel`, `ItemWrapper label`, `BreadcrumbLink label`, or an
  // `aria-label`) beats its rendered text: it is the string already written for the tooltip or the
  // screen reader, so it is the one a person expects to read. A wrapper component has no rendered
  // text to fall back to at all — its children live inside it, not in its props — so this is the
  // only place its row label can come from.
  const declared = readCrumbLabel(props);
  if (declared !== undefined) return declared;
  return getTextContent(props.children, depth + 1);
}

/** Finds the first `href` or `onClick` in the crumb's tree — the consumer's `Link` or `button`. */
function findNavigation(
  node: React.ReactNode,
  depth = 0
): { href?: string; onClick?: (event: React.MouseEvent<HTMLElement>) => void } {
  if (depth >= MAX_CRUMB_DEPTH) return {};
  if (Array.isArray(node)) {
    for (const child of asChildren(node)) {
      const found = findNavigation(child, depth);
      if (found.href || found.onClick) return found;
    }
    return {};
  }
  const props = getProps(node);
  if (!props) return {};
  // A wrapper's own route wins over anything below it: `crumbHref` is the explicit declaration,
  // and it is the only one a wrapper component can make — its `<Link>` lives inside its markup.
  const href = typeof props.crumbHref === "string" ? props.crumbHref : undefined;
  const onClick =
    typeof props.crumbOnClick === "function"
      ? (props.crumbOnClick as (event: React.MouseEvent<HTMLElement>) => void)
      : undefined;
  if (href || onClick) return { href, onClick };
  const derivedHref = typeof props.href === "string" ? props.href : undefined;
  const derivedOnClick =
    typeof props.onClick === "function" ? (props.onClick as (event: React.MouseEvent<HTMLElement>) => void) : undefined;
  if (derivedHref || derivedOnClick) return { href: derivedHref, onClick: derivedOnClick };
  return findNavigation(props.children, depth + 1);
}

/**
 * Derives the label and navigation for a crumb that has been collapsed into the overflow menu.
 *
 * The compound API takes a `component` node rather than data, so the row has to be read back out of
 * that tree. `Breadcrumbs.Item`'s own `label` / `href` / `onClick` win when given — pass them when
 * the crumb's markup is unusual enough that this cannot find them.
 *
 * A crumb whose markup lives inside a wrapper component has no tree to read: name it with
 * {@link TCrumbLabelProps.crumbLabel} (or an `aria-label`) on the wrapper element itself.
 */
export function getCollapsedCrumb(
  component: React.ReactNode,
  overrides: Partial<TCollapsedCrumb> = {}
): TCollapsedCrumb {
  const navigation = findNavigation(component);
  return {
    label: overrides.label ?? getTextContent(component),
    href: overrides.href ?? navigation.href,
    onClick: overrides.onClick ?? navigation.onClick,
  };
}
