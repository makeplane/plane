/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { Avatar } from "@makeplane/propel/components/avatar";
import { AvatarGroup } from "@makeplane/propel/components/avatar-group";
import type { AvatarGroupSize } from "@makeplane/propel/components/avatar-group";
import { AssigneeOutline, UserAltOutline } from "@makeplane/propel/icons";
import type { TPaginatedResponse } from "@plane/types";
import { Select } from "../select/select";
import type { SelectPaginationParams, SelectTooltip, SelectTriggerSize, SelectVariant } from "../select/types";
import { splitSelectVariant } from "../select/utils";
import { cn, getAvatarName } from "@plane/utils";

/** Minimal member shape the dropdown needs — the client maps its richer record down to this. */
export type MemberOption = {
  id: string;
  display_name: string;
  /** The person's plain name for the avatar (accessible name and derived initials), when `display_name` carries
   *  a label such as " (you)". Defaults to `display_name`, with parenthetical tokens stripped. */
  name?: string;
  /** Final avatar URL (the client applies `getFileURL`); empty/undefined falls back to initials. */
  avatar_url?: string | null;
};

export type MemberSelectVariant = SelectVariant | `avatar-group-${SelectTriggerSize}`;

/** Narrows `MemberSelectVariant` to its avatar-group member — lets every avatar-group-only
 *  computation below read `props.variant`'s size off the narrowed type instead of asserting it. */
function isAvatarGroupVariant(variant: MemberSelectVariant): variant is `avatar-group-${SelectTriggerSize}` {
  return variant.startsWith("avatar-group-");
}

/** Avatar-only trigger: keep the matching `pill-*` footprint (`h-5|6|7`) so swapping empty pill ↔
 *  faces does not collapse the row, but drop border/fill/padding so faces are not boxed in menu
 *  chrome and fill the same height as sibling pills. `min-h-0` overrides flex `min-height: auto`
 *  so a default `md` (28px) Avatar cannot stretch the pill and reflow the form. */
const AVATAR_GROUP_TRIGGER_CLASSNAME =
  "max-w-none min-h-0 border-transparent bg-transparent px-0 py-0 hover:border-transparent hover:bg-transparent active:border-transparent active:bg-transparent";

/** Face size matching the pill height — `xs` (20px) = `pill-sm` / `h-5`, same as sibling state
 *  and priority chips. Propel Avatar defaults to `md` (28px) when `size` is omitted; that
 *  overflows `h-5`/`h-6` and jumps the row. Always pass this through to each `Avatar`. */
const TRIGGER_AVATAR_SIZE: Record<SelectTriggerSize, AvatarGroupSize> = {
  sm: "xs",
  md: "xs",
  lg: "sm",
};

/** `avatar-group-*`'s resolved trigger footprint, keyed off the same `SelectTriggerSize` as
 *  `TRIGGER_AVATAR_SIZE` — an explicit map (not a `pill-${size}` template literal) so a new
 *  `SelectTriggerSize` fails to compile here until its `pill-*` variant is filled in. */
const TRIGGER_SIZE_VARIANT: Record<SelectTriggerSize, SelectVariant> = {
  sm: "pill-sm",
  md: "pill-md",
  lg: "pill-lg",
};

/** `splitSelectVariant` doesn't recognise `avatar-group` and its result covers both trigger-size and
 *  chrome-size variants — swap in the same-shaped `pill-*` string (always resolves to the trigger-size
 *  branch) so the return narrows to `SelectTriggerSize` on its own, without asserting it. */
function avatarGroupTriggerSize(variant: `avatar-group-${SelectTriggerSize}`): SelectTriggerSize {
  const split = splitSelectVariant(variant.replace("avatar-group", "pill"));
  return split.isSelectKind ? "md" : split.size;
}

/** Dropdown row is a fixed `h-7`; pin the option face in a reserved slot so a size flash cannot
 *  grow the panel. Matches the clear-option glyph box. */
const OPTION_ICON_SLOT_CLASSNAME = "grid size-5 shrink-0 place-items-center overflow-hidden";

/** Faces shown on the trigger before remaining members collapse into a "+N" chip.
 *  AvatarGroup also receives one extra resolved face (`MAX_TRIGGER_AVATARS + 1`) so a stack of
 *  exactly `max + 1` shows every face instead of a "+1" chip. */
export const MAX_TRIGGER_AVATARS = 3;

/** Id for the "No assignee" clear option — an empty string maps to `null` via `val || null`. */
const CLEAR_OPTION_ID = "";

/** Initials must not see labels like " (you)" — Propel uses first+last whitespace tokens. */
function memberAvatarAlt(member: MemberOption): string {
  return getAvatarName(member.name || member.display_name);
}

type MemberSelectCommonProps = {
  /** Paginated fetcher, bound by the client to the members-lite service (cursor + optional server search). */
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<MemberOption[]>>;
  /** Controls trigger chrome, button sizing, pill vs count display, and arrow/icon visibility. */
  variant: MemberSelectVariant;
  /**
   * Override the variant's default text-label visibility. Set `false` for avatars-only rows (e.g.
   * subscribers/authors) or `value <= 1` for "name when single, avatars-only when many" (assignees).
   */
  showLabel?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  /** Forwarded to the trigger as `data-testid` — value-agnostic e2e selector. */
  testId?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
  /** Re-filters the rendered list every render — unlike `getValues`, also catches an already-fetched, still-open list. */
  filterOption?: (member: MemberOption) => boolean;
};

export type MemberSelectProps = MemberSelectCommonProps &
  (
    | { multiple: true; value: MemberOption[]; onChange: (ids: string[]) => void }
    | {
        multiple?: false;
        value: MemberOption | null;
        onChange: (id: string) => void;
        clearable?: boolean;
        clearLabel?: string;
      }
  );

function triggerLabel(selected: MemberOption[], showCountOnMultiple: boolean, placeholder?: string): string {
  if (selected.length === 0) return placeholder ?? "";
  if (selected.length === 1) return selected[0]?.display_name ?? "";
  if (showCountOnMultiple) return `${selected.length} members`;
  // Join-names variant: only the first few selected are resolved (the rest are count-only stubs), so list
  // those names and summarise the remainder rather than rendering blanks for the unresolved ids.
  const names = selected
    .slice(0, MAX_TRIGGER_AVATARS)
    .map((member) => member.display_name)
    .filter(Boolean)
    .join(", ");
  const remaining = selected.length - MAX_TRIGGER_AVATARS;
  return remaining > 0 ? `${names} +${remaining}` : names;
}

/**
 * Presentational, data-source-agnostic member picker built on the generic infinite `Select` (single or
 * multi). The client supplies `getValues` (bound to the paginated members-lite service), the selected
 * `value` object(s) (resolved by the client in an observer context so they stay reactive), and an
 * `onChange` that persists the chosen id(s) — this block owns only the member-specific avatar/name markup.
 * Only the first few selected avatars are rendered (the rest become the "N members" count), so a large
 * selection never materialises hundreds of avatar nodes.
 */
export function MemberSelect(props: MemberSelectProps) {
  const {
    getValues,
    disabled = false,
    placeholder = "",
    searchPlaceholder: searchPlaceholderProp,
    showLabel: showLabelProp,
    onClose,
    className,
    tooltip,
    filterOption,
    testId,
    tabIndex,
  } = props;
  const clearable = !props.multiple && !!props.clearable;

  // `size` drives avatar sizing; `kind` (variant minus its size suffix) drives the member-specific
  // display logic. `splitSelectVariant` doesn't recognise `avatar-group` (a member-only kind) and would
  const isAvatarGroup = isAvatarGroupVariant(props.variant);
  // fall back to a hardcoded `sm` — swap in the same-shaped `pill` kind just for size parsing.
  const { size } = splitSelectVariant(isAvatarGroup ? props.variant.replace("avatar-group", "pill") : props.variant);
  const kind = isAvatarGroup ? "avatar-group" : props.variant.replace(`-${size}`, "");
  const isPill = kind === "pill";
  const isSearchInput = kind === "search-input";
  // `search-input`'s box IS the trigger (no separate label), so `placeholder` doubles as its empty
  // text unless the caller sets a distinct `searchPlaceholder`.
  const searchPlaceholder = searchPlaceholderProp ?? (isSearchInput ? placeholder : undefined) ?? "Search members...";

  // Only `avatar-group-*` maps its size onto the face — every other variant keeps the `xs` trigger face it
  // always had, so this fix doesn't reflow `pill-lg`/`select-lg`'s existing chrome. It's also not a Select
  // trigger kind on its own, so forward the same-size `pill-*` so height stays put when a form flips empty
  // pill → faces; chrome is cancelled via `AVATAR_GROUP_TRIGGER_CLASSNAME`. Testing the type guard directly
  // (rather than the `isAvatarGroup` alias, or a ternary) is what narrows `props.variant` per-branch below —
  // TS only carries a saved alias's narrowing onto a `readonly` property, and `variant` isn't one.
  let avatarSize: AvatarGroupSize = "xs";
  let triggerVariant: SelectVariant;
  if (isAvatarGroupVariant(props.variant)) {
    const triggerSize = avatarGroupTriggerSize(props.variant);
    avatarSize = TRIGGER_AVATAR_SIZE[triggerSize];
    triggerVariant = TRIGGER_SIZE_VARIANT[triggerSize];
  } else {
    triggerVariant = props.variant;
  }

  const showCountOnMultiple = kind === "table-cell" || isPill;
  const defaultShowLabel = !isAvatarGroup;
  // A call-site can override the variant's default label visibility (e.g. avatars-only subscriber rows).
  const showLabel = showLabelProp ?? defaultShowLabel;

  const selectedList = props.multiple ? props.value : props.value ? [props.value] : [];
  const selectedIds = new Set(selectedList.map((member) => member.id));

  const clearLabel = !props.multiple ? (props.clearLabel ?? (placeholder || "No assignee")) : "No assignee";
  const clearOption = useMemo<MemberOption>(
    () => ({ id: CLEAR_OPTION_ID, display_name: clearLabel, avatar_url: null }),
    [clearLabel]
  );

  // Chips are the only way to deselect for `search-input` (no click-to-toggle row), so an already-picked member shouldn't also appear in the list.
  const excludeSelected = (member: MemberOption) => !selectedIds.has(member.id);
  const combinedFilterOption = (member: MemberOption) => excludeSelected(member) && (filterOption?.(member) ?? true);

  const sharedProps = {
    infinite: true as const,
    getValues,
    disabled,
    placeholder,
    searchPlaceholder,
    onClose,
    // `Combobox.Chips` can't survive the lazy-mount resting state.
    lazyMount: isSearchInput ? false : undefined,
    showSearch: isSearchInput ? false : undefined,
    filterOption: isSearchInput ? combinedFilterOption : filterOption,
    getOptionValue: (member: MemberOption) => member.id,
    getOptionLabel: (member: MemberOption) => member.display_name,
    getOptionIcon: (member: MemberOption) =>
      member.id === CLEAR_OPTION_ID ? (
        <span className={OPTION_ICON_SLOT_CLASSNAME}>
          <UserAltOutline className="h-4 w-4 text-primary" />
        </span>
      ) : (
        <span className={OPTION_ICON_SLOT_CLASSNAME}>
          <Avatar alt={memberAvatarAlt(member)} src={member.avatar_url ?? ""} size="xs" />
        </span>
      ),
    renderChip: (member: MemberOption) => (
      <>
        <Avatar alt={memberAvatarAlt(member)} src={member.avatar_url ?? ""} size="2xs" />
        <span className="min-w-0 truncate">{member.display_name}</span>
      </>
    ),
    headerItems: clearable ? [clearOption] : undefined,
  };

  const trigger = (
    <Select.Trigger<MemberOption>
      disabled={disabled}
      variant={triggerVariant}
      tabIndex={tabIndex}
      data-testid={testId}
      className={cn(isAvatarGroup && AVATAR_GROUP_TRIGGER_CLASSNAME, className)}
      prependIcon={(members) =>
        members.length === 0 ? props.multiple ? <AssigneeOutline /> : <UserAltOutline /> : undefined
      }
      label={(members) => triggerLabel(members, showCountOnMultiple, placeholder)}
      tooltip={tooltip}
    >
      {(members) => (
        <>
          {members.length > 0 && (
            <span
              className={cn("flex items-center gap-1", !(showLabel && (members.length > 0 || !!placeholder)) && "grow")}
            >
              {/* Resolve one more than `MAX_TRIGGER_AVATARS` so `AvatarGroup` can render the real extra face
                  instead of a "+1" chip when `total` is exactly `max + 1`; `total` covers the rest. */}
              <AvatarGroup size={avatarSize} max={MAX_TRIGGER_AVATARS} total={members.length}>
                {members.slice(0, MAX_TRIGGER_AVATARS + 1).map((member) => (
                  <Avatar key={member.id} alt={memberAvatarAlt(member)} src={member.avatar_url ?? ""} />
                ))}
              </AvatarGroup>
            </span>
          )}
          {showLabel && (members.length > 0 || !!placeholder) && (
            <span className="min-w-0 grow truncate text-left">
              {triggerLabel(members, showCountOnMultiple, placeholder)}
            </span>
          )}
        </>
      )}
    </Select.Trigger>
  );

  // Branch on multiplicity so the generic `Select`'s discriminated value/onChange union narrows.
  if (props.multiple) {
    return (
      <Select<MemberOption> {...sharedProps} multiple value={props.value} onChange={props.onChange}>
        {trigger}
      </Select>
    );
  }

  return (
    <Select<MemberOption> {...sharedProps} value={props.value} onChange={props.onChange}>
      {trigger}
    </Select>
  );
}
