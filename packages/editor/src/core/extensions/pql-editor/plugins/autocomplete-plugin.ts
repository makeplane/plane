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
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// local imports
import { PQL_HIGHLIGHTER_KEY } from "./highlighter-plugin";
import {
  isFunctionToken,
  isFieldToken,
  isCompOp,
  isConditionEnd,
  isOrderByClauseToken,
  tokenKindToCompOp,
} from "./token-utils";
import type { Token, SuggestionContext } from "../types";
import { TokenKind } from "../types";

// ─── Plugin key ───────────────────────────────────────────────────────────────

export const PQL_AUTOCOMPLETE_KEY = new PluginKey<null>("pqlAutocomplete");

export interface PQLAutocompleteOptions {
  onContextChange: (
    context: SuggestionContext | null,
    anchor: { top: number; left: number; bottom: number } | null
  ) => void;
}

export function PQLAutocompletePlugin(options: PQLAutocompleteOptions): Plugin<null> {
  return new Plugin<null>({
    key: PQL_AUTOCOMPLETE_KEY,

    state: {
      init: () => null,
      apply: (tr, _value, _oldState, newState) => {
        if (!tr.docChanged && !tr.selectionSet) return null;
        scheduleContextUpdate(newState, options);
        return null;
      },
    },

    view(view) {
      let wasFocused = view.hasFocus();

      return {
        update(view, prevState) {
          const isFocused = view.hasFocus();
          const focusGained = isFocused && !wasFocused;
          wasFocused = isFocused;

          const state = view.state;
          if (!focusGained && state.doc.eq(prevState.doc) && state.selection.eq(prevState.selection)) return;

          const context = computeContext(state);
          if (!context) {
            options.onContextChange(null, null);
            return;
          }
          const anchor = getAnchorCoords(view);
          options.onContextChange(context, anchor);
        },
        destroy() {
          options.onContextChange(null, null);
        },
      };
    },
  });
}

// ─── Context computation ──────────────────────────────────────────────────────

function scheduleContextUpdate(state: EditorState, options: PQLAutocompleteOptions): void {
  // Deferred to avoid calling during ProseMirror dispatch
  setTimeout(() => {
    const context = computeContext(state);
    options.onContextChange(context, null);
  }, 0);
}

function computeContext(state: EditorState): SuggestionContext | null {
  const highlighterState = PQL_HIGHLIGHTER_KEY.getState(state);
  if (!highlighterState) return null;

  const { tokens } = highlighterState;
  // ProseMirror cursor position — subtract 1 for paragraph wrapper
  const pmPos = state.selection.from;
  const cursorChar = Math.max(0, pmPos - 1);

  return determineSuggestionContext(tokens, cursorChar);
}

function getAnchorCoords(view: EditorView): { top: number; left: number; bottom: number } | null {
  try {
    const pos = view.state.selection.from;
    const coords = view.coordsAtPos(pos);
    return { top: coords.top, left: coords.left, bottom: coords.bottom };
  } catch {
    return null;
  }
}

// ─── Core context determination ───────────────────────────────────────────────

/**
 * Given the token stream and the cursor's character offset, determines what
 * kind of autocomplete context the user is in.
 *
 * Key invariants:
 *  - "Partial word token": IDENTIFIER or any FN_* token whose end position
 *    equals cursorChar. This means the cursor is AT THE END of an unfinished
 *    word. We strip it and re-derive context from the preceding tokens so the
 *    suggestion category is correct (e.g. typing "I" after "priority " should
 *    still show operator suggestions, not all fields).
 *  - LPAREN is checked against the IN-list pattern before being treated as a
 *    plain group-start, so `priority IN (` correctly shows value suggestions.
 */
export function determineSuggestionContext(tokens: Token[], cursorChar: number): SuggestionContext | null {
  // Collect tokens that have been fully passed by the cursor.
  // A token occupies character indices [from, to).  It is "before the cursor"
  // when all its characters are to the left of the cursor, i.e. t.to <= cursorChar.
  // Using cursorChar + 1 would pull in the token that STARTS at cursorChar
  // (whose first character is to the RIGHT of the cursor), causing e.g. a
  // closing ')' to be treated as already consumed when the cursor is in the
  // space just before it.
  const before = tokens.filter((t) => t.kind !== TokenKind.EOF && t.to <= cursorChar);

  // True when there is an opening parenthesis that starts at or after the cursor.
  // Used to detect the "cursor is between IN/NOT IN and its '('" case, which
  // should suppress all suggestions.
  const hasLParenAhead = tokens.some((t) => t.kind === TokenKind.LPAREN && t.from >= cursorChar);

  if (before.length === 0) {
    return { kind: "START" };
  }

  const last = before[before.length - 1];
  const prev = before.length >= 2 ? before[before.length - 2] : null;
  const prev2 = before.length >= 3 ? before[before.length - 3] : null;

  // ── Partial word token ───────────────────────────────────────────────────────
  // When the cursor is exactly at the end of an IDENTIFIER or function token
  // (the user is actively typing), strip it and determine context from the
  // tokens that precede it.  This is what makes "priority I" suggest operators
  // instead of falling back to the full field+function list.
  if (isPartialWordToken(last.kind) && last.to === cursorChar) {
    const preceding = before.slice(0, -1);
    const preLast = preceding[preceding.length - 1];
    const prePrev = preceding.length >= 2 ? preceding[preceding.length - 2] : null;
    const prePrev2 = preceding.length >= 3 ? preceding[preceding.length - 3] : null;

    // Handle IN/NOT IN before delegating so hasLParenAhead can be checked.
    if (preLast?.kind === TokenKind.NOT_IN && prePrev && isFieldToken(prePrev.kind)) {
      if (hasLParenAhead) return null; // cursor is between NOT IN and its '('
      return { kind: "AFTER_IN_NO_BRACKET", field: prePrev.value, tokenStart: last.from };
    }
    if (preLast?.kind === TokenKind.IN) {
      const field =
        prePrev && isFieldToken(prePrev.kind)
          ? prePrev.value
          : prePrev?.kind === TokenKind.NOT && prePrev2 && isFieldToken(prePrev2.kind)
            ? prePrev2.value
            : undefined;
      if (field !== undefined) {
        if (hasLParenAhead) return null; // cursor is between IN and its '('
        return { kind: "AFTER_IN_NO_BRACKET", field, tokenStart: last.from };
      }
    }

    return contextFromPrecedingTokens(preceding, last.from);
  }

  // ── LPAREN: IN-list open vs expression group ──────────────────────────────────
  // Must be checked before the generic "logical/group start" path.
  if (last.kind === TokenKind.LPAREN) {
    const field = findFieldForInList(before);
    if (field !== undefined) {
      // Cursor is inside an IN list → suggest values for that field
      return { kind: "AFTER_IN", field, tokenStart: cursorChar };
    }
    // Plain grouping paren → start of a new condition
    return { kind: "START", tokenStart: cursorChar };
  }

  // ── ORDER BY / LIMIT clause contexts ─────────────────────────────────────────

  // After "ORDER BY" → suggest sortable fields
  if (last.kind === TokenKind.BY && prev?.kind === TokenKind.ORDER) {
    return { kind: "AFTER_ORDER_BY", tokenStart: cursorChar };
  }

  // After a FIELD inside ORDER BY clause → suggest ASC/DESC
  if (isFieldToken(last.kind) && isInOrderByClause(before)) {
    return { kind: "AFTER_ORDER_FIELD", tokenStart: last.from };
  }

  // After ASC/DESC → suggest comma (more fields), LIMIT, or end
  if (last.kind === TokenKind.ASC || last.kind === TokenKind.DESC) {
    return { kind: "AFTER_SORT_DIR", tokenStart: cursorChar };
  }

  // After COMMA inside ORDER BY clause → suggest more sortable fields
  if (last.kind === TokenKind.COMMA && isInOrderByClause(before)) {
    return { kind: "AFTER_ORDER_BY", tokenStart: cursorChar };
  }

  // After "LIMIT" → suggest a number
  if (last.kind === TokenKind.LIMIT) {
    return { kind: "AFTER_LIMIT", tokenStart: cursorChar };
  }

  // After an INTEGER that follows LIMIT → no more suggestions
  if (last.kind === TokenKind.INTEGER && prev?.kind === TokenKind.LIMIT) {
    return null;
  }

  // After "ORDER" without "BY" yet → no suggestions (wait for BY)
  if (last.kind === TokenKind.ORDER) {
    return null;
  }

  // ── Logical operators (OR, NOT) → start of a new condition ───────────────────
  if (last.kind === TokenKind.OR || last.kind === TokenKind.NOT) {
    return { kind: "START", tokenStart: cursorChar };
  }

  // ── After a FIELD token ──────────────────────────────────────────────────────
  if (isFieldToken(last.kind)) {
    return { kind: "AFTER_FIELD", field: last.value, tokenStart: last.from };
  }

  // ── field IS → suggest NULL / NOT NULL / EMPTY / NOT EMPTY ──────────────────
  if (last.kind === TokenKind.IS && prev && isFieldToken(prev.kind)) {
    return { kind: "AFTER_IS", field: prev.value, tokenStart: cursorChar };
  }

  // ── field BETWEEN → suggest first value ─────────────────────────────────────
  if (last.kind === TokenKind.BETWEEN && prev && isFieldToken(prev.kind)) {
    return { kind: "AFTER_BETWEEN", field: prev.value, tokenStart: cursorChar };
  }

  // ── field NOT_IN / field IN ───────────────────────────────────────────────────
  // Three distinct situations:
  //
  //   hasLParenAhead  →  cursor is somewhere between IN/NOT IN and an already-
  //     typed '('.  No suggestions: the user is just repositioning; showing
  //     anything here would be confusing.
  //
  //   !hasLParenAhead  →  no '(' exists yet in the expression.  Show value
  //     suggestions (AFTER_IN_NO_BRACKET) so the user can pick a value and let
  //     the editor auto-insert '(' around it.
  //
  //   (The inside-the-bracket case is handled above by the LPAREN branch.)
  if (last.kind === TokenKind.NOT_IN && prev && isFieldToken(prev.kind)) {
    if (hasLParenAhead) return null;
    return { kind: "AFTER_IN_NO_BRACKET", field: prev.value, tokenStart: cursorChar };
  }

  if (last.kind === TokenKind.IN) {
    const field =
      prev && isFieldToken(prev.kind)
        ? prev.value
        : prev?.kind === TokenKind.NOT && prev2 && isFieldToken(prev2.kind)
          ? prev2.value
          : undefined;
    if (!field) return { kind: "START", tokenStart: cursorChar };
    if (hasLParenAhead) return null;
    return { kind: "AFTER_IN_NO_BRACKET", field, tokenStart: cursorChar };
  }

  // ── field IN ( value , → suggest more values ─────────────────────────────────
  if (last.kind === TokenKind.COMMA) {
    const field = findFieldForInList(before);
    if (field) {
      return { kind: "AFTER_IN_COMMA", field, tokenStart: cursorChar };
    }
  }

  // ── BETWEEN value AND → suggest second value ─────────────────────────────────
  if (last.kind === TokenKind.AND) {
    if (isBetweenAndSeparator(before)) {
      return { kind: "AFTER_BETWEEN_AND", field: findBetweenField(before), tokenStart: cursorChar };
    }
    return { kind: "START", tokenStart: cursorChar };
  }

  // ── field op → suggest value ─────────────────────────────────────────────────
  if (isCompOp(last.kind) && prev && isFieldToken(prev.kind)) {
    return { kind: "AFTER_OPERATOR", field: prev.value, op: tokenKindToCompOp(last.kind), tokenStart: cursorChar };
  }

  // ── After a pqlValue chip ────────────────────────────────────────────────────
  // When the chip is the last token and the cursor is right after it, the right
  // context depends on where the chip lives in the expression:
  //   • Inside an IN / NOT IN list   → AFTER_IN_VALUE (no comma typed yet)
  //   • Anywhere else (=, !=, …)     → suggest logical connectors (AFTER_CONDITION)
  if (last.kind === TokenKind.PQL_VALUE_NODE) {
    const inListField = findFieldForInList(before);
    if (inListField !== undefined) {
      return { kind: "AFTER_IN_VALUE", field: inListField, tokenStart: cursorChar };
    }
    return { kind: "AFTER_CONDITION", tokenStart: cursorChar };
  }

  // ── After a complete value, RPAREN, or closed function call → AND / OR ───────
  // Exceptions for items inside an IN list — those still need more values:
  //   • RPAREN closing a function call (e.g. workspaceMembers()) inside an IN list
  //   • A manually typed string/number literal (e.g. "uuid") inside an IN list
  // Both cases produce AFTER_IN_VALUE because no comma has been typed yet.
  if (isConditionEnd(last.kind)) {
    if (last.kind === TokenKind.RPAREN) {
      const inListField = findFieldForInList(before);
      if (inListField !== undefined) {
        return { kind: "AFTER_IN_VALUE", field: inListField, tokenStart: cursorChar };
      }
    }
    if (last.kind === TokenKind.STRING || last.kind === TokenKind.INTEGER || last.kind === TokenKind.FLOAT) {
      const inListField = findFieldForInList(before);
      if (inListField !== undefined) {
        return { kind: "AFTER_IN_VALUE", field: inListField, tokenStart: cursorChar };
      }
    }
    return { kind: "AFTER_CONDITION", tokenStart: cursorChar };
  }

  return { kind: "START", tokenStart: cursorChar };
}

// ─── Context from preceding tokens (used when cursor is inside a partial word) ─

/**
 * Derives the suggestion context from the tokens that come BEFORE a partial
 * word the user is currently typing.  Mirrors the same decision tree as
 * `determineSuggestionContext` but operates on a stripped token list and
 * produces contexts bound to `tokenStart` (the start of the partial word).
 */
function contextFromPrecedingTokens(preceding: Token[], tokenStart: number): SuggestionContext {
  if (preceding.length === 0) {
    return { kind: "START", tokenStart };
  }

  const last = preceding[preceding.length - 1];
  const prev = preceding.length >= 2 ? preceding[preceding.length - 2] : null;
  const prev2 = preceding.length >= 3 ? preceding[preceding.length - 3] : null;

  // After a recognized FIELD → partial is an operator name
  if (isFieldToken(last.kind)) {
    return { kind: "AFTER_FIELD", field: last.value, tokenStart };
  }

  // After a comparison operator + FIELD → partial is a value or function name
  if (isCompOp(last.kind) && prev && isFieldToken(prev.kind)) {
    return { kind: "AFTER_OPERATOR", field: prev.value, op: tokenKindToCompOp(last.kind), tokenStart };
  }

  // After IS + FIELD → partial is NULL / NOT / EMPTY
  if (last.kind === TokenKind.IS && prev && isFieldToken(prev.kind)) {
    return { kind: "AFTER_IS", field: prev.value, tokenStart };
  }

  // After BETWEEN + FIELD → partial is the first bound value
  if (last.kind === TokenKind.BETWEEN && prev && isFieldToken(prev.kind)) {
    return { kind: "AFTER_BETWEEN", field: prev.value, tokenStart };
  }

  // After BETWEEN value AND → partial is the second bound value
  if (last.kind === TokenKind.AND && isBetweenAndSeparator(preceding)) {
    return { kind: "AFTER_BETWEEN_AND", field: findBetweenField(preceding), tokenStart };
  }

  // After NOT_IN → partial is a value or list function (no '(' yet)
  if (last.kind === TokenKind.NOT_IN && prev && isFieldToken(prev.kind)) {
    return { kind: "AFTER_IN_NO_BRACKET", field: prev.value, tokenStart };
  }

  // After IN → partial is a value or list function (no '(' yet)
  if (last.kind === TokenKind.IN) {
    const field =
      prev && isFieldToken(prev.kind)
        ? prev.value
        : prev?.kind === TokenKind.NOT && prev2 && isFieldToken(prev2.kind)
          ? prev2.value
          : undefined;
    return { kind: "AFTER_IN_NO_BRACKET", field, tokenStart };
  }

  // After LPAREN inside an IN list → partial is a value
  if (last.kind === TokenKind.LPAREN) {
    const field = findFieldForInList(preceding);
    if (field !== undefined) {
      return { kind: "AFTER_IN", field, tokenStart };
    }
    return { kind: "START", tokenStart };
  }

  // After COMMA inside an IN list → partial is a value
  if (last.kind === TokenKind.COMMA) {
    const field = findFieldForInList(preceding);
    if (field !== undefined) {
      return { kind: "AFTER_IN_COMMA", field, tokenStart };
    }
  }

  // After a pqlValue chip — mirror the same IN-list awareness as the main path
  if (last.kind === TokenKind.PQL_VALUE_NODE) {
    const inListField = findFieldForInList(preceding);
    if (inListField !== undefined) {
      return { kind: "AFTER_IN_VALUE", field: inListField, tokenStart };
    }
    return { kind: "AFTER_CONDITION", tokenStart };
  }

  // After a complete condition or a function call → partial is a logical op.
  // Exceptions for items inside an IN list (RPAREN, STRING, INTEGER, FLOAT):
  // those have no trailing comma yet so they get AFTER_IN_VALUE.
  if (isConditionEnd(last.kind) || isFunctionToken(last.kind)) {
    if (last.kind === TokenKind.RPAREN) {
      const inListField = findFieldForInList(preceding);
      if (inListField !== undefined) {
        return { kind: "AFTER_IN_VALUE", field: inListField, tokenStart };
      }
    }
    if (last.kind === TokenKind.STRING || last.kind === TokenKind.INTEGER || last.kind === TokenKind.FLOAT) {
      const inListField = findFieldForInList(preceding);
      if (inListField !== undefined) {
        return { kind: "AFTER_IN_VALUE", field: inListField, tokenStart };
      }
    }
    return { kind: "AFTER_CONDITION", tokenStart };
  }

  // ── ORDER BY / LIMIT clause contexts ─────────────────────────────────────────

  // After "ORDER BY" → partial is a sortable field name
  if (last.kind === TokenKind.BY && prev && prev.kind === TokenKind.ORDER) {
    return { kind: "AFTER_ORDER_BY", tokenStart };
  }

  // After FIELD inside ORDER BY → partial is ASC/DESC
  if (isFieldToken(last.kind) && isInOrderByClause(preceding)) {
    return { kind: "AFTER_ORDER_FIELD", tokenStart };
  }

  // After ASC/DESC → partial is LIMIT or comma
  if (last.kind === TokenKind.ASC || last.kind === TokenKind.DESC) {
    return { kind: "AFTER_SORT_DIR", tokenStart };
  }

  // After COMMA in ORDER BY → partial is a sortable field name
  if (last.kind === TokenKind.COMMA && isInOrderByClause(preceding)) {
    return { kind: "AFTER_ORDER_BY", tokenStart };
  }

  // After LIMIT → partial is a number (no suggestions)
  if (last.kind === TokenKind.LIMIT) {
    return { kind: "AFTER_LIMIT", tokenStart };
  }

  // After AND, OR, NOT (as group) → still starting a new condition
  if (last.kind === TokenKind.AND || last.kind === TokenKind.OR || last.kind === TokenKind.NOT) {
    return { kind: "START", tokenStart };
  }

  return { kind: "START", tokenStart };
}

// ─── Token classification helpers ─────────────────────────────────────────────

/**
 * Returns true for tokens that represent a word the user is actively typing.
 * When such a token is the last one before the cursor, the context should be
 * derived from the tokens that precede it.
 */
function isPartialWordToken(kind: TokenKind): boolean {
  return kind === TokenKind.IDENTIFIER || isFunctionToken(kind) || isOrderByClauseToken(kind);
}

/**
 * Scans backwards through `before` to find the field name for an open IN list.
 * Looks for the pattern: FIELD (NOT_IN | (NOT)? IN) LPAREN ...
 *
 * Tracks parenthesis depth so that a fully-closed group (RPAREN … LPAREN) is
 * skipped over rather than treated as the opening of the current IN list.
 * Without this, a query like `state IN (a, b) AND priority = c` (cursor after
 * `c`) would incorrectly walk back through the RPAREN, find the LPAREN of the
 * state IN list, and report that the cursor is still inside that list.
 */
function findFieldForInList(before: Token[]): string | undefined {
  let i = before.length - 1;
  let depth = 0;

  // Walk backwards, counting unmatched RPARENs.  A RPAREN increments depth;
  // a LPAREN with depth > 0 is its matching close and decrements depth.
  // The first LPAREN seen while depth === 0 is the opening paren we want.
  while (i >= 0) {
    const kind = before[i].kind;
    if (kind === TokenKind.RPAREN) {
      depth++;
      i--;
    } else if (kind === TokenKind.LPAREN) {
      if (depth > 0) {
        // This LPAREN closes one of the RPARENs we passed — skip it.
        depth--;
        i--;
      } else {
        // Unmatched LPAREN: this is the opening of the IN list we're inside.
        break;
      }
    } else {
      i--;
    }
  }

  // If we consumed more RPARENs than LPARENs, or ran off the start, the cursor
  // is not inside any open paren.
  if (depth > 0 || i < 0) return undefined;

  // i is now at the opening LPAREN — check what comes immediately before it.
  i--; // skip LPAREN
  if (i < 0) return undefined;

  // Single NOT_IN compound token: field NOT_IN (
  if (before[i].kind === TokenKind.NOT_IN) {
    i--;
    if (i >= 0 && isFieldToken(before[i].kind)) return before[i].value;
    return undefined;
  }

  // Two-token form: field (NOT)? IN (
  if (before[i].kind === TokenKind.IN) {
    i--;
    if (i < 0) return undefined;
    if (before[i].kind === TokenKind.NOT) i--;
    if (i >= 0 && isFieldToken(before[i].kind)) return before[i].value;
  }
  return undefined;
}

/**
 * Determines whether the most recent AND token is a BETWEEN separator
 * (rather than a logical AND) by checking if there's a BETWEEN in the
 * current clause without a matching logical operator between them.
 */
function isBetweenAndSeparator(before: Token[]): boolean {
  // Walk backwards from the AND tracking paren depth so function-call parens
  // (e.g. the () in today()) are skipped rather than treated as clause boundaries.
  let depth = 0;
  for (let i = before.length - 2; i >= 0; i--) {
    const k = before[i].kind;
    if (k === TokenKind.RPAREN) {
      depth++;
    } else if (k === TokenKind.LPAREN) {
      if (depth > 0) {
        depth--; // matched closing paren — keep scanning
      } else {
        // Unmatched LPAREN at the top level means we are inside an IN list, not BETWEEN
        return false;
      }
    } else if (depth === 0) {
      if (k === TokenKind.BETWEEN) return true;
      if (k === TokenKind.AND || k === TokenKind.OR) return false;
    }
    // Inside a balanced paren group (depth > 0) — keep scanning without matching
  }
  return false;
}

function findBetweenField(before: Token[]): string | undefined {
  for (let i = before.length - 1; i >= 0; i--) {
    if (before[i].kind === TokenKind.BETWEEN && i > 0 && isFieldToken(before[i - 1].kind)) {
      return before[i - 1].value;
    }
  }
  return undefined;
}

/**
 * Checks whether the cursor is currently inside an ORDER BY clause by
 * scanning backwards for an ORDER + BY token pair without encountering
 * a LIMIT token (which would mean we've moved past ORDER BY into LIMIT).
 */
function isInOrderByClause(before: Token[]): boolean {
  for (let i = before.length - 1; i >= 0; i--) {
    const kind = before[i].kind;
    if (kind === TokenKind.LIMIT) return false;
    if (kind === TokenKind.BY && i > 0 && before[i - 1].kind === TokenKind.ORDER) return true;
  }
  return false;
}
