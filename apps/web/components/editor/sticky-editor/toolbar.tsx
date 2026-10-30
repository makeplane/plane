/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { useEffect, useState, useCallback } from "react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarToggle } from "@makeplane/propel/components/toolbar";
import { Tooltip, TooltipProvider } from "@makeplane/propel/components/tooltip";
import { DeleteOutline, PaletteOutline } from "@makeplane/propel/icons";
import type { EditorRefApi, ToolbarMenuItem } from "@plane/editor";
import { TOOLBAR_ITEMS } from "@plane/editor";
import type { TSticky } from "@plane/types";
// local imports
import { ColorPalette } from "./color-palette";

type Props = {
  executeCommand: (item: ToolbarMenuItem) => void;
  editorRef: EditorRefApi | null;
  handleColorChange: (data: Partial<TSticky>) => Promise<void>;
  handleDelete: () => void;
};

const toolbarItems = TOOLBAR_ITEMS.sticky;

// keep focus (and the current selection) inside the editor when a toolbar control is pressed, so
// formatting commands don't run against a lost selection
const preserveEditorFocus = (e: React.MouseEvent) => e.preventDefault();

export function StickyEditorToolbar(props: Props) {
  const { executeCommand, editorRef, handleColorChange, handleDelete } = props;

  // State to manage active states of toolbar items
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [showColorPalette, setShowColorPalette] = useState(false);
  // Function to update active states
  const updateActiveStates = useCallback(() => {
    if (!editorRef) return;
    const newActiveStates: Record<string, boolean> = {};
    Object.values(toolbarItems)
      .flat()
      .forEach((item) => {
        // TODO: update this while toolbar homogenization
        // @ts-expect-error type mismatch here
        newActiveStates[item.renderKey] = editorRef.isMenuItemActive({
          itemKey: item.itemKey,
          ...item.extraProps,
        });
      });
    setActiveStates(newActiveStates);
  }, [editorRef]);

  // useEffect to call updateActiveStates when isActive prop changes
  useEffect(() => {
    if (!editorRef) return;
    const unsubscribe = editorRef.onStateChange(updateActiveStates);
    updateActiveStates();
    return () => unsubscribe();
  }, [editorRef, updateActiveStates]);

  return (
    <TooltipProvider>
      <div className="flex h-full w-full items-center justify-between">
        <div className="-ml-2.5 flex items-center">
          <Toolbar size="sm" elevation="flat" aria-label="Formatting toolbar">
            {/* color palette */}
            <Popover open={showColorPalette} onOpenChange={setShowColorPalette}>
              <Tooltip label="Background color">
                <PopoverTrigger
                  render={
                    <ToolbarButton
                      aria-label="Background color"
                      icon={<Icon icon={PaletteOutline} />}
                      onMouseDown={preserveEditorFocus}
                    />
                  }
                />
              </Tooltip>
              <PopoverContent variant="rich" side="top" align="start">
                <ColorPalette handleUpdate={handleColorChange} />
              </PopoverContent>
            </Popover>
            {Object.keys(toolbarItems).map((key) => (
              <ToolbarGroup key={key}>
                {toolbarItems[key].map((item) => (
                  <Tooltip key={item.renderKey} label={item.name} shortcut={item.shortcut?.join(" + ")}>
                    <ToolbarToggle
                      aria-label={item.name}
                      render={<button className="data-pressed:text-icon-secondary!" />}
                      icon={<Icon icon={item.icon} />}
                      pressed={!!activeStates[item.renderKey]}
                      onMouseDown={preserveEditorFocus}
                      onPressedChange={() => executeCommand(item)}
                    />
                  </Tooltip>
                ))}
              </ToolbarGroup>
            ))}
          </Toolbar>
        </div>
        {/* delete action */}
        <div className="-mr-1.5 flex items-center">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Delete"
            icon={<Icon icon={DeleteOutline} />}
            onClick={handleDelete}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
