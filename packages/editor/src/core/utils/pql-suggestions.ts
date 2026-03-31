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

import type { Editor } from "@tiptap/react";
import { Ampersand, CircleIcon, Diamond, Ellipsis, SquareFunction } from "lucide-react";
// plane imports
import type { IFilterOption, IFilterOptionGroup, TAllAvailableOperatorsForDisplay, TFilterValue } from "@plane/types";
// local imports
import type { AppendCharacter, CompOp, FieldDef, Suggestion, SuggestionContext } from "../extensions/pql-editor/types";
import { FUNCTION_DEFS } from "../extensions/pql-editor/plugins/grammar";
import { isCustomPropertyField } from "../extensions/pql-editor/custom-property-field/utils";

// ─── Operator key mapping ──────────────────────────────────────────────────────

/**
 * Maps a PQL comparison operator symbol to its TAllAvailableOperatorsForDisplay key.
 * Used to look up the operator config from a field's allowedOps map.
 */
export function compOpToDisplayOp(op: CompOp | undefined): TAllAvailableOperatorsForDisplay | undefined {
  switch (op) {
    case "=":
      return "exact";
    case "!=":
      return "-exact";
    case ">":
      return "gt";
    case ">=":
      return "gte";
    case "<":
      return "lt";
    case "<=":
      return "lte";
    case "~":
      return "icontains";
    default:
      return undefined;
  }
}

// ─── Operator label / insert-text tables ──────────────────────────────────────

/**
 * Human-readable labels shown in the operator autocomplete dropdown.
 * Values reflect what the user sees — NOT the internal operator key.
 */
const OP_LABELS: Partial<Record<TAllAvailableOperatorsForDisplay, string>> = {
  exact: "=",
  "-exact": "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  icontains: "~",
  in: "IN",
  "-in": "NOT IN",
  isnull: "IS NULL",
  "-isnull": "IS NOT NULL",
  range: "BETWEEN",
};

/**
 * Raw PQL text inserted into the editor when an operator suggestion is accepted.
 * Trailing whitespace and structural delimiters (e.g. `(`) are intentionally
 * absent — each suggestion declares its own `appendCharacter` instead.
 * Only operators present here are shown in the dropdown.
 */
const OP_INSERT_TEXTS: Partial<Record<TAllAvailableOperatorsForDisplay, string>> = {
  exact: "=",
  "-exact": "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  icontains: "~",
  in: "IN",
  "-in": "NOT IN",
  isnull: "IS NULL",
  "-isnull": "IS NOT NULL",
  range: "BETWEEN",
};

/**
 * Maps each operator to the character appended after its insert text.
 * IN / NOT IN open a value list so they append a bracket; everything else
 * appends whitespace (except text-type operators which are handled separately
 * via cursorShift and therefore append nothing).
 */
const OP_APPEND_CHARS: Partial<Record<TAllAvailableOperatorsForDisplay, AppendCharacter>> = {
  in: "brackets",
  "-in": "brackets",
};

// ─── Static suggestion builders ───────────────────────────────────────────────

function buildFieldSuggestions(fieldDefs: FieldDef[]): Suggestion[] {
  const suggestions: Suggestion[] = fieldDefs.map((f, i) => {
    const isCustomProperty = isCustomPropertyField(f.value);

    return {
      kind: "field",
      label: f.name,
      icon: f.icon,
      detail: f.description,
      ...(isCustomProperty
        ? { insertNode: { type: "customPropertyField", field: f } }
        : { insertText: f.value, appendCharacter: "whitespace" }),
      sortOrder: i,
    };
  });
  return suggestions;
}

function buildFunctionSuggestions(kinds?: string[]): Suggestion[] {
  return FUNCTION_DEFS.filter((f) => !kinds || kinds.includes(f.kind)).map((f, i) => ({
    kind: "function",
    label: f.name,
    icon: SquareFunction,
    i18n_description: f.i18n_description,
    // No trailing character is appended for any function arity.  0-arity
    // functions (e.g. workspaceMembers()) receive ", " from selectOption when
    // inside an IN list; n-arity functions (e.g. membersOf() leave the cursor
    // inside the parens.
    insertText: f.minArity === 0 ? `${f.name}()` : `${f.name}(`,
    appendCharacter: "none",
    sortOrder: i,
  }));
}

/**
 * Builds operator suggestions for a given field.
 * Only operators that have a valid PQL insert text are included — operators
 * like `-gt` that have no PQL syntax equivalent are filtered out.
 *
 * For text-typed operators the insert text is automatically wrapped with
 * double-quotes (`= ""`) and `cursorShift: 1` is set so the cursor lands
 * between the quotes, ready for the user to type the value.
 */
function buildOperatorSuggestions(field: string, fieldMap: Map<string, FieldDef>): Suggestion[] {
  const def = fieldMap.get(field);
  if (!def) return [];

  const ops: Suggestion[] = [];
  let i = 0;
  for (const [operator] of def.allowedOps.entries()) {
    const insertText = OP_INSERT_TEXTS[operator];
    if (!insertText) continue; // no PQL representation for this operator

    // For text-type operators auto-insert an empty string literal so the cursor
    // lands between the quotes (e.g. `~ ""` → cursor before closing `"`).
    const opConfig = def.allowedOps.get(operator);
    const isTextOp = opConfig?.type === "text";
    const oneLevelCursorShift = isTextOp || ["in", "-in"].includes(operator);
    const cursorShift: number | undefined = oneLevelCursorShift ? 1 : undefined;

    // Text-type operators and IN / NOT IN use cursorShift to land the cursor inside quotes or brackets, so
    // no extra character is appended. Everything else appends whitespace.
    const appendCharacter: AppendCharacter = isTextOp ? "double-quotes" : (OP_APPEND_CHARS[operator] ?? "whitespace");

    ops.push({
      kind: "operator",
      label: OP_LABELS[operator] ?? operator,
      icon: Diamond,
      insertText,
      cursorShift,
      appendCharacter,
      sortOrder: i++,
    });
  }
  return ops;
}

function buildLogicalSuggestions(): Suggestion[] {
  return [
    {
      kind: "keyword",
      label: "AND",
      icon: Ampersand,
      i18n_description: "Both conditions must be true",
      insertText: "AND",
      appendCharacter: "whitespace",
      sortOrder: 0,
    },
    {
      kind: "keyword",
      label: "OR",
      icon: Ellipsis,
      i18n_description: "Either condition can be true",
      insertText: "OR",
      appendCharacter: "whitespace",
      sortOrder: 1,
    },
  ];
}

// ─── Field-specific function suggestion builder ───────────────────────────────

/**
 * Returns function suggestions relevant to a given field.
 * Used after any value-accepting operator (IN, NOT IN, =, !=, >, etc.)
 * so that field-aware shorthand functions are always available.
 */
function buildFieldFunctionSuggestions(field: string): Suggestion[] {
  if (field === "cycle") return buildFunctionSuggestions(["CYCLE"]);
  if (field === "stateGroup") return buildFunctionSuggestions(["STATE"]);
  if (["assignee", "createdBy", "mention", "subscriber"].includes(field)) return buildFunctionSuggestions(["USER"]);
  return [];
}

// ─── Operator-config–based value suggestion builder ───────────────────────────

/**
 * Resolves value suggestions by calling `getOptions` on the operator config.
 * Only applicable when the operator's config type is `single_select` or `multi_select`.
 */
async function resolveOptionsFromConfig(
  field: string,
  operatorKey: TAllAvailableOperatorsForDisplay,
  fieldMap: Map<string, FieldDef>
): Promise<Suggestion[]> {
  const fieldDef = fieldMap.get(field);
  if (!fieldDef) return [];

  const opConfig = fieldDef.allowedOps.get(operatorKey);
  if (!opConfig || (opConfig.type !== "single_select" && opConfig.type !== "multi_select")) return [];

  try {
    const raw = typeof opConfig.getOptions === "function" ? await opConfig.getOptions() : opConfig.getOptions;
    // flatten grouped options into a flat list
    const isGrouped = (
      arr: IFilterOption<TFilterValue>[] | IFilterOptionGroup<TFilterValue>[]
    ): arr is IFilterOptionGroup<TFilterValue>[] => arr.length > 0 && "options" in arr[0];
    const options = isGrouped(raw) ? raw.flatMap((g) => g.options) : raw;
    return options.map((opt, i) => ({
      kind: "value" as const,
      ...(opt.icon ? { iconNode: opt.icon } : { icon: CircleIcon }),
      label: opt.label,
      insertNode: {
        type: "value",
        option: opt,
      },
      sortOrder: i,
    }));
  } catch {
    return [];
  }
}

// ─── Full suggestion list for a context ──────────────────────────────────────

export async function computeAllSuggestions(
  context: SuggestionContext,
  fieldDefs: FieldDef[],
  fieldMap: Map<string, FieldDef>
): Promise<Suggestion[]> {
  const fieldFns = buildFieldFunctionSuggestions(context.field ?? "");

  switch (context.kind) {
    case "START":
      return [...buildFieldSuggestions(fieldDefs), ...buildFunctionSuggestions(["PREDICATE", "RELATION", "HISTORY"])];

    case "AFTER_FIELD":
      return buildOperatorSuggestions(context.field ?? "", fieldMap);

    case "AFTER_OPERATOR": {
      const field = context.field ?? "";
      const displayOp = compOpToDisplayOp(context.op);
      const fieldDef = fieldMap.get(field);
      const opConfig = displayOp ? fieldDef?.allowedOps.get(displayOp) : undefined;
      const opType = opConfig?.type;

      if (opType === "single_select" || opType === "multi_select") {
        const options = await resolveOptionsFromConfig(field, displayOp!, fieldMap);
        return [...options, ...fieldFns];
      }

      if (opType === "date" || opType === "date_range") {
        // Date picker is shown by isDateContext in use-pql-editor; also offer date functions
        return buildFunctionSuggestions(["DATE"]);
      }

      // number, text, boolean, with_value, number_range: no autocomplete value suggestions
      return fieldFns;
    }

    case "AFTER_IN":
    case "AFTER_IN_NO_BRACKET":
    case "AFTER_IN_VALUE":
    case "AFTER_IN_COMMA": {
      const field = context.field ?? "";
      const options = await resolveOptionsFromConfig(field, "in", fieldMap);
      return [...options, ...fieldFns];
    }

    case "AFTER_IS":
      return [
        {
          kind: "keyword",
          label: "NULL",
          icon: Ellipsis,
          i18n_description: "Field is unset",
          insertText: "NULL",
          appendCharacter: "whitespace",
          sortOrder: 0,
        },
        {
          kind: "keyword",
          label: "NOT NULL",
          icon: Ellipsis,
          i18n_description: "Field is set",
          insertText: "NOT NULL",
          appendCharacter: "whitespace",
          sortOrder: 1,
        },
        {
          kind: "keyword",
          label: "EMPTY",
          icon: Ellipsis,
          i18n_description: "Field is empty",
          insertText: "EMPTY",
          appendCharacter: "whitespace",
          sortOrder: 2,
        },
        {
          kind: "keyword",
          label: "NOT EMPTY",
          icon: Ellipsis,
          i18n_description: "Field is not empty",
          insertText: "NOT EMPTY",
          appendCharacter: "whitespace",
          sortOrder: 3,
        },
      ];

    case "AFTER_BETWEEN":
    case "AFTER_BETWEEN_AND":
      return buildFunctionSuggestions(["DATE"]);

    case "AFTER_CONDITION":
      return buildLogicalSuggestions();

    default:
      return [];
  }
}

/**
 * Replaces the identifier word immediately before the cursor with the
 * suggestion's insertText. Only alphanumeric / underscore chars are considered
 * part of the partial token — operators, quotes, and spaces are left intact.
 */
export function applyInsertSuggestion(editor: Editor, suggestion: Suggestion): void {
  // Use the sentinel-substituted text so each atom chip occupies exactly one
  // character, matching its single ProseMirror position.
  //   pqlValue              → U+0001 (\x01)
  //   pqlCustomPropertyField → U+0002 (\x02)
  // Using editor.getText() would expand chips via renderText (e.g. '"uuid" ' or
  // 'cf["id"]'), making cursorPm — which is PM-position-based — index into the
  // middle of the expanded text and cause the walk-back to delete structural
  // characters before the cursor.
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "", (node) => {
    if (node.type.name === "pqlValue") return "\x01";
    if (node.type.name === "pqlCustomPropertyField") return "\x02";
    return "";
  });
  const cursorPm = editor.state.selection.from; // ProseMirror position

  // Walk back through identifier characters to find the start of the partial token.
  // \x01 is non-alphanumeric so the walk stops cleanly at any chip boundary.
  let tokenStart = cursorPm - 1; // character offset
  while (tokenStart > 0 && /[a-zA-Z0-9_]/.test(text[tokenStart - 1])) tokenStart--;

  const from = tokenStart + 1; // +1 converts char offset to ProseMirror position
  const to = cursorPm;

  if ("insertText" in suggestion) {
    editor.chain().focus().deleteRange({ from, to }).insertContent(suggestion.insertText).run();
    switch (suggestion.appendCharacter) {
      case "whitespace":
        editor.chain().focus().insertContent(" ").run();
        break;
      case "brackets":
        editor.chain().focus().insertContent(" ()").run();
        break;
      case "double-quotes":
        editor.chain().focus().insertContent(' ""').run();
        break;
      case "none":
        break;
    }
    if (suggestion.cursorShift !== undefined) {
      const newPos = editor.state.selection.from - suggestion.cursorShift;
      editor.chain().focus().setTextSelection(newPos).run();
    }
  } else {
    if (suggestion.insertNode.type === "value") {
      editor.chain().focus().deleteRange({ from, to }).insertPQLValue({ option: suggestion.insertNode.option }).run();
    } else if (suggestion.insertNode.type === "customPropertyField") {
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertPQLCustomPropertyField({ field: suggestion.insertNode.field })
        .insertContent(" ")
        .run();
    }
  }
}
