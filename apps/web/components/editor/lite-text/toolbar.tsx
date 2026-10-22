/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState, useCallback } from "react";
import type { IconGlyph } from "@makeplane/propel/components/icon";

import { EIssueCommentAccessSpecifier } from "@plane/constants";
// editor
import type { EditorRefApi } from "@plane/editor";
// i18n
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { ToolbarButton } from "@makeplane/propel/elements/toolbar";
import { GlobeOutline, LockOutline } from "@makeplane/propel/icons";
import type { ISvgIcons } from "@plane/blocks/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
// constants
import { cn } from "@plane/utils";
import type { ToolbarMenuItem } from "@plane/editor";
import { TOOLBAR_ITEMS } from "@plane/editor";
// helpers

type Props = {
  accessSpecifier?: EIssueCommentAccessSpecifier;
  executeCommand: (item: ToolbarMenuItem) => void;
  handleAccessChange?: (accessKey: EIssueCommentAccessSpecifier) => void;
  handleSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isCommentEmpty: boolean;
  isSubmitting: boolean;
  showAccessSpecifier: boolean;
  showSubmitButton: boolean;
  editorRef: EditorRefApi | null;
  submitButtonText?: string;
};

type TCommentAccessType = {
  icon: IconGlyph | React.FC<ISvgIcons>;
  key: EIssueCommentAccessSpecifier;
  label: "Private" | "Public";
};

const COMMENT_ACCESS_SPECIFIERS: TCommentAccessType[] = [
  {
    icon: LockOutline,
    key: EIssueCommentAccessSpecifier.INTERNAL,
    label: "Private",
  },
  {
    icon: GlobeOutline,
    key: EIssueCommentAccessSpecifier.EXTERNAL,
    label: "Public",
  },
];

const toolbarItems = TOOLBAR_ITEMS.lite;

export function IssueCommentToolbar(props: Props) {
  const { t } = useTranslation();
  const {
    accessSpecifier,
    executeCommand,
    handleAccessChange,
    handleSubmit,
    isCommentEmpty,
    isSubmitting,
    showAccessSpecifier,
    showSubmitButton,
    editorRef,
    submitButtonText = "common.comment",
  } = props;
  // State to manage active states of toolbar items
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

  const isEditorReadyToDiscard = editorRef?.isEditorReadyToDiscard();
  const isSubmitButtonDisabled = isCommentEmpty || !isEditorReadyToDiscard;

  return (
    <div className="flex min-h-9 w-full items-stretch gap-1.5 bg-surface-2">
      {showAccessSpecifier && (
        <div className="flex flex-shrink-0 items-center gap-0.5 rounded-sm border-[0.5px] border-subtle p-1">
          {COMMENT_ACCESS_SPECIFIERS.map((access) => {
            const isAccessActive = accessSpecifier === access.key;

            return (
              <Tooltip key={access.key} label={access.label} layout="stacked">
                <ToolbarButton
                  type="button"
                  size="sm"
                  labeled={false}
                  aria-label={access.label}
                  aria-pressed={isAccessActive}
                  data-pressed={isAccessActive ? "" : undefined}
                  onClick={() => handleAccessChange?.(access.key)}
                >
                  <Icon icon={<access.icon strokeWidth={2} />} />
                </ToolbarButton>
              </Tooltip>
            );
          })}
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-stretch justify-between gap-2 rounded-sm border-[0.5px] border-subtle p-1">
        <div
          className="flex min-w-0 flex-1 scroll-px-1 items-stretch overflow-x-auto px-0.5 py-0.5"
          onFocusCapture={(event) => {
            if (event.currentTarget.contains(event.target)) {
              event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
            }
          }}
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
                  <Tooltip key={item.renderKey} label={item.name} shortcut={item.shortcut?.join(" + ")}>
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
              type="submit"
              variant="primary"
              size="sm"
              stretch="auto"
              label={t(submitButtonText)}
              onClick={handleSubmit}
              disabled={isSubmitButtonDisabled}
              loading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
