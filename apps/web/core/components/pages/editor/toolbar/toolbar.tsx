import React, { useEffect, useState, useCallback } from "react";
import type { EditorRefApi } from "@plane/editor";
// plane imports
import { CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// constants
import type { ToolbarMenuItem } from "@/constants/editor";
import { TOOLBAR_ITEMS, TYPOGRAPHY_ITEMS } from "@/constants/editor";
// local imports
import { ColorDropdown } from "./color-dropdown";

type Props = {
  editorRef: EditorRefApi;
};

type ToolbarButtonProps = {
  item: ToolbarMenuItem;
  isActive: boolean;
  executeCommand: EditorRefApi["executeMenuItemCommand"];
};

const ToolbarButton = React.memo(function ToolbarButton(props: ToolbarButtonProps) {
  const { item, isActive, executeCommand } = props;

  return (
    <Tooltip
      tooltipContent={
        <p className="flex flex-col gap-1 text-center text-11">
          <span className="font-medium">{item.name}</span>
          {item.shortcut && <kbd className="text-placeholder">{item.shortcut.join(" + ")}</kbd>}
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
        className={cn("shrink-0 grid size-7 place-items-center rounded-sm text-tertiary", {
          "bg-layer-transparent-selected hover:bg-layer-transparent-selected text-primary": isActive,
          "hover:bg-layer-transparent-hover": !isActive,
        })}
      >
        <item.icon
          className={cn("size-4 transition-transform duration-200", {
            "text-primary": isActive,
          })}
        />
      </button>
    </Tooltip>
  );
});

ToolbarButton.displayName = "ToolbarButton";

const toolbarItems = TOOLBAR_ITEMS.document;

export function PageToolbar(props: Props) {
  const { editorRef } = props;
  // states
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(() => {
    const initialStates: Record<string, boolean> = {};
    Object.values(toolbarItems)
      .flat()
      .forEach((item) => {
        // TODO: update this while toolbar homogenization
        // @ts-expect-error type mismatch here
        initialStates[item.renderKey] = editorRef.isMenuItemActive({
          itemKey: item.itemKey,
          ...item.extraProps,
        });
      });
    return initialStates;
  });

  const [isTypographyMenuOpen, setIsTypographyMenuOpen] = useState(false);

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
    return () => unsubscribe();
  }, [editorRef, updateActiveStates]);

  const activeTypography = TYPOGRAPHY_ITEMS.find((item) =>
    editorRef.isMenuItemActive({
      itemKey: item.itemKey,
      ...item.extraProps,
    })
  );

  return (
    <div className="flex items-center divide-x divide-subtle-1 overflow-x-scroll animate-in fade-in duration-200">
      <CustomMenu
        customButton={
          <span
            className={cn(
              "text-13 border-[0.5px] border-strong h-7 w-24 rounded-sm px-2 flex items-center justify-between gap-2 whitespace-nowrap text-left",
              {
                "bg-layer-1-selected text-primary": isTypographyMenuOpen,
                "text-tertiary hover:bg-layer-1-hover": !isTypographyMenuOpen,
              }
            )}
          >
            {activeTypography?.name || "Text"}
            <ChevronDownIcon className="shrink-0 size-3" />
          </span>
        }
        className="pr-2"
        placement="bottom-start"
        closeOnSelect
        maxHeight="lg"
        menuButtonOnClick={() => setIsTypographyMenuOpen((prev) => !prev)}
        onMenuClose={() => setIsTypographyMenuOpen(false)}
      >
        {TYPOGRAPHY_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.renderKey}
            className={cn("flex items-center justify-between gap-2", {
              "bg-layer-transparent-selected text-primary": activeTypography?.itemKey === item.itemKey,
              "hover:bg-layer-transparent-hover": !(activeTypography?.itemKey === item.itemKey),
            })}
            onClick={() => {
              if (activeTypography?.itemKey !== item.itemKey) {
                editorRef.executeMenuItemCommand({
                  itemKey: item.itemKey,
                  ...item.extraProps,
                });
              }
            }}
          >
            <span className="flex items-center gap-2">
              <item.icon className="size-3" />
              {item.name}
            </span>
            {activeTypography?.itemKey === item.itemKey && <CheckIcon className="size-3 text-tertiary shrink-0" />}
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
      <div className="shrink-0">
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
      {Object.keys(toolbarItems).map((key) => (
        <div key={key} className="flex items-center gap-0.5 px-2 first:pl-0 last:pr-0">
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
  );
}
