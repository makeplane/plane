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

import { FIELD_ALIASES, SORTABLE_FIELDS } from "@/extensions/pql-editor/plugins/grammar";
import { indexAfterFilterExpr, parseOrderLimitTail } from "@/extensions/pql-editor/plugins/order-limit-clauses";
import type { PqlOrderBySpec } from "@/extensions/pql-editor/plugins/order-limit-clauses";
import { tokenize } from "@/extensions/pql-editor/plugins/lexer";
import { parse } from "@/extensions/pql-editor/plugins/parser";
import { validate } from "@/extensions/pql-editor/plugins/validator";
import type { FieldDef, ParseError } from "@/extensions/pql-editor/types";

/** When {@link parsePQL} runs without `fieldDefs`, ORDER BY fields must match this (single identifier token). */
const AGNOSTIC_ORDER_BY_FIELD = /^[A-Za-z_][A-Za-z0-9_]*$/;

export type ParsePQLOrderByAndLimitResult = {
  isValid: boolean;
  errors: ParseError[];
  /** Internal keys when the name appears in {@link FIELD_ALIASES}; otherwise the raw field token. DESC sorts use a `-` prefix. */
  orderBy?: string[];
  /** Positive integer from LIMIT. Omitted when absent or query invalid. */
  limit?: number;
};

function specsToOrderByStrings(specs: PqlOrderBySpec[]): string[] {
  return specs.map(({ field, desc }) => {
    const internal = Object.hasOwn(SORTABLE_FIELDS, field) ? SORTABLE_FIELDS[field] : field;
    return desc ? `-${internal}` : internal;
  });
}

function collectAgnosticOrderByErrors(orderSpecs: PqlOrderBySpec[]): ParseError[] {
  const out: ParseError[] = [];
  for (const spec of orderSpecs) {
    if (!AGNOSTIC_ORDER_BY_FIELD.test(spec.field)) {
      out.push({
        message: "ORDER BY expects a single identifier (letters, digits, underscore)",
        from: 0,
        to: 0,
      });
      return out;
    }
  }
  return out;
}

/**
 * Parses and validates a PQL string.
 *
 * **With `fieldDefs`:** same behaviour as the PQL editor — lexer, parser, and semantic validation
 * use your field registry.
 *
 * **Without `fieldDefs`:** the lexer recognises built-in names from {@link FIELD_ALIASES} in the
 * filter body; ORDER BY accepts any single identifier per sort key (not restricted to your
 * registry). Each key is mapped through reversed {@link FIELD_ALIASES} when present, otherwise kept
 * as written. DESC sort keys are prefixed with `-`.
 */
export function parsePQLOrderByAndLimit(query: string, fieldDefs?: FieldDef[]): ParsePQLOrderByAndLimitResult {
  const hasFieldDefs = !!fieldDefs?.length;
  const fieldValues = hasFieldDefs
    ? new Set(fieldDefs.map((f) => f.value))
    : new Set<string>(Object.values(FIELD_ALIASES));

  const tokens = tokenize(query, fieldValues);
  const defs = fieldDefs ?? [];
  const parseResult = parse(tokens, defs);

  const validationErrors = hasFieldDefs
    ? validate(parseResult.ast, new Map(defs.map((f) => [f.value, f])))
    : validate(parseResult.ast, new Map());

  const errors: ParseError[] = [...parseResult.errors, ...validationErrors];
  const baseOk = errors.length === 0;

  const tailStart = indexAfterFilterExpr(tokens);
  const { orderSpecs, limit } = parseOrderLimitTail(tokens, tailStart);

  if (!hasFieldDefs && baseOk) {
    errors.push(...collectAgnosticOrderByErrors(orderSpecs));
  }

  const isValid = errors.length === 0;
  if (!isValid) {
    return { isValid, errors };
  }

  const result: ParsePQLOrderByAndLimitResult = { isValid, errors };
  if (orderSpecs.length > 0) result.orderBy = specsToOrderByStrings(orderSpecs);
  if (limit !== undefined) result.limit = limit;
  return result;
}
