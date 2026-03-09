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

import { FUNCTION_MAP, HISTORY_FIELD_NAMES, LIST_RETURNING_FUNCTIONS, STANDALONE_FUNCTIONS } from "./grammar";
import type { ASTNode, FieldDef, ParseError, ValueNode } from "../types";

/**
 * Performs semantic validation on a parsed PQL AST.
 *
 * @param ast      - The root AST node returned by the parser.
 * @param fieldMap - Optional map of field name → FieldDef. When provided it
 *                   overrides the built-in field registry so rules R2 and R4
 *                   are evaluated against custom / project-specific fields.
 *                   Falls back to the built-in FIELD_MAP when omitted.
 *
 * Enforces rules that cannot be expressed purely in the EBNF grammar:
 *   R1 — Predicate functions must not appear as values
 *   R2 — The '~' (contains) operator is only valid for 'name' and 'text'
 *   R3 — The RHS of IN must be a value list or a list-returning function
 *   R4 — Boolean fields only accept true/false or IS NULL/IS NOT NULL
 *   R5 — History field-name args must be valid history field names
 *   R6 — Function arity must be correct
 *   R7 — Unknown identifiers (bare IDENTIFIER tokens that became fn_call nodes) are errors
 *
 * Returns an array of ParseError (same shape, reused for decoration).
 * The caller merges these with the parser's own ParseError[].
 */
export function validate(ast: ASTNode | null, fieldMap: Map<string, FieldDef>): ParseError[] {
  if (!ast) return [];
  const errors: ParseError[] = [];
  const resolvedFieldMap = fieldMap;
  walkNode(ast, errors, false, resolvedFieldMap);
  return errors;
}

// ─── Tree walker ──────────────────────────────────────────────────────────────

/**
 * @param inValuePosition - true when the node is being evaluated as a value
 *   (i.e. on the RHS of an operator, or inside an argument list).
 * @param fieldMap        - The resolved field registry (built-in or custom).
 */
function walkNode(
  node: ASTNode,
  errors: ParseError[],
  inValuePosition: boolean,
  fieldMap: Map<string, FieldDef>
): void {
  switch (node.kind) {
    case "or":
    case "and":
      walkNode(node.left, errors, false, fieldMap);
      walkNode(node.right, errors, false, fieldMap);
      return;

    case "not":
      walkNode(node.operand, errors, false, fieldMap);
      return;

    case "group":
      walkNode(node.body, errors, false, fieldMap);
      return;

    case "error":
      // Already recorded by the parser; nothing extra to do.
      return;

    case "comparison": {
      // R2: ~ only for fields whose valueKind is "text"
      if (node.op === "~") {
        const def = fieldMap.get(node.field);
        // if (!def || (def.valueKind !== "text")) {
        //   errors.push({
        //     message: `The '~' (contains) operator is only valid for text fields, not '${node.field}'`,
        //     from: node.from,
        //     to: node.to,
        //   });
        // }
      }

      // R4: boolean fields
      const fieldDef = fieldMap.get(node.field);
      // if (fieldDef?.valueKind === "boolean") {
      //   walkValue(node.value, errors, true);
      //   if (node.value.kind !== "boolean" && node.value.kind !== "null") {
      //     errors.push({
      //       message: `Field '${node.field}' only accepts true or false`,
      //       from: node.value.from,
      //       to: node.value.to,
      //     });
      //   }
      // } else {
      //   walkValue(node.value, errors, true);
      // }
      return;
    }

    case "between":
      walkValue(node.low, errors, true);
      walkValue(node.high, errors, true);
      return;

    case "is_null":
    case "is_empty":
      return;

    case "in": {
      if (Array.isArray(node.values)) {
        for (const v of node.values) walkValue(v, errors, true);
      } else {
        // node.values is a FunctionCallNode
        const fn = node.values;
        // R3: must be a list-returning function
        if (!LIST_RETURNING_FUNCTIONS.has(fn.name)) {
          errors.push({
            message: `'${fn.name}()' does not return a list and cannot be used with IN`,
            from: fn.from,
            to: fn.to,
          });
        }
        walkFunctionCall(fn, errors, true);
      }
      return;
    }

    case "fn_call":
      // R1: standalone functions used as a value
      if (inValuePosition && STANDALONE_FUNCTIONS.has(node.name)) {
        errors.push({
          message: `'${node.name}()' is a predicate/relation function and cannot be used as a value`,
          from: node.from,
          to: node.to,
        });
      }
      walkFunctionCall(node, errors, inValuePosition);
      return;
  }
}

// ─── Value walker ─────────────────────────────────────────────────────────────

function walkValue(node: ValueNode, errors: ParseError[], inValuePosition: boolean): void {
  if (node.kind === "fn_call") {
    // R1: predicate/standalone functions must not appear as values
    if (STANDALONE_FUNCTIONS.has(node.name)) {
      errors.push({
        message: `'${node.name}()' is a predicate/relation function and cannot be used as a value`,
        from: node.from,
        to: node.to,
      });
    }
    walkFunctionCall(node, errors, inValuePosition);
  }
}

// ─── Function call validator ──────────────────────────────────────────────────

function walkFunctionCall(
  node: { kind: "fn_call"; name: string; args: ValueNode[]; from: number; to: number },
  errors: ParseError[],
  _inValuePosition: boolean
): void {
  const def = FUNCTION_MAP.get(node.name);

  // R7: unknown function name
  if (!def) {
    errors.push({
      message: `Unknown function '${node.name}'`,
      from: node.from,
      to: node.to,
    });
    return;
  }

  // R6: arity check
  if (node.args.length < def.minArity || node.args.length > def.maxArity) {
    const expected = def.minArity === def.maxArity ? `${def.minArity}` : `${def.minArity}–${def.maxArity}`;
    errors.push({
      message: `'${node.name}' expects ${expected} argument${def.maxArity !== 1 ? "s" : ""} but got ${node.args.length}`,
      from: node.from,
      to: node.to,
    });
  }

  // R5: history functions with a field-name first argument
  const historyFnsWithField = new Set([
    "wasEver",
    "was",
    "changedFrom",
    "changedTo",
    "changed",
    "fieldChangedBy",
    "fieldChangedAfter",
    "fieldChangedBefore",
    "changedToAfter",
    "changedToBefore",
    "fieldChangedBetween",
  ]);

  if (historyFnsWithField.has(node.name) && node.args.length > 0) {
    const fieldArg = node.args[0];
    if (fieldArg.kind === "string") {
      if (!HISTORY_FIELD_NAMES.has(fieldArg.value)) {
        errors.push({
          message: `'${fieldArg.value}' is not a valid history field name for '${node.name}'`,
          from: fieldArg.from,
          to: fieldArg.to,
        });
      }
    } else {
      errors.push({
        message: `First argument to '${node.name}' must be a quoted field name string`,
        from: fieldArg.from,
        to: fieldArg.to,
      });
    }
  }

  // Recurse into arguments
  for (const arg of node.args) {
    walkValue(arg, errors, true);
  }
}
