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

import { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Placeholder } from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
// plane imports
import { cn } from "@plane/utils";
// utils
import { applyInsertSuggestion, compOpToDisplayOp, computeAllSuggestions } from "@/utils/pql-suggestions";
// local imports
import type {
  DropdownState,
  FieldDef,
  ParseResult,
  PQLEditorHandle,
  PQLEditorProps,
  Suggestion,
  SuggestionContext,
} from "../extensions/pql-editor/types";
import { PQLEditorExtension } from "../extensions/pql-editor/extension";
import { PQLValueExtension } from "../extensions/pql-editor/value/extension";
import { PQLCustomPropertyFieldExtension } from "../extensions/pql-editor/custom-property-field/extension";

type UsePQLEditorArgs = Pick<PQLEditorProps, "onChange" | "onSubmit" | "value"> & {
  autoFocus: boolean;
  disableSubmit?: boolean;
  dropdownStateRef: React.MutableRefObject<DropdownState>;
  editable: boolean;
  editorClassName?: string;
  fieldDefs: FieldDef[];
  forwardedRef?: React.ForwardedRef<PQLEditorHandle>;
  handleDropdownClose: () => void;
  placeholder: string;
  setActiveIndex: (index: number) => void;
  setAnchor: (anchor: { top: number; left: number; bottom: number } | null) => void;
  setShowDatePicker: (show: boolean) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
};

/**
 * Returns true when the autocomplete context requires a date value so the calendar picker is shown.
 * The decision is based on the operator config type, not a field-level valueKind, so the same field
 * can show different pickers depending on which operator was used.
 */
function isDateContext(context: SuggestionContext, fieldMap: Map<string, FieldDef>): boolean {
  if (context.kind === "AFTER_BETWEEN" || context.kind === "AFTER_BETWEEN_AND") return true;
  if (context.kind === "AFTER_OPERATOR" && context.field && context.op) {
    const displayOp = compOpToDisplayOp(context.op);
    if (!displayOp) return false;
    const opConfig = fieldMap.get(context.field)?.allowedOps.get(displayOp);
    return ["date", "date_range"].includes(opConfig?.type ?? "");
  }
  return false;
}

export const usePQLEditor = ({
  autoFocus,
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
}: UsePQLEditorArgs) => {
  // Derive a Map for O(1) lookup; recomputed only when fieldDefs reference changes.
  const fieldMap = useMemo(() => new Map(fieldDefs.map((f) => [f.value, f])), [fieldDefs]);

  // Keep a ref so the stable getter passed to the Tiptap extension always reads
  // the latest value — extension options are frozen at initialization time.
  const disableSubmitRef = useRef(disableSubmit);
  disableSubmitRef.current = disableSubmit;

  // Tracks parse errors so the submit button and Enter-key handler can be
  // disabled when the query is invalid. The ref is used by the frozen getter
  // inside the extension; the state drives the button's visual disabled state.
  const parseErrorsRef = useRef(false);
  const [hasErrors, setHasErrors] = useState(false);

  // Tracks the most-recent suggestion context so value-accept handlers can
  // check whether we're inside an IN list without re-running the full context
  // derivation.
  const currentContextRef = useRef<SuggestionContext | null>(null);

  const handleParseResult = useCallback((result: ParseResult) => {
    const nextHasErrors = !result.isValid;
    parseErrorsRef.current = nextHasErrors;
    setHasErrors(nextHasErrors);
  }, []);

  const openDropdown = useCallback(
    (list: Suggestion[], newAnchor: { top: number; left: number; bottom: number } | null) => {
      if (newAnchor) setAnchor(newAnchor);
      setSuggestions(list);
      setActiveIndex(0);
      // Sync update so the keymap plugin sees correct state on the VERY NEXT keydown
      dropdownStateRef.current = { isOpen: list.length > 0, activeIndex: 0, suggestions: list };
    },
    [dropdownStateRef, setActiveIndex, setAnchor, setSuggestions]
  );

  const handleContextChange = useCallback(
    ({
      editor,
      context,
      newAnchor,
    }: {
      editor: Editor;
      context: SuggestionContext | null;
      newAnchor: { top: number; left: number; bottom: number } | null;
    }) => {
      currentContextRef.current = context;

      if (!context) {
        handleDropdownClose();
        return;
      }

      // Use the same sentinel-substituted text as the highlighter/autocomplete
      // plugins: each pqlValue chip becomes '\x01' (1 char = 1 PM position).
      // Using editor.getText() here would expand chips to their full renderText
      // (e.g. '"uuid-here" '), causing cursorChar — which is PM-position-based —
      // to index into the middle of a UUID and break the canShow / partial logic.
      const text = editor
        ? editor.state.doc.textBetween(0, editor.state.doc.content.size, "", (node) => {
            if (node.type.name === "pqlValue") return "\x01";
            if (node.type.name === "pqlCustomPropertyField") return "\x02";
            return "";
          })
        : "";
      const cursorChar = (editor?.state.selection.from ?? 1) - 1;
      const partial = getPartialToken(text, cursorChar).toLowerCase();

      // Only show autocomplete when the current partial token sits at the very
      // start of the input (initial / empty state) OR is immediately preceded
      // by whitespace, left parenthesis, or comma (e.g. after "IN (" or list items).
      const tokenStart = cursorChar - partial.length;
      const charBeforeToken = tokenStart > 0 ? text[tokenStart - 1] : null;
      const showableBefore =
        charBeforeToken !== null &&
        (/\s/.test(charBeforeToken) || ["\x01", "\x02", "(", ","].includes(charBeforeToken));
      const canShow = tokenStart === 0 || showableBefore;

      if (!canShow) {
        handleDropdownClose();
        return;
      }

      // Show/hide the date picker alongside date function suggestions
      setShowDatePicker(isDateContext(context, fieldMap));

      computeAllSuggestions(context, fieldDefs, fieldMap)
        .then((all) => {
          const filtered = partial.length > 0 ? all.filter((s) => s.label.toLowerCase().includes(partial)) : all;
          openDropdown(filtered, newAnchor);
          return;
        })
        .catch((err) => {
          console.error("[PQL] Failed to compute suggestions:", err);
        });
    },
    [fieldDefs, fieldMap, handleDropdownClose, openDropdown, setShowDatePicker]
  );

  const selectOption = useCallback(
    (ed: Editor, suggestion: Suggestion) => {
      if (!ed || ed.isDestroyed) return;
      // Capture context BEFORE insertion: the Tiptap view plugin calls
      // onContextChange synchronously inside editor.chain().run(), so
      // currentContextRef.current is overwritten to the post-insertion context
      // by the time applyInsertSuggestion returns.  We need the context the
      // user was looking at when they made the selection.
      const contextKind = currentContextRef.current?.kind;

      // Special path: value chip selected after IN / NOT IN with no '(' yet.
      // Auto-insert '(' before the chip. Functions (workspaceMembers() etc.)
      // don't need a bracket — they fall through to the normal path below.
      if (
        contextKind === "AFTER_IN_NO_BRACKET" &&
        "insertNode" in suggestion &&
        suggestion.insertNode.type === "value"
      ) {
        ed.commands.insertContent("(");
        applyInsertSuggestion(ed, suggestion);
        ed.commands.insertContent(")");
        const newPos = ed.state.selection.from - 1;
        ed.chain().focus().setTextSelection(newPos).run();
        handleDropdownClose();
        return;
      }

      // When the cursor is right after a value with no comma yet (AFTER_IN_VALUE),
      // prepend ", " before inserting the next value so the list stays well-formed.
      // AFTER_IN (cursor after '(') and AFTER_IN_COMMA (cursor after ',') already
      // have the right separator in place, so they just insert directly.
      const isCompleteInListValue =
        "insertNode" in suggestion || (suggestion.kind === "function" && !suggestion.insertCursorInsideParens);
      if (isCompleteInListValue && contextKind === "AFTER_IN_VALUE") {
        ed.chain().focus().insertContent(", ").run();
      }

      applyInsertSuggestion(ed, suggestion);
      handleDropdownClose();
    },
    [handleDropdownClose]
  );

  const handleDropdownAccept = useCallback(
    (ed: Editor) => {
      const { suggestions: list, activeIndex: idx } = dropdownStateRef.current;
      const selected = list[idx];
      if (!selected) return;
      selectOption(ed, selected);
    },
    [dropdownStateRef, selectOption]
  );

  const handleDropdownNavigate = useCallback(
    (direction: "up" | "down") => {
      const count = dropdownStateRef.current.suggestions.length;
      if (count === 0) return;
      const next =
        direction === "down"
          ? (dropdownStateRef.current.activeIndex + 1) % count
          : (dropdownStateRef.current.activeIndex - 1 + count) % count;
      // Sync update FIRST — next keydown must see the updated index
      dropdownStateRef.current.activeIndex = next;
      setActiveIndex(next);
    },
    [dropdownStateRef, setActiveIndex]
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        heading: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        hardBreak: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({ placeholder }),
      PQLEditorExtension.configure({
        fieldDefs,
        onParseResult: handleParseResult,
        onContextChange: handleContextChange,
        onSubmit,
        getIsSubmitDisabled: () => !!disableSubmitRef.current || parseErrorsRef.current,
        getDropdownState: () => dropdownStateRef.current,
        onDropdownNavigate: handleDropdownNavigate,
        onDropdownAccept: handleDropdownAccept,
        onDropdownClose: handleDropdownClose,
      }),
      PQLValueExtension,
      PQLCustomPropertyFieldExtension,
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange?.({
        json: e.getJSON(),
        text: e.getText(),
      });
    },
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: cn("pql-editor-content outline-none font-code text-14", editorClassName),
        "data-placeholder": placeholder,
        spellcheck: "false",
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain");
        if (text === undefined) return false;
        event.preventDefault();
        view.dispatch(view.state.tr.insertText(text));
        return true;
      },
    },
  });

  useImperativeHandle(forwardedRef, () => ({
    blur: () => editor?.commands.blur(),
    clearAll: (args) => {
      editor?.commands.clearContent(!!args?.triggerUpdate);
      if (args?.triggerSubmit && editor) {
        void onSubmit?.({
          json: editor.getJSON(),
          text: editor.getText(),
        });
      }
      if (args?.preserveFocus) {
        editor?.commands.focus();
      }
    },
    focus: () => editor?.commands.focus(),
    getParseResult: () => ({ ast: null, errors: [], isValid: true }), // parseResultRef.current,
    getValue: () => editor?.getText() ?? "",
    setValue: (v: string) => editor?.commands.setContent(`<p>${escapeHtml(v)}</p>`, false),
  }));

  return {
    editor,
    hasErrors,
    selectOption,
  };
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Returns the alphabetic word immediately before `cursorChar`.
 * Used to filter the suggestion list while the user types.
 */
function getPartialToken(text: string, cursorChar: number): string {
  let i = cursorChar;
  while (i > 0 && /[a-zA-Z0-9_]/.test(text[i - 1])) i--;
  return text.slice(i, cursorChar);
}
