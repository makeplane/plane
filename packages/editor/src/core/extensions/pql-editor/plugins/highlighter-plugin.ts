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

import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { tokenize } from "./lexer";
import { parse } from "./parser";
import { validate } from "./validator";
import { TokenKind } from "../types";
import type { EditorState } from "@tiptap/pm/state";
import type { FieldDef, Token, ParseResult } from "../types";

// ─── Plugin key (used by the autocomplete plugin to read tokens) ──────────────

export const PQL_HIGHLIGHTER_KEY = new PluginKey<HighlighterState>("pqlHighlighter");

type HighlighterState = {
  decorations: DecorationSet;
  tokens: Token[];
  parseResult: ParseResult;
};

export type PQLHighlighterOptions = {
  onParseResult: (result: ParseResult) => void;
  /**
   * Custom field definitions. When provided the lexer classifies these names as
   * FIELD tokens and the validator evaluates field-specific rules against them.
   */
  fieldDefs: FieldDef[];
};

/**
 * Maps a TokenKind to one of five CSS class suffixes:
 *   field      → blue
 *   operator   → green   (comparison + structural: =, !=, IN, IS, BETWEEN, …)
 *   logical    → purple  (AND, OR, NOT)
 *   function   → light blue
 *   punctuation → muted  ((, ), ,)
 *   error      → red     (unrecognised / unknown)
 *
 * Values (strings, numbers, booleans, null/empty) are intentionally left
 * undecorated so they render in the default foreground colour.
 */
const TOKEN_CLASS: Partial<Record<TokenKind, string>> = {
  // ── Logical operators ────────────────────────────────────────────────────
  [TokenKind.AND]: "logical",
  [TokenKind.OR]: "logical",
  [TokenKind.NOT]: "logical",

  // ── Comparison + structural operators ───────────────────────────────────
  [TokenKind.EQ]: "operator",
  [TokenKind.NEQ]: "operator",
  [TokenKind.GTE]: "operator",
  [TokenKind.GT]: "operator",
  [TokenKind.LTE]: "operator",
  [TokenKind.LT]: "operator",
  [TokenKind.TILDE]: "operator",
  [TokenKind.IN]: "operator",
  [TokenKind.NOT_IN]: "operator",
  [TokenKind.IS]: "operator",
  [TokenKind.BETWEEN]: "operator",

  // ── ORDER BY / LIMIT clause keywords ──────────────────────────────────
  [TokenKind.ORDER]: "operator",
  [TokenKind.BY]: "operator",
  [TokenKind.LIMIT]: "operator",
  [TokenKind.ASC]: "operator",
  [TokenKind.DESC]: "operator",

  // ── Field names ──────────────────────────────────────────────────────────
  [TokenKind.FIELD]: "field",
  [TokenKind.CUSTOM_PROPERTY_FIELD_NODE]: "field",

  // ── All function kinds ───────────────────────────────────────────────────
  [TokenKind.FN_PREDICATE]: "function",
  [TokenKind.FN_DATE]: "function",
  [TokenKind.FN_USER]: "function",
  [TokenKind.FN_CYCLE]: "function",
  [TokenKind.FN_STATE]: "function",
  [TokenKind.FN_RELATION]: "function",
  [TokenKind.FN_HISTORY]: "function",

  // ── Punctuation ──────────────────────────────────────────────────────────
  [TokenKind.LPAREN]: "punctuation",
  [TokenKind.RPAREN]: "punctuation",
  [TokenKind.COMMA]: "punctuation",

  // ── Errors ───────────────────────────────────────────────────────────────
  [TokenKind.IDENTIFIER]: "error",
  [TokenKind.ERROR]: "error",

  // Values (STRING, INTEGER, FLOAT, TRUE_KW, FALSE_KW, NULL_KW, EMPTY_KW)
  // are intentionally omitted — they render in the default text colour.
};

export function PQLHighlighterPlugin(options: PQLHighlighterOptions): Plugin<HighlighterState> {
  return new Plugin<HighlighterState>({
    key: PQL_HIGHLIGHTER_KEY,

    state: {
      init(_, state) {
        return buildState(state, options);
      },

      apply(tr, pluginState, _oldState, newState) {
        if (!tr.docChanged) return pluginState;
        return buildState(newState, options);
      },
    },

    props: {
      decorations(state) {
        return PQL_HIGHLIGHTER_KEY.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

// ─── State builder ────────────────────────────────────────────────────────────

/**
 * Extracts the PQL source string from the editor document and, simultaneously,
 * builds a char-offset → field-identifier map for every `pqlCustomPropertyField`
 * atom node.
 *
 * Each `pqlValue` atom is replaced with U+0001 and each `pqlCustomPropertyField`
 * atom is replaced with U+0002 so that every chip occupies exactly one character
 * offset — matching the single ProseMirror position the atom consumes.  This
 * keeps char offsets in the token stream in sync with PM positions
 * (pmOffset = 1) even when chips are present.
 *
 * The returned `customFieldOffsets` map is used to patch the `value` of each
 * CUSTOM_PROPERTY_FIELD_NODE token from the raw sentinel back to the real field
 * identifier (e.g. `"customproperty_abc123"`), which the autocomplete logic
 * needs to look up operators from `fieldMap`.
 */
function extractPQLSource(state: EditorState): { text: string; customFieldOffsets: Map<number, string> } {
  const customFieldOffsets = new Map<number, string>();
  const buf: string[] = [];
  let len = 0;

  state.doc.nodesBetween(0, state.doc.content.size, (node) => {
    if (node.isText) {
      buf.push(node.text!);
      len += node.text!.length;
      return false;
    }
    if (node.type.name === "pqlValue") {
      buf.push("\x01");
      len += 1;
      return false;
    }
    if (node.type.name === "pqlCustomPropertyField") {
      const fieldValue = (node.attrs.field as FieldDef | null)?.value ?? "";
      customFieldOffsets.set(len, fieldValue);
      buf.push("\x02");
      len += 1;
      return false;
    }
    return true; // descend into container nodes (doc, paragraph)
  });

  return { text: buf.join(""), customFieldOffsets };
}

function buildState(state: EditorState, options: PQLHighlighterOptions): HighlighterState {
  const { text, customFieldOffsets } = extractPQLSource(state);

  // Derive runtime-computed sets/maps from the fieldDefs once per build.
  const fieldValues = new Set(options.fieldDefs.map((f) => f.value));
  const fieldMap = new Map(options.fieldDefs.map((f) => [f.value, f]));

  const tokens = tokenize(text, fieldValues);

  // Patch CUSTOM_PROPERTY_FIELD_NODE token values from the sentinel (\x02) to
  // the real field identifier so downstream consumers (autocomplete) can look
  // the field up in fieldMap.
  for (const token of tokens) {
    if (token.kind === TokenKind.CUSTOM_PROPERTY_FIELD_NODE) {
      const fieldValue = customFieldOffsets.get(token.from);
      if (fieldValue) token.value = fieldValue;
    }
  }
  const { ast, errors: parseErrors } = parse(tokens, options.fieldDefs);
  const validationErrors = validate(ast, fieldMap);
  const allErrors = [...parseErrors, ...validationErrors];

  const parseResult: ParseResult = {
    ast,
    errors: allErrors,
    isValid: allErrors.length === 0,
  };

  // Notify React component asynchronously to avoid re-render during ProseMirror dispatch
  setTimeout(() => options.onParseResult(parseResult), 0);

  const decorations = buildDecorations(state, tokens, allErrors);

  return { decorations, tokens, parseResult };
}

// ─── Decoration builder ───────────────────────────────────────────────────────

function buildDecorations(
  state: EditorState,
  tokens: Token[],
  errors: Array<{ from: number; to: number; message: string }>
): DecorationSet {
  const decors: Decoration[] = [];

  // The ProseMirror document has an extra offset of 1 for the paragraph wrapper node.
  // Character offset 0 in the text → ProseMirror position 1.
  const pmOffset = 1;

  // Token decorations (syntax highlighting)
  for (const token of tokens) {
    if (token.kind === TokenKind.EOF) continue;

    const cssClass = TOKEN_CLASS[token.kind];
    if (!cssClass) continue;

    const from = token.from + pmOffset;
    const to = token.to + pmOffset;
    if (from >= to) continue;

    decors.push(
      Decoration.inline(from, to, {
        class: `pql-token pql-token--${cssClass}`,
      })
    );
  }

  // Error underline decorations
  // Build a set of char ranges that are already error tokens so we don't double-decorate
  const errorTokenRanges = new Set<string>(
    tokens.filter((t) => t.kind === TokenKind.ERROR).map((t) => `${t.from}:${t.to}`)
  );

  for (const err of errors) {
    const key = `${err.from}:${err.to}`;
    // Error token ranges already have the red color class; skip duplicate underlines
    if (errorTokenRanges.has(key)) continue;

    const from = err.from + pmOffset;
    const to = err.to + pmOffset;
    if (from >= to) continue;

    decors.push(
      Decoration.inline(from, to, {
        class: "pql-error-underline",
        "data-pql-error": err.message,
      })
    );
  }

  return DecorationSet.create(state.doc, decors);
}
