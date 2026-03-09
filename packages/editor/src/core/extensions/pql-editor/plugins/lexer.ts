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

import { FUNCTION_TOKEN_KIND, KEYWORD_MAP } from "./grammar";
import { TokenKind } from "../types";
import type { Token } from "../types";

/**
 * Tokenizes a PQL source string into an array of Tokens.
 *
 * @param input      - The raw PQL query string.
 * @param fieldValues - Optional set of recognised field names (defaults to empty Set). When provided it
 *                     overrides the built-in field registry so the lexer can
 *                     classify custom / project-specific fields as FIELD tokens
 *                     instead of IDENTIFIER (unknown) tokens.
 *
 * The returned array always ends with a single EOF token.
 * Unrecognized characters are emitted as ERROR tokens (one per character)
 * rather than throwing, enabling partial highlighting on incomplete input.
 */
export function tokenize(input: string, fieldValues: Set<string>): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    // ── Whitespace: skip silently ────────────────────────────────────────────
    if (isWhitespace(input[pos])) {
      pos++;
      continue;
    }

    const start = pos;

    // ── Multi-character operators (must precede single-char) ─────────────────
    if (input[pos] === "!" && input[pos + 1] === "=") {
      tokens.push(tok(TokenKind.NEQ, "!=", start, start + 2));
      pos += 2;
      continue;
    }
    if (input[pos] === ">" && input[pos + 1] === "=") {
      tokens.push(tok(TokenKind.GTE, ">=", start, start + 2));
      pos += 2;
      continue;
    }
    if (input[pos] === "<" && input[pos + 1] === "=") {
      tokens.push(tok(TokenKind.LTE, "<=", start, start + 2));
      pos += 2;
      continue;
    }

    // ── Single-character operators ───────────────────────────────────────────
    if (input[pos] === "=") {
      tokens.push(tok(TokenKind.EQ, "=", start, start + 1));
      pos++;
      continue;
    }
    if (input[pos] === ">") {
      tokens.push(tok(TokenKind.GT, ">", start, start + 1));
      pos++;
      continue;
    }
    if (input[pos] === "<") {
      tokens.push(tok(TokenKind.LT, "<", start, start + 1));
      pos++;
      continue;
    }
    if (input[pos] === "~") {
      tokens.push(tok(TokenKind.TILDE, "~", start, start + 1));
      pos++;
      continue;
    }

    // ── Punctuation ──────────────────────────────────────────────────────────
    if (input[pos] === "(") {
      tokens.push(tok(TokenKind.LPAREN, "(", start, start + 1));
      pos++;
      continue;
    }
    if (input[pos] === ")") {
      tokens.push(tok(TokenKind.RPAREN, ")", start, start + 1));
      pos++;
      continue;
    }
    if (input[pos] === ",") {
      tokens.push(tok(TokenKind.COMMA, ",", start, start + 1));
      pos++;
      continue;
    }

    // ── pqlValue chip placeholder (U+0001, one char = one PM position) ───────
    if (input[pos] === "\x01") {
      tokens.push(tok(TokenKind.PQL_VALUE_NODE, "\x01", start, start + 1));
      pos++;
      continue;
    }

    // ── pqlCustomPropertyField chip placeholder (U+0002, one char = one PM position) ─
    // Token value is later patched to the field identifier by the highlighter.
    if (input[pos] === "\x02") {
      tokens.push(tok(TokenKind.CUSTOM_PROPERTY_FIELD_NODE, "\x02", start, start + 1));
      pos++;
      continue;
    }

    // ── Quoted strings ───────────────────────────────────────────────────────
    if (['"', "'"].includes(input[pos])) {
      const result = readString(input, pos);
      tokens.push(result.token);
      pos = result.newPos;
      continue;
    }

    // ── Numbers (float before integer to avoid partial match) ────────────────
    if (isDigitStart(input, pos)) {
      const result = readNumber(input, pos);
      tokens.push(result.token);
      pos = result.newPos;
      continue;
    }

    // ── Identifiers and keywords ─────────────────────────────────────────────
    if (isIdentStart(input[pos])) {
      const result = readIdentifier(input, pos, fieldValues);

      // Collapse "NOT IN" into a single NOT_IN compound-operator token so that
      // both words receive the same "operator" highlight colour.
      if (result.token.kind === TokenKind.NOT) {
        let ahead = result.newPos;
        while (ahead < input.length && isWhitespace(input[ahead])) ahead++;
        if (ahead < input.length && isIdentStart(input[ahead])) {
          const next = readIdentifier(input, ahead, fieldValues);
          if (next.token.kind === TokenKind.IN) {
            tokens.push(tok(TokenKind.NOT_IN, input.slice(pos, next.newPos), pos, next.newPos));
            pos = next.newPos;
            continue;
          }
        }
      }

      tokens.push(result.token);
      pos = result.newPos;
      continue;
    }

    // ── Unknown character → ERROR token ─────────────────────────────────────
    tokens.push(tok(TokenKind.ERROR, input[pos], start, start + 1));
    pos++;
  }

  tokens.push(tok(TokenKind.EOF, "", pos, pos));
  return tokens;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tok(kind: TokenKind, value: string, from: number, to: number): Token {
  return { kind, value, from, to };
}

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\r" || ch === "\n";
}

function isDigitStart(input: string, pos: number): boolean {
  const ch = input[pos];
  if (ch >= "0" && ch <= "9") return true;
  // Allow leading minus only if followed by a digit (not standalone minus)
  if (ch === "-" && pos + 1 < input.length && input[pos + 1] >= "0" && input[pos + 1] <= "9") return true;
  return false;
}

function isIdentStart(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || (ch >= "0" && ch <= "9");
}

/**
 * Reads a quoted string starting at pos.
 * Handles unterminated strings gracefully (emits ERROR with partial value).
 */
function readString(input: string, pos: number): { token: Token; newPos: number } {
  const quote = input[pos];
  let end = pos + 1;
  while (end < input.length && input[end] !== quote && input[end] !== "\n") {
    end++;
  }
  if (end >= input.length || input[end] === "\n") {
    // Unterminated string — emit error token covering what we have
    return {
      token: tok(TokenKind.ERROR, input.slice(pos, end), pos, end),
      newPos: end,
    };
  }
  // Include the closing quote
  end++;
  return {
    token: tok(TokenKind.STRING, input.slice(pos, end), pos, end),
    newPos: end,
  };
}

/**
 * Reads an integer or float starting at pos.
 * Float takes priority: if we find a decimal point followed by digits, emit FLOAT.
 */
function readNumber(input: string, pos: number): { token: Token; newPos: number } {
  let end = pos;
  // Optional leading minus
  if (input[end] === "-") end++;
  // Integer part
  while (end < input.length && input[end] >= "0" && input[end] <= "9") end++;
  // Check for decimal point
  if (
    end < input.length &&
    input[end] === "." &&
    end + 1 < input.length &&
    input[end + 1] >= "0" &&
    input[end + 1] <= "9"
  ) {
    end++; // consume '.'
    while (end < input.length && input[end] >= "0" && input[end] <= "9") end++;
    return { token: tok(TokenKind.FLOAT, input.slice(pos, end), pos, end), newPos: end };
  }
  return { token: tok(TokenKind.INTEGER, input.slice(pos, end), pos, end), newPos: end };
}

/**
 * Reads an identifier and classifies it as:
 *   - A keyword (AND, OR, NOT, IS, IN, NULL, EMPTY, BETWEEN, TRUE, FALSE)
 *   - A known PQL field name → FIELD   (checked against customFieldValues if provided)
 *   - A known PQL function name → the appropriate FN_* kind
 *   - Otherwise → IDENTIFIER (to be flagged later by the validator)
 */
function readIdentifier(input: string, pos: number, fieldValues: Set<string>): { token: Token; newPos: number } {
  let end = pos;
  while (end < input.length && isIdentPart(input[end])) end++;
  const raw = input.slice(pos, end);
  const kind = classifyIdentifier(raw, fieldValues);
  return { token: tok(kind, raw, pos, end), newPos: end };
}

function classifyIdentifier(raw: string, fieldValues: Set<string>): TokenKind {
  // Keywords are case-insensitive
  const lower = raw.toLowerCase();
  const kwKind = KEYWORD_MAP.get(lower);
  if (kwKind !== undefined) return kwKind;

  // Field names are case-sensitive camelCase.
  // Use the caller-supplied set when provided (dynamic fields), otherwise fall
  // back to the built-in set from grammar.ts.
  if (fieldValues.has(raw)) return TokenKind.FIELD;

  // Function names are case-sensitive camelCase
  const fnKind = FUNCTION_TOKEN_KIND.get(raw);
  if (fnKind !== undefined) return fnKind;

  return TokenKind.IDENTIFIER;
}
