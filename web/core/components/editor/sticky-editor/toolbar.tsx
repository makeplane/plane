"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Palette, Trash2 } from "lucide-react";
// editor
import { EditorRefApi } from "@plane/editor";
// ui
import { useOutsideClickDetector } from "@plane/hooks";
import { TSticky } from "@plane/types";
import { Tooltip } from "@plane/ui";
// constants
import { TOOLBAR_ITEMS, ToolbarMenuItem } from "@/constants/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { ColorPalette } from "./color-palette";

type Props = {
  executeCommand: (item: ToolbarMenuItem) => void;
  editorRef: EditorRefApi | null;
  handleColorChange: (data: Partial<TSticky>) => Promise<void>;
  handleDelete: () => void;
};

const toolbarItems = TOOLBAR_ITEMS.sticky;

export const StickyEditorToolbar: React.FC<Props> = (props) => {
  const { executeCommand, editorRef, handleColorChange, handleDelete } = props;

  // State to manage active states of toolbar items
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [showColorPalette, setShowColorPalette] = useState(false);
  const colorPaletteRef = React.useRef<HTMLDivElement>(null);
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

  useOutsideClickDetector(colorPaletteRef, () => setShowColorPalette(false));

  return (
    <div className="flex w-full justify-between h-full">
      <div className="flex my-auto gap-4" ref={colorPaletteRef}>
        {/* color palette */}
        {showColorPalette && <ColorPalette handleUpdate={handleColorChange} />}
        <Tooltip
          tooltipContent={
            <p className="flex flex-col gap-1 text-center text-xs">
              <span className="font-medium">Background color</span>
            </p>
          }
        >
          <button
            type="button"
            onClick={() => setShowColorPalette(!showColorPalette)}
            className="flex text-custom-text-100/50"
          >
            <Palette className="size-4 my-auto" />
          </button>
        </Tooltip>

        <div className="flex w-fit items-stretch justify-between gap-4 rounded p-1 my-auto">
          <div className="flex items-stretch my-auto gap-4">
            {Object.keys(toolbarItems).map((key) => (
              <div key={key} className={cn("flex items-stretch gap-4", {})}>
                {toolbarItems[key].map((item) => {
                  const isItemActive = activeStates[item.renderKey];

                  return (
                    <Tooltip
                      key={item.renderKey}
                      tooltipContent={
                        <p className="flex flex-col gap-1 text-center text-xs">
                          <span className="font-medium">{item.name}</span>
                          {item.shortcut && <kbd className="text-custom-text-400">{item.shortcut.join(" + ")}</kbd>}
                        </p>
                      }
                    >
                      <button
                        type="button"
                        onClick={() => executeCommand(item)}
                        className={cn(
                          "grid place-items-center aspect-square rounded-sm p-0.5 text-custom-text-100/50",
                          {}
                        )}
                      >
                        <item.icon
                          className={cn("h-3.5 w-3.5", {
                            "font-extrabold": isItemActive,
                          })}
                          strokeWidth={2.5}
                        />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* delete action */}
      <Tooltip
        tooltipContent={
          <p className="flex flex-col gap-1 text-center text-xs">
            <span className="font-medium">Delete</span>
          </p>
        }
      >
        <button type="button" onClick={handleDelete} className="my-auto text-custom-text-100/50">
          <Trash2 className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
};
