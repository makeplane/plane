/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/react";
import { DeactivatedOutline, TextOutline } from "@makeplane/propel/icons";
import { useMemo } from "react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/elements/icon-button";
import { PopoverPopup } from "@makeplane/propel/elements/popover";
import { ToolbarMenuTriggerButton, ToolbarMenuTriggerLabel } from "@makeplane/propel/elements/toolbar";
// plane utils
import { cn } from "@plane/utils";
// constants
import { COLORS_LIST } from "@/constants/common";
// local imports
import { FloatingMenuRoot } from "../floating-menu/root";
import { useFloatingMenu } from "../floating-menu/use-floating-menu";
import { BackgroundColorItem, TextColorItem } from "../menu-items";
import type { EditorStateType } from "./root";

type Props = {
  editor: Editor;
  editorState: EditorStateType;
};

export function BubbleMenuColorSelector(props: Props) {
  const { editor, editorState } = props;
  // floating ui
  const { options, getReferenceProps, getFloatingProps } = useFloatingMenu({});

  const activeTextColor = useMemo(() => editorState.color, [editorState.color]);
  const activeBackgroundColor = useMemo(() => editorState.backgroundColor, [editorState.backgroundColor]);

  return (
    <FloatingMenuRoot
      classNames={{
        buttonContainer: "h-full",
      }}
      renderButton={(buttonProps) => (
        <ToolbarMenuTriggerButton {...buttonProps} size="sm" data-popup-open={options.context.open ? "" : undefined} />
      )}
      menuButton={
        <>
          <ToolbarMenuTriggerLabel>Color</ToolbarMenuTriggerLabel>
          <span
            className={cn("grid size-6 flex-shrink-0 place-items-center rounded-sm border-[0.5px] border-strong", {
              "bg-surface-1": !activeBackgroundColor,
            })}
            style={{
              backgroundColor: activeBackgroundColor ? activeBackgroundColor.backgroundColor : "transparent",
            }}
          >
            <TextOutline
              className={cn("size-3.5", {
                "text-primary": !activeTextColor,
              })}
              style={{
                color: activeTextColor ? activeTextColor.textColor : "inherit",
              }}
            />
          </span>
        </>
      }
      options={options}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
    >
      <PopoverPopup variant="rich" render={<section className="mt-1" />}>
        <div className="space-y-1.5">
          <p className="text-body-xs-medium text-secondary">Text colors</p>
          <div role="group" aria-label="Text colors" className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                aria-label={`${color.label} text color`}
                aria-pressed={activeTextColor?.key === color.key}
                className={cn(
                  "size-6 shrink-0 cursor-pointer rounded-sm border-xs border-subtle transition-opacity outline-none hover:opacity-60 focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-1",
                  activeTextColor?.key === color.key && "ring-2 ring-accent-strong ring-offset-1"
                )}
                style={{
                  backgroundColor: color.textColor,
                }}
                onClick={() => TextColorItem(editor).command({ color: color.key })}
              />
            ))}
            <IconButton
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Clear text color"
              onClick={() => TextColorItem(editor).command({ color: undefined })}
            >
              <Icon icon={DeactivatedOutline} />
            </IconButton>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-body-xs-medium text-secondary">Background colors</p>
          <div role="group" aria-label="Background colors" className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                aria-label={`${color.label} background color`}
                aria-pressed={activeBackgroundColor?.key === color.key}
                className={cn(
                  "size-6 shrink-0 cursor-pointer rounded-sm border-xs border-subtle transition-opacity outline-none hover:opacity-60 focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-1",
                  activeBackgroundColor?.key === color.key && "ring-2 ring-accent-strong ring-offset-1"
                )}
                style={{
                  backgroundColor: color.backgroundColor,
                }}
                onClick={() => BackgroundColorItem(editor).command({ color: color.key })}
              />
            ))}
            <IconButton
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Clear background color"
              onClick={() => BackgroundColorItem(editor).command({ color: undefined })}
            >
              <Icon icon={DeactivatedOutline} />
            </IconButton>
          </div>
        </div>
      </PopoverPopup>
    </FloatingMenuRoot>
  );
}
