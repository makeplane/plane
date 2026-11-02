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
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarToggle,
} from "@makeplane/propel/components/toolbar";
import { GlobeOutline, LockOutline } from "@makeplane/propel/icons";
import type { ISvgIcons } from "@plane/blocks/icons";
import { Tooltip, TooltipProvider } from "@makeplane/propel/components/tooltip";
// constants
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

// keep focus (and the current selection) inside the editor when a toolbar control is pressed, so
// formatting commands don't run against a lost selection
const preserveEditorFocus = (e: React.MouseEvent) => e.preventDefault();

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
    <TooltipProvider>
      <div className="flex w-full items-center justify-between gap-2">
        <div
          className="horizontal-scrollbar scrollbar-sm min-w-0 overflow-x-auto"
          onFocusCapture={(event) => {
            if (event.currentTarget.contains(event.target)) {
              event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
            }
          }}
        >
          <Toolbar size="sm" elevation="flat" aria-label={t("formatting_toolbar.label")}>
            {showAccessSpecifier && (
              <>
                <ToolbarGroup>
                  {COMMENT_ACCESS_SPECIFIERS.map((access) => (
                    <Tooltip key={access.key} label={access.label}>
                      <ToolbarToggle
                        aria-label={access.label}
                        render={<button className="data-pressed:text-icon-secondary!" />}
                        icon={<Icon icon={<access.icon />} />}
                        pressed={accessSpecifier === access.key}
                        onMouseDown={preserveEditorFocus}
                        onPressedChange={() => handleAccessChange?.(access.key)}
                      />
                    </Tooltip>
                  ))}
                </ToolbarGroup>
                <ToolbarSeparator />
              </>
            )}
            {Object.keys(toolbarItems).map((key, index) => (
              <React.Fragment key={key}>
                {index > 0 && <ToolbarSeparator />}
                <ToolbarGroup>
                  {toolbarItems[key].map((item) => (
                    <Tooltip key={item.renderKey} label={item.name} shortcut={item.shortcut?.join(" + ")}>
                      {key === "complex" ? (
                        <ToolbarButton
                          aria-label={item.name}
                          icon={<Icon icon={item.icon} />}
                          onMouseDown={preserveEditorFocus}
                          onClick={() => executeCommand(item)}
                        />
                      ) : (
                        <ToolbarToggle
                          aria-label={item.name}
                          render={<button className="data-pressed:text-icon-secondary!" />}
                          icon={<Icon icon={item.icon} />}
                          pressed={!!activeStates[item.renderKey]}
                          onMouseDown={preserveEditorFocus}
                          onPressedChange={() => executeCommand(item)}
                        />
                      )}
                    </Tooltip>
                  ))}
                </ToolbarGroup>
              </React.Fragment>
            ))}
          </Toolbar>
        </div>
        {showSubmitButton && (
          <Button
            type="submit"
            variant="primary"
            size="sm"
            stretch="auto"
            label={t(submitButtonText)}
            onMouseDown={preserveEditorFocus}
            onClick={handleSubmit}
            disabled={isSubmitButtonDisabled}
            loading={isSubmitting}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
