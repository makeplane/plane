"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Check, ChevronDown } from "lucide-react";
// editor
import { EditorRefApi } from "@plane/editor";
// ui
import { CustomMenu, Tooltip } from "@plane/ui";
// components
import { ColorDropdown } from "@/components/pages";
// constants
import { TOOLBAR_ITEMS, TYPOGRAPHY_ITEMS, ToolbarMenuItem } from "@/constants/editor";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  editorRef: EditorRefApi;
};

type ToolbarButtonProps = {
  item: ToolbarMenuItem;
  isActive: boolean;
  executeCommand: EditorRefApi["executeMenuItemCommand"];
};

const ToolbarButton: React.FC<ToolbarButtonProps> = React.memo((props) => {
  const { item, isActive, executeCommand } = props;

  return (
    <Tooltip
      tooltipContent={
        <p className="flex flex-col gap-1 text-center text-xs">
          <span className="font-medium">{item.name}</span>
          {item.shortcut && <kbd className="text-custom-text-400">{item.shortcut.join(" + ")}</kbd>}
        </p>
      }
    >
      <button
        type="button"
        onClick={() =>
          // TODO: update this while toolbar homogenization
          // @ts-expect-error type mismatch here
          executeCommand({
            itemKey: item.itemKey,
            ...item.extraProps,
          })
        }
        className={cn(
          "grid size-7 place-items-center rounded text-custom-text-300 hover:bg-custom-background-80 transition-all duration-200 ease-in-out",
          {
            "bg-custom-background-80 text-custom-text-100": isActive,
          }
        )}
      >
        <item.icon
          className={cn("size-4 transition-transform duration-200", {
            "text-custom-text-100": isActive,
          })}
        />
      </button>
    </Tooltip>
  );
});

ToolbarButton.displayName = "ToolbarButton";

const toolbarItems = TOOLBAR_ITEMS.document;

export const PageToolbar: React.FC<Props> = ({ editorRef }) => {
  // states
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  const updateActiveStates = useCallback(() => {
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

  useEffect(() => {
    const unsubscribe = editorRef.onStateChange(updateActiveStates);
    updateActiveStates();
    return () => unsubscribe();
  }, [editorRef, updateActiveStates]);

  const activeTypography = TYPOGRAPHY_ITEMS.find((item) =>
    editorRef.isMenuItemActive({
      itemKey: item.itemKey,
      ...item.extraProps,
    })
  );

  return (
    <div className="flex flex-1 items-center overflow-x-auto overflow-y-hidden scrollbar-hide max-w-full">
      <div className="flex items-center divide-x divide-custom-border-200 flex-nowrap min-w-0 w-full">
        <CustomMenu
          customButton={
            <span className="text-custom-text-300 text-sm border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 h-7 min-w-[6rem] max-w-[6rem] rounded px-2 flex items-center justify-between gap-2 whitespace-nowrap text-left transition-colors duration-200">
              <span className="truncate">{activeTypography?.name || "Text"}</span>
              <ChevronDown className="flex-shrink-0 size-3 transition-transform duration-200" />
            </span>
          }
          className="pr-2 flex-shrink-0"
          placement="bottom-start"
          closeOnSelect
          maxHeight="lg"
        >
          {TYPOGRAPHY_ITEMS.map((item) => (
            <CustomMenu.MenuItem
              key={item.renderKey}
              className="flex items-center justify-between gap-2 transition-colors duration-200"
              onClick={() =>
                editorRef.executeMenuItemCommand({
                  itemKey: item.itemKey,
                  ...item.extraProps,
                })
              }
            >
              <span className="flex items-center gap-2">
                <item.icon className="size-3" />
                {item.name}
              </span>
              {activeTypography?.itemKey === item.itemKey && (
                <Check className="size-3 text-custom-text-300 flex-shrink-0" />
              )}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
        <div className="flex-shrink-0">
          <ColorDropdown
            handleColorSelect={(key, color) =>
              editorRef.executeMenuItemCommand({
                itemKey: key,
                color,
              })
            }
            isColorActive={(key, color) =>
              editorRef.isMenuItemActive({
                itemKey: key,
                color,
              })
            }
          />
        </div>
        <div className="flex items-center overflow-x-auto overflow-y-hidden scrollbar-hide flex-1 min-w-0">
          {Object.keys(toolbarItems).map((key, index) => (
            <div
              key={key}
              className={cn("flex items-center gap-0.5 px-2 first:pl-0 last:pr-0 flex-shrink-0", {
                "hidden sm:flex": index > 1 && index < Object.keys(toolbarItems).length - 1,
                "hidden xs:flex": index === Object.keys(toolbarItems).length - 1,
              })}
            >
              {toolbarItems[key].map((item) => (
                <ToolbarButton
                  key={item.renderKey}
                  item={item}
                  isActive={activeStates[item.renderKey]}
                  executeCommand={editorRef.executeMenuItemCommand}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
