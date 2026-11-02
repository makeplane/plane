/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import type { MenuProps } from "@makeplane/propel/components/menu";
import { Menu, MenuContent, MenuGroup, MenuItem, MenuLabel, MenuTrigger } from "@makeplane/propel/components/menu";
import { Pill } from "@makeplane/propel/components/pill";
import { ChevronRightOutline } from "@makeplane/propel/icons";
import { SelectDropdownPlacementContext } from "../select/dropdown-placement";
import type { SelectDropdownPlacement } from "../select/dropdown-placement";
import type { WorkItemPropertyEntry } from "./types";

/** Editors opened from the menu flyout to its left, so they never cover the list they came from. */
const EDITOR_PLACEMENT: SelectDropdownPlacement = { side: "left", align: "start" };

/** Dismissals that should first close an editor opened from the menu, not the menu itself. */
const HELD_CLOSE_REASONS = new Set(["outside-press", "focus-out", "escape-key", "item-press"]);

const OPEN_TRIGGER_SELECTOR = '[aria-expanded="true"], [data-popup-open]';

/** Keeps a press on the "+N" trigger from reaching the clickable row it sits in. */
const swallowRowEvent = (event: SyntheticEvent<HTMLElement>) => {
  event.stopPropagation();
  event.preventDefault();
};

export type PropertiesOverflowMenuProps = {
  /** The collapsed entries, in row order. */
  entries: WorkItemPropertyEntry[];
  /** Translated menu heading, e.g. "Properties". */
  label: string;
  /** Accessible name of the "+N" trigger, e.g. "3 more properties". */
  triggerAriaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the trigger's wrapper so the row can measure it. */
  triggerRef?: (node: HTMLElement | null) => void;
};

/**
 * The "+N" pill that collects the properties a row has no room for, and its Properties menu. Each
 * row shows the property's icon, name and current value; picking an editable row opens that
 * property's own editor (anchored to the row), action rows run their action, and read-only rows
 * are disabled.
 *
 * While an editor opened from the menu is open, a press or focus move into that editor's popup
 * (or Escape) must close the editor first and keep the menu open.
 */
export function PropertiesOverflowMenu(props: PropertiesOverflowMenuProps) {
  const { entries, label, triggerAriaLabel, open, onOpenChange, triggerRef } = props;
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Set when a row's editor is opened and cleared from its `onClose`. Focus can leave the panel for
  // the editor's popup before that popup reports itself open, so focus-out also checks this.
  const editorKeyRef = useRef<string | null>(null);

  const isEditorOpen = () => !!panelRef.current?.querySelector(OPEN_TRIGGER_SELECTOR);

  const handleOpenChange: NonNullable<MenuProps["onOpenChange"]> = (nextOpen, details) => {
    if (!nextOpen && HELD_CLOSE_REASONS.has(details.reason)) {
      const target = details.event?.target;
      const guardedRegion = target instanceof Element ? target.closest("[data-prevent-outside-click]") : null;
      const fromForeignPopup = !!guardedRegion && !panelRef.current?.contains(guardedRegion);
      const editorPending = details.reason === "focus-out" && editorKeyRef.current !== null;
      if (isEditorOpen() || fromForeignPopup || editorPending) {
        details.cancel();
        return;
      }
    }
    if (!nextOpen) editorKeyRef.current = null;
    onOpenChange(nextOpen);
  };

  return (
    <Menu open={open} onOpenChange={handleOpenChange} modal={false}>
      <div
        ref={triggerRef}
        role="presentation"
        data-hidden-count={entries.length}
        className="flex shrink-0 items-center"
        onClick={swallowRowEvent}
        onFocus={(event) => event.stopPropagation()}
      >
        <MenuTrigger render={<Pill size="sm" label={`+${entries.length}`} aria-label={triggerAriaLabel} />} />
      </div>
      <MenuContent side="bottom" align="end">
        {/* React events from the portalled panel still bubble to the row's link; stop them here. */}
        <div
          ref={panelRef}
          role="presentation"
          className="flex min-h-0 flex-1 flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <MenuGroup>
            <MenuLabel>{label}</MenuLabel>
            <div className="max-h-60 overflow-y-auto">
              {entries.map((entry) => (
                <PropertiesOverflowMenuRow
                  key={entry.key}
                  entry={entry}
                  onEditorOpen={() => {
                    editorKeyRef.current = entry.key;
                  }}
                  onEditorClose={() => {
                    if (editorKeyRef.current === entry.key) editorKeyRef.current = null;
                  }}
                />
              ))}
            </div>
          </MenuGroup>
        </div>
      </MenuContent>
    </Menu>
  );
}

type PropertiesOverflowMenuRowProps = {
  entry: WorkItemPropertyEntry;
  onEditorOpen: () => void;
  onEditorClose: () => void;
};

function PropertiesOverflowMenuRow(props: PropertiesOverflowMenuRowProps) {
  const { entry, onEditorOpen, onEditorClose } = props;
  const { icon, label, preview, editor, onSelect, disabled = false } = entry.menuRow;
  const previewNode =
    preview === undefined ? null : (
      <span className="max-w-24 truncate text-caption-md-regular text-placeholder">{preview}</span>
    );

  if (editor && !disabled) {
    return (
      <MenuItem
        icon={icon}
        label={label}
        closeOnClick={false}
        render={<div className="relative" />}
        onClickCapture={onEditorOpen}
        onClick={(event: MouseEvent<HTMLElement>) => {
          // Keyboard activation clicks the row itself; hand it on to the editor's trigger.
          if (event.target === event.currentTarget) {
            event.currentTarget.querySelector<HTMLElement>("button")?.click();
          }
        }}
        trailing={
          <>
            {previewNode}
            <ChevronRightOutline className="size-4 shrink-0 text-placeholder" />
            <SelectDropdownPlacementContext.Provider value={EDITOR_PLACEMENT}>
              {editor({ onEditorClose })}
            </SelectDropdownPlacementContext.Provider>
          </>
        }
      />
    );
  }

  if (onSelect && !disabled) {
    return (
      <MenuItem
        icon={icon}
        label={label}
        trailing={previewNode}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          onSelect();
        }}
      />
    );
  }

  return <MenuItem icon={icon} label={label} trailing={previewNode} disabled />;
}
