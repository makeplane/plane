/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState, useCallback } from "react";
// plane imports
import { TOOLBAR_ITEMS } from "@plane/editor";
import type { ToolbarMenuItem, EditorRefApi } from "@plane/editor";
import { Icon } from "@makeplane/propel/components/icon";
import { ToolbarButton } from "@makeplane/propel/elements/toolbar";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";

type Props = {
  executeCommand: (item: ToolbarMenuItem) => void;
  handleSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isCommentEmpty: boolean;
  isSubmitting: boolean;
  showSubmitButton: boolean;
  editorRef: EditorRefApi | null;
};

const toolbarItems = TOOLBAR_ITEMS.lite;

export function IssueCommentToolbar(props: Props) {
  const { executeCommand, handleSubmit, isCommentEmpty, editorRef, isSubmitting, showSubmitButton } = props;
  const { t } = useTranslation();
  // states
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

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
    <div className="flex min-h-9 w-full items-stretch gap-1.5">
      <div className="flex min-w-0 flex-1 items-stretch justify-between gap-2 rounded-sm border-[0.5px] border-subtle p-1">
        <div
          role="group"
          aria-label={t("common.comment")}
          className="flex min-w-0 flex-1 scroll-px-1 items-stretch overflow-x-auto px-0.5 py-0.5"
        >
          {Object.keys(toolbarItems).map((key, index) => (
            <div
              key={key}
              className={cn("flex items-stretch gap-0.5 border-r border-subtle px-2.5", {
                "pl-0": index === 0,
              })}
            >
              {toolbarItems[key].map((item) => {
                const isItemActive = activeStates[item.renderKey];

                return (
                  <Tooltip
                    key={item.renderKey}
                    label={item.name}
                    shortcut={item.shortcut ? item.shortcut.join(" + ") : undefined}
                  >
                    <ToolbarButton
                      type="button"
                      size="sm"
                      labeled={false}
                      aria-label={item.name}
                      aria-pressed={key === "complex" ? undefined : !!isItemActive}
                      data-pressed={isItemActive ? "" : undefined}
                      onClick={() => executeCommand(item)}
                    >
                      <Icon icon={<item.icon strokeWidth={2.5} />} />
                    </ToolbarButton>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        {showSubmitButton && (
          <div className="my-auto shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              stretch="auto"
              label="Comment"
              onClick={handleSubmit}
              disabled={isCommentEmpty}
              loading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
