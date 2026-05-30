/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
// plane imports
import { COMPLEX_ITEMS, TOOLBAR_ITEMS, TYPOGRAPHY_ITEMS, USER_ACTION_ITEMS } from "@plane/editor";
import type { EditorRefApi, ToolbarMenuItem } from "@plane/editor";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

type Props = {
  editorRef: EditorRefApi | null;
};

// Always-visible toolbar so non-technical authors never need slash commands or
// the bubble menu for the basics. Items reuse the shared editor toolbar registry;
// the rich-text editor supports all of these via the core extension set.
const HEADING_KEYS = ["h1", "h2", "h3"];
const TOOLBAR_GROUPS: ToolbarMenuItem[][] = [
  TYPOGRAPHY_ITEMS.filter((item) => HEADING_KEYS.includes(item.itemKey)),
  TOOLBAR_ITEMS.document.basic,
  TOOLBAR_ITEMS.document.list,
  USER_ACTION_ITEMS,
  COMPLEX_ITEMS,
];

export function HelpEditorToolbar({ editorRef }: Props) {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  const updateActiveStates = useCallback(() => {
    if (!editorRef) return;
    const next: Record<string, boolean> = {};
    TOOLBAR_GROUPS.flat().forEach((item) => {
      // TODO: editor toolbar types are not yet homogenized across editor kinds
      // @ts-expect-error type mismatch between item key union and ref API
      next[item.renderKey] = editorRef.isMenuItemActive({ itemKey: item.itemKey, ...item.extraProps });
    });
    setActiveStates(next);
  }, [editorRef]);

  useEffect(() => {
    if (!editorRef) return;
    // Active states populate on the first editor state change (selection/edit);
    // no synchronous setState here to avoid cascading renders on mount.
    const unsubscribe = editorRef.onStateChange(updateActiveStates);
    return () => unsubscribe();
  }, [editorRef, updateActiveStates]);

  const executeCommand = (item: ToolbarMenuItem) => {
    // @ts-expect-error type mismatch between item key union and ref API
    editorRef?.executeMenuItemCommand({ itemKey: item.itemKey, ...item.extraProps });
  };

  return (
    <div className="flex flex-wrap items-stretch gap-1 rounded-t-md border-b border-subtle bg-surface-2 p-1.5">
      {TOOLBAR_GROUPS.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className={cn("flex items-stretch gap-0.5 px-1.5", {
            "border-l border-subtle": groupIndex !== 0,
            "pl-0": groupIndex === 0,
          })}
        >
          {group.map((item) => {
            const isItemActive = activeStates[item.renderKey];
            return (
              <Tooltip
                key={item.renderKey}
                tooltipContent={
                  <p className="flex flex-col gap-1 text-center text-11">
                    <span className="font-medium">{item.name}</span>
                    {item.shortcut && <kbd className="text-placeholder">{item.shortcut.join(" + ")}</kbd>}
                  </p>
                }
              >
                <button
                  type="button"
                  onClick={() => executeCommand(item)}
                  className={cn(
                    "grid aspect-square place-items-center rounded p-1 text-tertiary hover:bg-layer-1-hover",
                    { "bg-layer-1-hover text-primary": isItemActive }
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
