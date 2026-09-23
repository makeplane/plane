/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import type { ComboboxContentSizing } from "@makeplane/propel/components/combobox";
import type { ComboboxSize } from "@makeplane/propel/elements/combobox";
import type { PillButtonSize } from "../pill-button";
import type { IconElement } from "../types";
import type { TPaginatedResponse } from "@plane/types";

/** Trigger chrome variants. */
export type SelectTriggerVariant =
  | "table-cell"
  | "pill"
  | "select"
  | "select-ghost"
  | "breadcrumb"
  | "icon"
  | "search-input";

/** `pill` / `icon` trigger chrome size — source of truth is `PillButtonSize` in `@plane/blocks/pill-button`,
 * which in turn tracks `@makeplane/propel`'s pill button scale. */
export type SelectTriggerSize = PillButtonSize;

/** `select` / `select-ghost` trigger chrome size — propel's combobox scale, so a step means the same
 * thing here as on a `ComboboxTrigger`: `md` 28px / body-xs, `lg` 32px / body-sm, `xl` 36px /
 * body-sm, `2xl` 40px / body-md. */
export type SelectChromeSize = NonNullable<ComboboxSize>;

export type SelectVariant =
  | `pill-${SelectTriggerSize}`
  | `icon-${SelectTriggerSize}`
  | `select-${SelectChromeSize}`
  | `select-ghost-${SelectChromeSize}`
  | "table-cell"
  | "breadcrumb"
  | "search-input";

/** Params passed to a paginated `getValues`. The Select owns cursor + search state. */
export type SelectPaginationParams = {
  cursor?: string;
  search?: string;
};

type SelectBaseProps<T> = {
  /** Maps an option to its stable string id — the value the Combobox and `onChange` operate on. */
  getOptionValue: (option: T) => string;
  /** Human-readable label — the option row's visible text and the default trigger text. Falls back to `getOptionValue`. */
  getOptionLabel?: (option: T) => string;
  /**
   * Text the in-dropdown search matches against, when that differs from the visible label — an
   * option whose row shows a project's name but should also be reachable by typing its identifier.
   * Sync mode only: an `infinite` list searches on the server. Defaults to `getOptionLabel`.
   */
  getOptionSearchText?: (option: T) => string;
  /**
   * Leading element of an option row — an icon, avatar, logo or colour dot; it follows the checkbox
   * on a multi-select row. `getOptionLabel` supplies the row's text. The selection mark is the
   * Select's own — a trailing check when single, a leading checkbox when multiple — so a caller
   * never draws one.
   */
  getOptionIcon?: (option: T) => ReactNode;
  /** Content pinned at a row's inline end, after the single-select check — e.g. a project identifier. */
  getOptionTrailing?: (option: T) => ReactElement | undefined;
  /** A second, muted line under the label. Rows carrying one grow past the standard single-line height. */
  getOptionDescription?: (option: T) => ReactNode;
  /**
   * @deprecated Draws the whole row by hand, bypassing the standard row and its selection mark —
   * so the caller has to draw its own. Use {@link getOptionIcon}, {@link getOptionTrailing} and
   * {@link getOptionDescription} instead; kept only until the remaining call sites migrate.
   */
  renderOption?: (option: T) => ReactNode;
  /** Renders a selected option's chip content — `variant="search-input"` only. Separate from `renderOption` since a chip's compact avatar+name layout differs from a dropdown row's. */
  renderChip?: (option: T) => ReactNode;
  /**
   * When provided, only options returning `true` are shown in the list. Applied after pagination /
   * sync loading and before pinning the selection — the currently-selected item is pinned first so
   * callers don't need to special-case it here.
   */
  filterOption?: (option: T) => boolean;
  /**
   * Marks individual options as non-selectable. The row keeps its place in the list and arrow keys
   * still highlight it — base-ui does not skip disabled rows — but neither a click nor Enter
   * selects it.
   */
  getOptionDisabled?: (option: T) => boolean;
  /**
   * Turns a row into a real link. When this returns a URL the option element itself renders as an
   * `<a href>` — so the row can be middle-clicked, opened in a new tab, and copied — instead of the
   * default `<div role="option">`, and a plain click navigates the browser.
   *
   * **Such a row never runs `onChange`.** Base UI's combobox bails out of selection whenever the
   * pressed element sits inside an `<a href>`, and it decides that from the DOM, so `preventDefault`
   * does not restore it. Return `undefined` for any option whose selection has to run a callback.
   */
  getOptionHref?: (option: T) => string | undefined;
  /** Blocks the whole control: the trigger stops opening the dropdown and stops firing `onChange`. */
  disabled?: boolean;
  /** Forwards to Base UI Combobox.Root. Useful for components that need modal focus/outside-click handling. */
  modal?: boolean;
  /** Placeholder shown by `Select.Value` when nothing is selected. */
  placeholder?: string;
  /** Placeholder for the in-dropdown search input (and, for `variant="search-input"`, the chips field),
   * i.e. the value behind `SelectContextValue.search.placeholder`. Defaults to the translated
   * `common.search.label`. Not the same as `placeholder`, which labels the trigger's empty value. */
  searchPlaceholder?: string;
  /** Whether to render the in-dropdown search input. Default: true. */
  showSearch?: boolean;
  /** Shown when there are no items. Pass a function to render off the live search query. */
  emptyMessage?: ReactNode | ((query: string) => ReactNode);
  /** Fired when the dropdown closes. */
  onClose?: () => void;
  /** Compose `Select.Trigger` / `Select.Value` here. */
  children?: ReactNode;
  /** Infinite mode only. Estimated row height (px) for the virtualizer. */
  estimateItemSize?: number;
  /**
   * How an id with no loaded option is represented, for the `valueIds` mode. Called once per
   * unresolved id — the stand-in is then remembered for as long as that id stays selected, so
   * build it from the id alone — and returns the minimal option object the trigger and rows can
   * render (typically `{ id, name: id }`). Without it an unresolved id still survives `onChange`,
   * but nothing can be drawn for it, so the trigger simply shows one fewer chip.
   */
  getOptionPlaceholder?: (id: string) => T;
  /** Static items always pinned to the top of the list, before any selected-item pinning. */
  headerItems?: T[];
  /**
   * Whether the in-list search filters {@link headerItems} too. Default `false`: a header row is a
   * pinned affordance ("All projects", "None"), not a result, so it stays visible while the user
   * types — the behaviour the legacy `filter={keepAllRowVisible}` idiom produced. Sync mode only;
   * infinite lists are server-filtered.
   */
  filterHeaderItems?: boolean;
  /**
   * Splits the list into labelled sections: returns the section an option belongs to, and a
   * non-interactive heading row is rendered whenever that value changes as the list is walked. The
   * caller owns the ordering — sort `getValues`' result so each section's options are contiguous.
   * Return `undefined` for an option that should sit outside any section.
   *
   * Distinct from {@link headerItems}, which pins real, selectable options to the top.
   */
  getOptionGroup?: (option: T) => string | undefined;
  /**
   * Sticky chrome pinned above the option list — e.g. an AM/PM toggle over a list of times, or a
   * segmented control that swaps what the list shows. It sits below the search field and outside
   * the scroll area, so it stays visible while the list scrolls, and the in-list search never
   * filters it: it is chrome, not a result.
   *
   * Distinct from {@link headerItems}, which pins real, selectable *options* to the top of the
   * list. Reach for those when the row is something the user picks; reach for this when it is not.
   *
   * The slot is in the tab order: it renders after the search field in document order and the
   * popup is non-modal, so Tab out of the search field lands on the slot's own chrome with the
   * panel still open. Interactive chrome here needs no `tabIndex` of its own and should not be
   * taken out of the tab order. The same holds for {@link footer}.
   */
  header?: ReactNode;
  /**
   * Sticky chrome pinned below the option list — e.g. a toggle row that changes what the list
   * shows. It sits outside the scroll area, so it stays visible while the list scrolls.
   */
  footer?: ReactNode;
  /**
   * Enter in the search field with nothing to select — no row highlighted, or a query that matches
   * no option at all — calls this with the trimmed query instead. That is the legacy
   * "type a name and press Enter to create it" affordance (`pages/labels.tsx`), which the plain
   * combobox has no gesture for.
   *
   * Not called for an empty query, and never in place of a selection: once the user has arrowed
   * onto a row, Enter selects that row as usual. The Select keeps the dropdown open and the query
   * intact afterwards — the caller decides what happens next, and can close it through
   * {@link SelectContextValue.close}.
   *
   * That open-afterwards half needs base-ui's own opt-out, not `preventDefault`: base-ui's Enter
   * branch with no active row is `setOpen(false)`. The submitting keystroke — and only that one —
   * is marked with `preventBaseUIHandler()`, so base-ui does not act on it. Every other key, and
   * every Enter that is not a submit, reaches base-ui untouched.
   *
   * Wired on both search fields: the popup's own, and — through
   * {@link SelectContextValue.search}`.onKeyDown` — `variant="search-input"`'s chips field, which
   * is the only Enter path a `showSearch={false}` chips picker has.
   */
  onSearchSubmit?: (query: string) => void;
  /**
   * Render only the trigger (a cheap display of the selected value) until the cell is clicked, then
   * mount + open the dropdown in one action. Defers the base-ui combobox, the option list and
   * `getValues` until the user edits — removing the per-cell mount cost from every layout that uses
   * this Select (board, list, spreadsheet, detail). On by default; pass `false` to keep the dropdown
   * always mounted for a surface that needs it.
   */
  lazyMount?: boolean;
  /**
   * Reorders the selected option(s) to the top of the list, so a selection buried in a long list is
   * visible the moment the dropdown opens. Default: true.
   *
   * Ruling 45: pass `false` for a SMALL FIXED option set — priority, state, a role list, a handful
   * of layout modes. There is nothing to scroll past there, and reordering makes a list the user
   * has memorised jump around every time they open it.
   */
  pinSelected?: boolean;
  /**
   * Panel width — propel's `ComboboxContent` sizing axis (`auto` hugs the content between 12rem and
   * 24rem, `anchor` matches the trigger). Defaults to `auto`.
   */
  contentSizing?: ComboboxContentSizing;
  /**
   * Opens the dropdown on mount (and mounts the engine, whatever `lazyMount` says) — for a picker
   * that IS the surface, e.g. a filter row that appears already open. Uncontrolled after that: the
   * user closes it like any other dropdown.
   */
  defaultOpen?: boolean;
  /**
   * Controlled open state — for a caller that opens the picker itself (a filter row that pops its
   * value editor as soon as the field is added). Pair it with {@link onOpenChange}, or the user can
   * never close what you opened. Supersedes {@link defaultOpen}.
   *
   * The value is the only thing that opens and closes the dropdown: a change base-ui asks for and
   * the caller does not accept runs nothing, so keeping `open` true through an Escape leaves the
   * loaded pages, the query and `onClose` alone.
   */
  open?: boolean;
  /**
   * Fired on every open and close, controlled or not — including the ones base-ui drives (trigger
   * press, outside press, Escape). {@link onClose} still fires on the close side; this is the
   * two-sided signal a controlled caller needs.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * `z-index` for the popup's positioner. Propel's positioner is fixed at `z-50` and
   * `ComboboxContent` exposes neither a z axis nor its portal container, so a Select opened from
   * inside a higher-stacked floating panel renders behind it. Blocks writes the value onto the
   * positioner element itself the moment the portaled popup mounts (the positioner unmounts with
   * it, so nothing needs restoring) — drop this once propel grows the axis (upstream ask).
   */
  positionerZIndex?: number;
  /**
   * Shown when an infinite `getValues` rejects, with a retry action beside it. Pass a function to
   * render off the error. Defaults to the shared "something went wrong" copy. Ignored in sync mode,
   * which has nothing to fail.
   *
   * A failed FIRST load or search replaces the list — the rows left over belong to the previous
   * query, and offering them under this row would read as though the list were still live. A failed
   * *next page* sits above the pages that did load and leaves them selectable, and its retry
   * re-requests that same page rather than starting over.
   */
  errorMessage?: ReactNode | ((error: unknown) => ReactNode);
  /**
   * The status line shown above the list while a fetch that replaces it is in flight — the first
   * open and every new query alike. Defaults to the shared "Searching..." copy. Paging in the next
   * page shows the list's own loader row instead. Infinite mode only.
   */
  searchingMessage?: ReactNode;
};

/**
 * The selection, as full option objects.
 *
 * **Ruling 46 — derive it id-first.** When the stored value is ids, resolve each id through a
 * lookup and keep the ones that miss:
 *
 * ```ts
 * const byId = new Map(options.map((o) => [o.id, o]));
 * const value = ids.map((id) => byId.get(id) ?? { id, name: id });
 * ```
 *
 * Deriving it as `options.filter((o) => ids.includes(o.id))` silently drops every id whose option
 * is not in the list — one that has not paged in yet, or was deactivated. The Select then reports
 * the shortened set on the next `onChange`, and a consumer diffing that payload reads the missing
 * ids as deliberate removals.
 *
 * **Preferred**: hand the multi-select `valueIds` instead of `value` and let the Select do the
 * resolving. It matches each id against the loaded options and falls back to
 * {@link SelectBaseProps.getOptionPlaceholder} for the rest, so an unresolved id is structurally
 * incapable of falling out of `onChange`. `value` keeps working unchanged.
 *
 * An option resolved once stays resolved: the Select remembers every option it has loaded for a
 * selected id, so the closed trigger keeps naming the selection after an infinite list has been
 * emptied on close. Ids the caller drops from `valueIds` are forgotten with them.
 */
type SelectMultiplicityProps<T> =
  // Single-select: the selected option as a full object (`null` when nothing is selected).
  | { multiple?: false; value: T | null; valueIds?: never; onChange: (val: string) => void }
  // Multi-select: the selected options as full objects.
  | { multiple: true; value: T[]; valueIds?: never; onChange: (val: string[]) => void }
  // Multi-select, ids in: the Select resolves them itself. See `valueIds` / `getOptionPlaceholder`.
  | { multiple: true; value?: never; valueIds: string[]; onChange: (val: string[]) => void };

type SelectDataProps<T> =
  | { infinite?: false; getValues: () => T[] }
  | { infinite: true; getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<T[]>> };

export type SelectProps<T> = SelectBaseProps<T> & SelectMultiplicityProps<T> & SelectDataProps<T>;

/** Context exposed to `Select.Trigger` / `Select.Value` and to content rendered inside the dropdown (e.g. `emptyMessage`). */
export type SelectContextValue<T> = {
  /** The currently selected options as full objects — one entry at most when `multiple` is false. */
  selected: T[];
  /** Mirror of {@link SelectProps.multiple}: whether the control selects many options or one. */
  multiple: boolean;
  /** Whether the dropdown is currently open — defaults `Select.Trigger`'s `isActive` chrome. */
  isOpen: boolean;
  /** Mirror of {@link SelectBaseProps.placeholder} — what `Select.Value` shows with nothing selected. */
  placeholder?: string;
  /** Mirror of {@link SelectBaseProps.getOptionValue} — the option's stable id. */
  getOptionValue: (option: T) => string;
  /** Mirror of {@link SelectBaseProps.getOptionLabel} — the option's plain-text label, used for search and chips. */
  getOptionLabel: (option: T) => string;
  /** Mirror of {@link SelectBaseProps.getOptionIcon} — what `Select.Value` draws before a single selection's label. */
  getOptionIcon?: (option: T) => ReactNode;
  /** Mirror of the deprecated {@link SelectBaseProps.renderOption}, for callers still drawing rows by hand. */
  renderOption?: (option: T) => ReactNode;
  /** Mirror of {@link SelectBaseProps.renderChip} — a selected option's chip content, `variant="search-input"` only. */
  renderChip?: (option: T) => ReactNode;
  /** `variant="search-input"`'s controlled search state. Optional — hand-rolled `SelectContext.Provider`
   * producers that skip this variant (e.g. release-select.tsx) don't need to supply it.
   *
   * `onKeyDown` carries {@link SelectProps.onSearchSubmit}'s Enter handling, so the chips field
   * behaves like the in-list search field. Omitted when the caller passed no `onSearchSubmit`. */
  search?: {
    query: string;
    onChange: (query: string) => void;
    placeholder?: string;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  };
  /** Closes the dropdown. For content rendered inside it that needs to close it itself — e.g. an inline "create new option" affordance closing once creation succeeds. */
  close: () => void;
};

/** Tooltip override content — a custom heading and/or empty-selection text. */
export type SelectTooltipOverride = {
  heading?: string;
  emptyContent?: string;
};

/**
 * Trigger tooltip: `true` shows it with defaults, `false`/`undefined` keeps it off, an object shows
 * it with a custom `heading`/`emptyContent`. JSX boolean shorthand (`tooltip`) reads like the old
 * `showTooltip` flag; pass an object only when overriding the default copy.
 */
export type SelectTooltip = SelectTooltipOverride | boolean;

export type SelectTriggerProps<T> = {
  /** Disables this trigger only. `SelectProps.disabled` already covers the whole control; pass this
   * when a hand-composed trigger has to go inert on its own. */
  disabled?: boolean;
  /**
   * The single source of chrome. `pill-{size}` renders the propel pill button (via `getPillButtonClassName`);
   * `icon-{size}` is prepend-only (no label children) with transparent chrome — for compact attribute rows;
   * `table-cell` / `breadcrumb` use the `triggerVariants` styles; `select-{size}` / `select-ghost-{size}`
   * use `getSelectClassName` and render `SelectContent`. Defaults to `pill-sm`; unrecognised values fall
   * back to `pill-sm` in `splitSelectVariant`.
   */
  variant: SelectVariant;
  /** Applies the active/open chrome. Defaults to the dropdown's own open state; pass to override (e.g. a focused table cell). */
  isActive?: boolean;
  /** Escape hatch merged onto the trigger button after the variant classes. */
  className?: string;
  /** Leading icon, size-cloned into the trigger's `PillButtonContent`. Element or a render-prop of the selection. */
  prependIcon?: IconElement | ((selected: T[]) => IconElement | undefined);
  /**
   * Trailing icon, size-cloned into the trigger's `PillButtonContent`. Element or a render-prop of
   * the selection. Pass `null` (or a render-prop returning `null`) to suppress the trailing glyph
   * entirely on every variant that draws one — that is how the legacy `noChevron` sites drop the
   * `select-*` and `breadcrumb` chrome's own chevron, which `undefined` would leave in place.
   */
  appendIcon?: IconElement | null | ((selected: T[]) => IconElement | null | undefined);
  /**
   * Truncated label text for the canonical `breadcrumb` chrome (icon + label + chevron), which the
   * trigger renders entirely on its own. Required for `variant="breadcrumb"`; every other variant
   * ignores it and renders `children` instead.
   */
  label?: string | ((selected: T[]) => string);
  /** Node, or a render-prop receiving the selected options (typed via `<Select.Trigger<T>>`). */
  children?: ReactNode | ((selected: T[]) => ReactNode);
  /** Opt-in hover tooltip on the trigger: heading + the selected value(s), comma-joined via `getOptionLabel`. */
  tooltip?: SelectTooltip;
  /**
   * Tab order of the trigger element, for forms that sequence focus explicitly (the work item,
   * intake and customer create modals order every control through `ETabIndices`). Threaded to
   * whichever element the variant renders — the resting button, the mounted base-ui trigger, and
   * the `search-input` chips field alike.
   */
  tabIndex?: number;
  /**
   * DOM id of the rendered trigger element. Forms pair it with a `<label htmlFor>` so clicking the
   * label focuses the control — the legacy `buttonId` prop. On `variant="search-input"` it lands on
   * the chips field's own input (the labelable control); `data-*` stay on the chips frame.
   */
  id?: string;
} & {
  /** `data-*` attributes (tour anchors, test ids) are forwarded to the rendered trigger element. */
  [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

export type SelectValueProps<T> = {
  /** Overrides {@link SelectBaseProps.placeholder} for this `Select.Value` only. */
  placeholder?: string;
  /** Override the default rendering of the selected value(s) (typed via `<Select.Value<T>>`). */
  children?: (selected: T[]) => ReactNode;
};
