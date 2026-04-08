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

import type { CompOp } from "../types";
import { TokenKind } from "../types";

// ─── Token classification helpers ──────────────────────────────────────────────
//
// Shared by autocomplete-plugin.ts and parser.ts (and any other PQL-related
// code that needs to reason about token kinds without importing a heavyweight
// module).

/**
 * Returns true for tokens that represent a function call keyword.
 * The set covers all FN_* variants recognised by the lexer/parser.
 */
export function isFunctionToken(kind: TokenKind): boolean {
  return (
    kind === TokenKind.FN_PREDICATE ||
    kind === TokenKind.FN_DATE ||
    kind === TokenKind.FN_USER ||
    kind === TokenKind.FN_CYCLE ||
    kind === TokenKind.FN_STATE ||
    kind === TokenKind.FN_RELATION ||
    kind === TokenKind.FN_HISTORY
  );
}

/**
 * Returns true for tokens that represent a field — either a plain-text FIELD
 * token or an inline pqlCustomPropertyField chip node.
 */
export function isFieldToken(kind: TokenKind): boolean {
  return kind === TokenKind.FIELD || kind === TokenKind.CUSTOM_PROPERTY_FIELD_NODE;
}

/**
 * Returns true for comparison-operator tokens (binary infix operators that
 * appear between a field and its value).
 */
export function isCompOp(kind: TokenKind): boolean {
  return (
    kind === TokenKind.EQ ||
    kind === TokenKind.NEQ ||
    kind === TokenKind.GTE ||
    kind === TokenKind.GT ||
    kind === TokenKind.LTE ||
    kind === TokenKind.LT ||
    kind === TokenKind.TILDE
  );
}

/**
 * Returns true for tokens that mark the end of a complete condition value —
 * a literal value, a closing paren, or a PQL value chip.
 */
export function isConditionEnd(kind: TokenKind): boolean {
  return (
    kind === TokenKind.STRING ||
    kind === TokenKind.INTEGER ||
    kind === TokenKind.FLOAT ||
    kind === TokenKind.TRUE_KW ||
    kind === TokenKind.FALSE_KW ||
    kind === TokenKind.NULL_KW ||
    kind === TokenKind.EMPTY_KW ||
    kind === TokenKind.RPAREN ||
    kind === TokenKind.PQL_VALUE_NODE
  );
}

/**
 * Returns true for tokens that are ORDER BY / LIMIT clause keywords.
 */
export function isOrderByClauseToken(kind: TokenKind): boolean {
  return (
    kind === TokenKind.ORDER ||
    kind === TokenKind.BY ||
    kind === TokenKind.ASC ||
    kind === TokenKind.DESC ||
    kind === TokenKind.LIMIT
  );
}

/**
 * Maps a comparison-operator token kind to its string representation.
 * Returns `undefined` when the kind is not a comparison operator.
 */
export function tokenKindToCompOp(kind: TokenKind): CompOp | undefined {
  switch (kind) {
    case TokenKind.EQ:
      return "=";
    case TokenKind.NEQ:
      return "!=";
    case TokenKind.GTE:
      return ">=";
    case TokenKind.GT:
      return ">";
    case TokenKind.LTE:
      return "<=";
    case TokenKind.LT:
      return "<";
    case TokenKind.TILDE:
      return "~";
    default:
      return undefined;
  }
}
