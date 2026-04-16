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

import { TokenKind } from "../types";
import type { Token } from "../types";

export type PqlOrderBySpec = {
  field: string;
  desc: boolean;
};

export type ClauseDiagnostic = {
  message: string;
  token: Token;
};

export type ParseOrderClauseResult = {
  nextPos: number;
  specs: PqlOrderBySpec[];
  diagnostics: ClauseDiagnostic[];
  /** When true, {@link nextPos} is the EOF index and the tail should not be parsed further. */
  fatal?: boolean;
};

export type ParseLimitClauseResult = {
  nextPos: number;
  limit?: number;
  diagnostics: ClauseDiagnostic[];
};

export type ParseOrderLimitTailResult = {
  nextPos: number;
  orderSpecs: PqlOrderBySpec[];
  limit?: number;
  diagnostics: ClauseDiagnostic[];
};

function eofIndex(tokens: readonly Token[]): number {
  return tokens.length - 1;
}

export function isOrderByFieldTokenKind(kind: TokenKind | undefined): boolean {
  if (kind === undefined) return false;
  return kind === TokenKind.FIELD || kind === TokenKind.IDENTIFIER || kind === TokenKind.CUSTOM_PROPERTY_FIELD_NODE;
}

/**
 * Returns the token index where the optional ORDER BY / LIMIT tail begins
 * (first ORDER or LIMIT at parenthesis depth 0), or the EOF index.
 */
export function indexAfterFilterExpr(tokens: readonly Token[]): number {
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === TokenKind.EOF) return i;
    if (depth === 0 && (t.kind === TokenKind.ORDER || t.kind === TokenKind.LIMIT)) return i;
    if (t.kind === TokenKind.LPAREN) depth++;
    else if (t.kind === TokenKind.RPAREN) depth = Math.max(0, depth - 1);
  }
  return eofIndex(tokens);
}

/**
 * Skip the rest of the token stream (caller handles diagnostics).
 */
function syncPosToEof(tokens: readonly Token[]): number {
  return eofIndex(tokens);
}

/**
 * Parses `ORDER BY field [ASC|DESC] ("," field [ASC|DESC])*` — mirrors
 * apps/api/plane/utils/pql/grammar.lark `order_clause` / `order_field`.
 *
 * Expects `tokens[start]` to be {@link TokenKind.ORDER}. On unrecoverable errors,
 * `nextPos` is set to the EOF index and any partial `specs` collected so far are returned.
 */
export function parseOrderClause(tokens: readonly Token[], start: number): ParseOrderClauseResult {
  const diagnostics: ClauseDiagnostic[] = [];
  const specs: PqlOrderBySpec[] = [];
  let i = start;

  if (tokens[i]?.kind !== TokenKind.ORDER) {
    return { nextPos: i, specs, diagnostics, fatal: false };
  }
  i++;

  const afterOrder = tokens[i] ?? tokens[eofIndex(tokens)];
  if (afterOrder.kind !== TokenKind.BY) {
    diagnostics.push({ message: "Expected BY after ORDER", token: afterOrder });
    return { nextPos: syncPosToEof(tokens), specs, diagnostics, fatal: true };
  }
  i++;

  while (true) {
    const fieldTok = tokens[i];
    if (!isOrderByFieldTokenKind(fieldTok?.kind)) {
      diagnostics.push({
        message: "Expected a field name in ORDER BY",
        token: fieldTok ?? tokens[eofIndex(tokens)],
      });
      return { nextPos: syncPosToEof(tokens), specs, diagnostics, fatal: true };
    }
    const field = fieldTok.value;
    i++;

    let desc = false;
    if (tokens[i]?.kind === TokenKind.DESC) {
      desc = true;
      i++;
    } else if (tokens[i]?.kind === TokenKind.ASC) {
      i++;
    }

    specs.push({ field, desc });

    if (tokens[i]?.kind === TokenKind.COMMA) {
      i++;
      continue;
    }
    break;
  }

  return { nextPos: i, specs, diagnostics, fatal: false };
}

/**
 * Parses `LIMIT` followed by a positive integer (matches Lark `POSITIVE_INT`).
 *
 * Expects `tokens[start]` to be {@link TokenKind.LIMIT}.
 */
export function parseLimitClause(tokens: readonly Token[], start: number): ParseLimitClauseResult {
  const diagnostics: ClauseDiagnostic[] = [];
  let i = start;

  if (tokens[i]?.kind !== TokenKind.LIMIT) {
    return { nextPos: i, diagnostics, limit: undefined };
  }
  i++;

  const numTok = tokens[i] ?? tokens[eofIndex(tokens)];
  if (numTok.kind !== TokenKind.INTEGER) {
    diagnostics.push({ message: "Expected a positive integer after LIMIT", token: numTok });
    if (numTok.kind !== TokenKind.EOF) i++;
    return { nextPos: i, diagnostics, limit: undefined };
  }

  const n = parseInt(numTok.value, 10);
  if (!Number.isFinite(n) || n < 1) {
    diagnostics.push({ message: "LIMIT must be a positive integer", token: numTok });
  }
  i++;

  return {
    nextPos: i,
    diagnostics,
    limit: Number.isFinite(n) && n >= 1 ? n : undefined,
  };
}

/**
 * Parses optional ORDER BY and LIMIT in either order (same rules as the main PQL parser query tail).
 */
export function parseOrderLimitTail(tokens: readonly Token[], start: number): ParseOrderLimitTailResult {
  const diagnostics: ClauseDiagnostic[] = [];
  let i = start;
  let orderSpecs: PqlOrderBySpec[] = [];
  let limit: number | undefined;

  if (tokens[i]?.kind === TokenKind.ORDER) {
    const orderResult = parseOrderClause(tokens, i);
    i = orderResult.nextPos;
    orderSpecs = orderResult.specs;
    diagnostics.push(...orderResult.diagnostics);

    if (!orderResult.fatal && tokens[i]?.kind === TokenKind.LIMIT) {
      const limitResult = parseLimitClause(tokens, i);
      i = limitResult.nextPos;
      limit = limitResult.limit;
      diagnostics.push(...limitResult.diagnostics);
    }
  } else if (tokens[i]?.kind === TokenKind.LIMIT) {
    const limitResult = parseLimitClause(tokens, i);
    i = limitResult.nextPos;
    limit = limitResult.limit;
    diagnostics.push(...limitResult.diagnostics);

    if (tokens[i]?.kind === TokenKind.ORDER) {
      const orderResult = parseOrderClause(tokens, i);
      i = orderResult.nextPos;
      orderSpecs = orderResult.specs;
      diagnostics.push(...orderResult.diagnostics);
    }
  }

  return { nextPos: i, orderSpecs, limit, diagnostics };
}
