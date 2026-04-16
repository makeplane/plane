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
import type {
  Token,
  ASTNode,
  ValueNode,
  CompOp,
  ParseError,
  ParseResult,
  OrNode,
  AndNode,
  NotNode,
  GroupNode,
  ComparisonNode,
  BetweenNode,
  IsNullNode,
  IsEmptyNode,
  InNode,
  FunctionCallNode,
  ErrorNode,
  StringValueNode,
  NumberValueNode,
  BooleanValueNode,
  NullValueNode,
  FieldDef,
} from "../types";
import { isAValidFormattedDate, isDateFilterType } from "@plane/utils";
import { isFieldToken, isFunctionToken, tokenKindToCompOp } from "./token-utils";
import { parseOrderLimitTail } from "./order-limit-clauses";
import { DATE_FIELD_NAMES } from "./grammar";

/**
 * PQL field names (`FieldDef.value`) that use date / date-range operators in the
 * filter config — string literals in comparisons must look like YYYY-MM-DD.
 */
function buildDateFieldNamesFromFieldDefs(fieldDefs: FieldDef[]): Set<string> {
  const names = new Set<string>();
  for (const def of fieldDefs) {
    for (const cfg of def.allowedOps.values()) {
      if (isDateFilterType(cfg.type)) {
        names.add(def.value);
        break;
      }
    }
  }
  return names;
}

/**
 * Parses a flat Token[] (from the lexer) into an AST with error recovery.
 *
 * On unexpected input the parser:
 *   1. Records a ParseError
 *   2. Skips tokens until a synchronization point (AND, OR, RPAREN, EOF)
 *   3. Returns an ErrorNode and continues
 *
 * This means syntax highlighting and autocomplete remain functional
 * even when the query is incomplete or malformed.
 */
export function parse(tokens: Token[], fieldDefs: FieldDef[] = []): ParseResult {
  const dateFieldNames = fieldDefs.length > 0 ? buildDateFieldNamesFromFieldDefs(fieldDefs) : DATE_FIELD_NAMES;
  const state = new ParserState(tokens, dateFieldNames);
  const ast = state.parseQuery();
  return {
    ast,
    errors: state.errors,
    isValid: state.errors.length === 0,
  };
}

// ─── Parser state ─────────────────────────────────────────────────────────────

class ParserState {
  private pos = 0;
  readonly errors: ParseError[] = [];

  constructor(
    private readonly tokens: Token[],
    private readonly dateFieldNames: Set<string>
  ) {}

  // ── Public entry point ────────────────────────────────────────────────────

  parseQuery(): ASTNode | null {
    if (this.peek().kind === TokenKind.EOF) return null;

    // Lark grammar allows queries with only ORDER BY / LIMIT (no filter expr), or
    // `expr` followed by optional ORDER BY and LIMIT in either order.
    let node: ASTNode | null = null;
    const first = this.peek().kind;
    if (first !== TokenKind.ORDER && first !== TokenKind.LIMIT) {
      node = this.parseOrExpr();
    }

    const tail = parseOrderLimitTail(this.tokens, this.pos);
    this.pos = tail.nextPos;
    for (const d of tail.diagnostics) {
      this.addError(d.message, d.token);
    }

    if (this.peek().kind !== TokenKind.EOF) {
      const t = this.peek();
      this.addError(`Unexpected token '${t.value}' after end of expression`, t);
      this.syncToSafe();
    }
    return node;
  }

  // ── Grammar rules (top-down, highest precedence last) ────────────────────

  private parseOrExpr(): ASTNode {
    let left = this.parseAndExpr();
    while (this.peek().kind === TokenKind.OR) {
      const opTok = this.advance();
      const right = this.parseAndExpr();
      left = orNode(left, right, left.from, right.to);
      void opTok;
    }
    return left;
  }

  private parseAndExpr(): ASTNode {
    let left = this.parseNotExpr();
    while (this.peek().kind === TokenKind.AND) {
      // Peek two ahead: if this AND is part of BETWEEN ... AND ..., stop here.
      // The BETWEEN parser consumed the FIELD + BETWEEN + low already, so
      // the AND we see at this level is always a logical AND.
      const opTok = this.advance();
      const right = this.parseNotExpr();
      left = andNode(left, right, left.from, right.to);
      void opTok;
    }
    return left;
  }

  private parseNotExpr(): ASTNode {
    if (this.peek().kind === TokenKind.NOT) {
      // Peek: if the token after NOT is IN, that means we're inside a comparison
      // that started with a field name — but we shouldn't be here then.
      // In practice `NOT IN` is consumed by parseComparisonRHS, so if we see
      // NOT here it is always a logical NOT prefix.
      const notTok = this.advance();
      const operand = this.parseNotExpr();
      return notNode(operand, notTok.from, operand.to);
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const t = this.peek();

    // Grouped sub-expression: ( expr )
    if (t.kind === TokenKind.LPAREN) {
      return this.parseGroup();
    }

    // Function call: identifier(...) — predicate, relation, history, or value fn used standalone
    if (isFunctionToken(t.kind)) {
      return this.parseFunctionCall();
    }

    // Unknown identifier used as standalone condition (e.g. typo)
    if (t.kind === TokenKind.IDENTIFIER) {
      return this.parseFunctionCall();
    }

    // Comparison: field op value  |  field IN ...  |  field IS ...  |  field BETWEEN ...
    if (isFieldToken(t.kind)) {
      return this.parseComparison();
    }

    // EOF inside an expression
    if (t.kind === TokenKind.EOF) {
      this.addError("Unexpected end of input, expected a condition", t);
      return errorNode("Unexpected end of input", t.from, t.to);
    }

    // Unrecognized primary
    this.addError(`Expected a field name, function, or '(' but got '${t.value}'`, t);
    this.advance();
    this.syncToSafe();
    return errorNode(`Unexpected token '${t.value}'`, t.from, t.to);
  }

  private parseGroup(): GroupNode {
    const lparen = this.advance(); // consume '('
    const body = this.parseOrExpr();
    if (this.peek().kind !== TokenKind.RPAREN) {
      const t = this.peek();
      this.addError("Expected ')' to close group", t);
      return groupNode(body, lparen.from, body.to);
    }
    const rparen = this.advance(); // consume ')'
    return groupNode(body, lparen.from, rparen.to);
  }

  private parseComparison(): ASTNode {
    const fieldTok = this.advance(); // consume the FIELD token
    const field = fieldTok.value;
    return this.parseComparisonRHS(field, fieldTok);
  }

  /**
   * Parses everything after the field name in a comparison.
   * Handles:
   *   field = value
   *   field != value
   *   field > value  (and >=, <, <=, ~)
   *   field IN ( ... )
   *   field NOT IN ( ... )
   *   field IS NULL | IS NOT NULL | IS EMPTY | IS NOT EMPTY
   *   field BETWEEN value AND value
   */
  private parseComparisonRHS(field: string, fieldTok: Token): ASTNode {
    const next = this.peek();

    // NOT IN (compound token emitted by the lexer)
    if (next.kind === TokenKind.NOT_IN) {
      this.advance(); // consume NOT_IN
      return this.parseInClause(field, fieldTok, true);
    }

    // NOT IN (legacy two-token form — kept for safety, should not occur with the current lexer)
    if (next.kind === TokenKind.NOT && this.peekAt(1).kind === TokenKind.IN) {
      this.advance(); // consume NOT
      this.advance(); // consume IN
      return this.parseInClause(field, fieldTok, true);
    }

    // IN
    if (next.kind === TokenKind.IN) {
      this.advance(); // consume IN
      return this.parseInClause(field, fieldTok, false);
    }

    // IS NULL | IS NOT NULL | IS EMPTY | IS NOT EMPTY
    if (next.kind === TokenKind.IS) {
      this.advance(); // consume IS
      return this.parseIsClause(field, fieldTok);
    }

    // BETWEEN value AND value
    if (next.kind === TokenKind.BETWEEN) {
      this.advance(); // consume BETWEEN
      return this.parseBetweenClause(field, fieldTok);
    }

    // Regular comparison: =, !=, >, >=, <, <=, ~
    const opTok = this.peek();
    const op = tokenKindToCompOp(opTok.kind);
    if (op === undefined) {
      this.addError(`Expected an operator after field '${field}'`, opTok);
      this.syncToSafe();
      return errorNode(`Missing operator after '${field}'`, fieldTok.from, opTok.to);
    }
    this.advance(); // consume operator
    const value = this.parseValue();
    if (!value) {
      const err = errorNode(`Missing value after '${field} ${opTok.value}'`, fieldTok.from, opTok.to);
      this.addError(`Missing value after '${field} ${opTok.value}'`, opTok);
      return err;
    }
    const dateErr = this.checkDateValue(field, value, fieldTok.from);
    if (dateErr) return dateErr;
    return comparisonNode(field, op, value, fieldTok.from, value.to);
  }

  /**
   * Parses the RHS of an IN / NOT IN clause.
   * RHS is either a parenthesised value list or a list-returning function call.
   */
  private parseInClause(field: string, fieldTok: Token, negated: boolean): InNode | ErrorNode {
    const next = this.peek();

    // Function call shorthand: IN openStates() etc.
    if (isFunctionToken(next.kind) || next.kind === TokenKind.IDENTIFIER) {
      const fn = this.parseFunctionCall();
      if (fn.kind === "error") {
        return errorNode(fn.message, fieldTok.from, fn.to);
      }
      return inNode(field, negated, fn, fieldTok.from, fn.to);
    }

    // Parenthesised list: ( value, value, ... )
    if (next.kind !== TokenKind.LPAREN) {
      this.addError(`Expected '(' or a function after IN`, next);
      this.syncToSafe();
      return errorNode("Expected '(' or function after IN", fieldTok.from, next.to);
    }
    const lparen = this.advance(); // consume '('
    const values: ValueNode[] = [];

    if (this.peek().kind !== TokenKind.RPAREN) {
      const first = this.parseValue();
      if (first) values.push(first);

      while (this.peek().kind === TokenKind.COMMA) {
        this.advance(); // consume ','
        const v = this.parseValue();
        if (v) values.push(v);
      }
    }

    let to = lparen.to;
    if (this.peek().kind === TokenKind.RPAREN) {
      to = this.advance().to; // consume ')'
    } else {
      this.addError("Expected ')' to close IN list", this.peek());
    }

    return inNode(field, negated, values, fieldTok.from, to);
  }

  /** Parses IS [NOT] NULL | IS [NOT] EMPTY */
  private parseIsClause(field: string, fieldTok: Token): IsNullNode | IsEmptyNode | ErrorNode {
    const negated = this.peek().kind === TokenKind.NOT;
    if (negated) this.advance(); // consume NOT

    const kw = this.peek();
    if (kw.kind === TokenKind.NULL_KW) {
      const t = this.advance();
      return isNullNode(field, negated, fieldTok.from, t.to);
    }
    if (kw.kind === TokenKind.EMPTY_KW) {
      const t = this.advance();
      return isEmptyNode(field, negated, fieldTok.from, t.to);
    }

    this.addError("Expected NULL or EMPTY after IS", kw);
    this.syncToSafe();
    return errorNode("Expected NULL or EMPTY after IS", fieldTok.from, kw.to);
  }

  /** Parses BETWEEN low AND high */
  private parseBetweenClause(field: string, fieldTok: Token): BetweenNode | ErrorNode {
    const low = this.parseValue();
    if (!low) {
      const errTok = this.peek();
      this.addError(`Expected lower bound after BETWEEN`, errTok);
      return errorNode(`Expected lower bound after BETWEEN`, fieldTok.from, errTok.to);
    }
    const lowDateErr = this.checkDateValue(field, low, fieldTok.from);
    if (lowDateErr) return lowDateErr;

    if (this.peek().kind !== TokenKind.AND) {
      const t = this.peek();
      this.addError("Expected AND between the two BETWEEN values", t);
      this.syncToSafe();
      return errorNode("Missing AND in BETWEEN", fieldTok.from, t.to);
    }
    this.advance(); // consume AND (used as separator, not logical AND)

    const high = this.parseValue();
    if (!high) {
      const t = this.peek();
      this.addError(`Expected upper bound after BETWEEN ... AND`, t);
      return errorNode(`Expected upper bound after BETWEEN ... AND`, fieldTok.from, t.to);
    }
    const highDateErr = this.checkDateValue(field, high, fieldTok.from);
    if (highDateErr) return highDateErr;

    return betweenNode(field, low, high, fieldTok.from, high.to);
  }

  /** Parses a function call: name ( arg, arg, ... ) */
  private parseFunctionCall(): FunctionCallNode | ErrorNode {
    const nameTok = this.advance(); // consume function name (or unknown IDENTIFIER)

    if (this.peek().kind !== TokenKind.LPAREN) {
      // Bare identifier without parens — treat as an error
      this.addError(`Expected '(' after function name '${nameTok.value}'`, this.peek());
      return errorNode(`Missing '(' after '${nameTok.value}'`, nameTok.from, nameTok.to);
    }
    this.advance(); // consume '('

    const args: ValueNode[] = [];
    if (this.peek().kind !== TokenKind.RPAREN && this.peek().kind !== TokenKind.EOF) {
      const first = this.parseValue();
      if (first) args.push(first);

      while (this.peek().kind === TokenKind.COMMA) {
        this.advance(); // consume ','
        const v = this.parseValue();
        if (v) args.push(v);
      }
    }

    if (this.peek().kind !== TokenKind.RPAREN) {
      this.addError(`Expected ')' to close argument list of '${nameTok.value}'`, this.peek());
      return fnCallNode(nameTok.value, args, nameTok.from, this.peek().from);
    }
    const rparen = this.advance(); // consume ')'
    return fnCallNode(nameTok.value, args, nameTok.from, rparen.to);
  }

  // ── Value parsing ─────────────────────────────────────────────────────────

  /**
   * Parses a single value (literal or function call used as a value).
   * Returns null on failure (caller is responsible for error recording).
   */
  private parseValue(): ValueNode | null {
    const t = this.peek();

    if (t.kind === TokenKind.STRING) {
      this.advance();
      // Strip surrounding quotes from the stored value
      const inner = t.value.slice(1, -1);
      return stringValueNode(inner, t.from, t.to);
    }

    // pqlValue chip node — treated as a quoted string value
    if (t.kind === TokenKind.PQL_VALUE_NODE) {
      this.advance();
      return stringValueNode("\x01", t.from, t.to);
    }

    if (t.kind === TokenKind.INTEGER) {
      this.advance();
      return numberValueNode(parseInt(t.value, 10), t.from, t.to);
    }

    if (t.kind === TokenKind.FLOAT) {
      this.advance();
      return numberValueNode(parseFloat(t.value), t.from, t.to);
    }

    if (t.kind === TokenKind.TRUE_KW) {
      this.advance();
      return boolValueNode(true, t.from, t.to);
    }

    if (t.kind === TokenKind.FALSE_KW) {
      this.advance();
      return boolValueNode(false, t.from, t.to);
    }

    if (t.kind === TokenKind.NULL_KW) {
      this.advance();
      return nullValueNode(t.from, t.to);
    }

    // Function call used as a value (e.g. currentUser(), daysAgo(7))
    if (isFunctionToken(t.kind) || t.kind === TokenKind.IDENTIFIER) {
      const fn = this.parseFunctionCall();
      // FunctionCallNode satisfies ValueNode
      return fn.kind === "error" ? null : fn;
    }

    this.addError(`Expected a value but got '${t.value}'`, t);
    this.advance();
    this.syncToSafe();
    return null;
  }

  // ── Token stream helpers ──────────────────────────────────────────────────

  private peek(): Token {
    return this.tokens[this.pos] ?? { kind: TokenKind.EOF, value: "", from: 0, to: 0 };
  }

  private peekAt(offset: number): Token {
    return this.tokens[this.pos + offset] ?? { kind: TokenKind.EOF, value: "", from: 0, to: 0 };
  }

  private advance(): Token {
    const t = this.tokens[this.pos] ?? { kind: TokenKind.EOF, value: "", from: 0, to: 0 };
    if (this.pos < this.tokens.length - 1) this.pos++;
    return t;
  }

  private addError(message: string, token: Token): void {
    this.errors.push({ message, from: token.from, to: Math.max(token.to, token.from + 1) });
  }

  private addErrorRange(message: string, from: number, to: number): void {
    this.errors.push({ message, from, to: Math.max(to, from + 1) });
  }

  /**
   * When `field` is a date field and `value` is a string literal that fails
   * date validation, records a ParseError and returns an ErrorNode.
   * Returns null when no date error is detected (caller should proceed normally).
   */
  private checkDateValue(field: string, value: ValueNode, fieldFrom: number): ErrorNode | null {
    if (!this.dateFieldNames.has(field) || value.kind !== "string" || isAValidFormattedDate(value.value)) return null;
    this.addErrorRange(`Invalid date '${value.value}' - expected YYYY-MM-DD`, value.from, value.to);
    return errorNode(`Invalid date for '${field}'`, fieldFrom, value.to);
  }

  /**
   * Error recovery: skip tokens until we find a synchronization point.
   * Sync points are: AND, OR, RPAREN, EOF.
   */
  private syncToSafe(): void {
    while (
      this.peek().kind !== TokenKind.EOF &&
      this.peek().kind !== TokenKind.AND &&
      this.peek().kind !== TokenKind.OR &&
      this.peek().kind !== TokenKind.RPAREN
    ) {
      this.advance();
    }
  }
}

// ─── AST node constructors ────────────────────────────────────────────────────

function orNode(left: ASTNode, right: ASTNode, from: number, to: number): OrNode {
  return { kind: "or", left, right, from, to };
}

function andNode(left: ASTNode, right: ASTNode, from: number, to: number): AndNode {
  return { kind: "and", left, right, from, to };
}

function notNode(operand: ASTNode, from: number, to: number): NotNode {
  return { kind: "not", operand, from, to };
}

function groupNode(body: ASTNode, from: number, to: number): GroupNode {
  return { kind: "group", body, from, to };
}

function comparisonNode(field: string, op: CompOp, value: ValueNode, from: number, to: number): ComparisonNode {
  return { kind: "comparison", field, op, value, from, to };
}

function betweenNode(field: string, low: ValueNode, high: ValueNode, from: number, to: number): BetweenNode {
  return { kind: "between", field, low, high, from, to };
}

function isNullNode(field: string, negated: boolean, from: number, to: number): IsNullNode {
  return { kind: "is_null", field, negated, from, to };
}

function isEmptyNode(field: string, negated: boolean, from: number, to: number): IsEmptyNode {
  return { kind: "is_empty", field, negated, from, to };
}

function inNode(
  field: string,
  negated: boolean,
  values: FunctionCallNode | ValueNode[],
  from: number,
  to: number
): InNode {
  return { kind: "in", field, negated, values, from, to };
}

function fnCallNode(name: string, args: ValueNode[], from: number, to: number): FunctionCallNode {
  return { kind: "fn_call", name, args, from, to };
}

function errorNode(message: string, from: number, to: number): ErrorNode {
  return { kind: "error", message, from, to };
}

function stringValueNode(value: string, from: number, to: number): StringValueNode {
  return { kind: "string", value, from, to };
}

function numberValueNode(value: number, from: number, to: number): NumberValueNode {
  return { kind: "number", value, from, to };
}

function boolValueNode(value: boolean, from: number, to: number): BooleanValueNode {
  return { kind: "boolean", value, from, to };
}

function nullValueNode(from: number, to: number): NullValueNode {
  return { kind: "null", from, to };
}
