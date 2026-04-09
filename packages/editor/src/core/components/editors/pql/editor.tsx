/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { forwardRef, useCallback, useRef, useState } from "react";
import { EditorContent } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// types
import type { PQLEditorHandle, PQLEditorProps, Suggestion, DropdownState } from "@/extensions/pql-editor/types";
// hooks
import { usePQLEditor } from "@/hooks/use-pql-editor";
// local imports
import { PQLAutocompleteDropdown } from "./autocomplete-dropdown";
import { PQLErrorTooltip } from "./error-tooltip";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { ResizeGripIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { CornerDownLeft } from "lucide-react";

function PQLEditor(
  props: PQLEditorProps & {
    forwardedRef?: React.ForwardedRef<PQLEditorHandle>;
  }
) {
  const {
    autoFocus,
    className,
    disableSubmit,
    editable,
    editorClassName,
    fieldDefs,
    forwardedRef,
    isSubmitting = false,
    onChange,
    onSubmit,
    placeholder = "",
    value,
  } = props;
  // states
  const [isMaximized, setIsMaximized] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    bottom: number;
  } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // refs
  const dropdownStateRef = useRef<DropdownState>({
    isOpen: false,
    activeIndex: 0,
    suggestions: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDropdownClose = useCallback(() => {
    setSuggestions([]);
    setAnchor(null);
    setShowDatePicker(false);
    dropdownStateRef.current = {
      isOpen: false,
      activeIndex: 0,
      suggestions: [],
    };
  }, []);

  const { editor, hasErrors, selectOption } = usePQLEditor({
    autoFocus: !!autoFocus,
    disableSubmit,
    dropdownStateRef,
    editable,
    editorClassName,
    fieldDefs,
    forwardedRef,
    handleDropdownClose,
    onChange,
    onSubmit,
    placeholder,
    setActiveIndex,
    setAnchor,
    setShowDatePicker,
    setSuggestions,
    value,
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "pql-editor-wrapper relative bg-layer-2 transition-[min-height] duration-300 ease-in-out min-h-8",
        {
          "min-h-37.5": isMaximized,
        },
        className
      )}
    >
      <div ref={containerRef} className="size-full flex justify-between gap-3">
        <EditorContent
          editor={editor}
          className="size-full font-code text-13 [&_.pql-editor-content]:wrap-break-word"
        />

        <div className="shrink-0 flex">
          <Tooltip
            tooltipContent={
              <span className="flex items-center gap-1">
                Enter
                <CornerDownLeft className="size-3" />
              </span>
            }
          >
            <Button
              variant="secondary"
              size="base"
              onClick={() =>
                void onSubmit?.({
                  json: editor.getJSON(),
                  text: editor.getText(),
                })
              }
              className="shrink-0 transition-colors duration-200"
              loading={isSubmitting}
              disabled={disableSubmit || hasErrors}
            >
              Run
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Resize grip — bottom-right corner, native textarea style */}
      <IconButton
        variant="ghost"
        size="sm"
        icon={ResizeGripIcon}
        onClick={() => setIsMaximized((prev) => !prev)}
        className="absolute bottom-0 right-0 cursor-nwse-resize opacity-40 hover:opacity-70 transition-opacity !size-3 !p-0"
        iconClassName="size-2.5"
        aria-label={isMaximized ? "Collapse editor" : "Expand editor"}
      />

      <PQLAutocompleteDropdown
        editor={editor}
        suggestions={suggestions}
        activeIndex={activeIndex}
        anchor={anchor}
        onSelect={(s) => selectOption(editor, s)}
        onClose={handleDropdownClose}
        showDatePicker={showDatePicker}
      />

      <PQLErrorTooltip containerRef={containerRef} />
    </div>
  );
}

// ─── forwardRef wrapper ───────────────────────────────────────────────────────

export const PQLEditorWithRef = forwardRef(function PQLEditorWithRef(
  props: PQLEditorProps,
  ref: React.ForwardedRef<PQLEditorHandle>
) {
  return <PQLEditor {...props} forwardedRef={ref} />;
});

PQLEditorWithRef.displayName = "PQLEditorWithRef";

export type { PQLEditorProps, PQLEditorHandle };
