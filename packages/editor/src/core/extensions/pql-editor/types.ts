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

import type { LucideIcon } from "lucide-react";
import type { Content, JSONContent } from "@tiptap/core";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import type { IFilterConfig } from "@plane/shared-state";
import type { IFilterOption, TFilterProperty, TFilterValue } from "@plane/types";

// ─── Token kinds ──────────────────────────────────────────────────────────────

export enum TokenKind {
  // Keywords (case-insensitive)
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  IN = "IN",
  NOT_IN = "NOT_IN",
  IS = "IS",
  NULL_KW = "NULL_KW",
  EMPTY_KW = "EMPTY_KW",
  BETWEEN = "BETWEEN",
  TRUE_KW = "TRUE_KW",
  FALSE_KW = "FALSE_KW",
  // Comparison operators
  EQ = "EQ", // =
  NEQ = "NEQ", // !=
  GTE = "GTE", // >=
  GT = "GT", // >
  LTE = "LTE", // <=
  LT = "LT", // <
  TILDE = "TILDE", // ~
  // Punctuation
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  COMMA = "COMMA",
  // Literals
  STRING = "STRING",
  INTEGER = "INTEGER",
  FLOAT = "FLOAT",
  // Classified identifiers
  FIELD = "FIELD",
  FN_PREDICATE = "FN_PREDICATE",
  FN_DATE = "FN_DATE",
  FN_USER = "FN_USER",
  FN_CYCLE = "FN_CYCLE",
  FN_STATE = "FN_STATE",
  FN_RELATION = "FN_RELATION",
  FN_HISTORY = "FN_HISTORY",
  // ORDER BY / LIMIT clause keywords
  ORDER = "ORDER",
  BY = "BY",
  LIMIT = "LIMIT",
  ASC = "ASC",
  DESC = "DESC",
  // Unknown identifier (will be flagged by validator)
  IDENTIFIER = "IDENTIFIER",
  // Unrecognized character sequence
  ERROR = "ERROR",
  // Inline pqlValue node placeholder (U+0001 sentinel emitted by the highlighter)
  PQL_VALUE_NODE = "PQL_VALUE_NODE",
  // Inline pqlCustomPropertyField node placeholder (U+0002 sentinel emitted by the highlighter).
  // Token value is patched to the field's identifier (e.g. "customproperty_abc123") after tokenization.
  CUSTOM_PROPERTY_FIELD_NODE = "CUSTOM_PROPERTY_FIELD_NODE",
  // Sentinel
  EOF = "EOF",
}

export type Token = {
  kind: TokenKind;
  /** Raw text as it appears in the source */
  value: string;
  /** Inclusive character offset in the source string */
  from: number;
  /** Exclusive character offset in the source string */
  to: number;
};

// ─── Comparison operator type ─────────────────────────────────────────────────

export type CompOp = "=" | "!=" | ">" | ">=" | "<" | "<=" | "~";

// ─── Field definition types ───────────────────────────────────────────────────
// Defined here (not in grammar.ts) so PQLEditorProps can reference FieldDef
// without creating a circular dependency (grammar.ts already imports from types.ts).

export type FieldDef = {
  name: string;
  value: TFilterProperty;
  icon: React.FC<ISvgIcons> | LucideIcon;
  description: string;
  /** Comparison operators valid for this field (=, !=, >, …) */
  allowedOps: IFilterConfig<TFilterProperty>["pqlSupportedOperators"];
};

// ─── AST node types ───────────────────────────────────────────────────────────

export type ASTNode =
  | OrNode
  | AndNode
  | NotNode
  | GroupNode
  | ComparisonNode
  | BetweenNode
  | IsNullNode
  | IsEmptyNode
  | InNode
  | FunctionCallNode
  | ErrorNode;

export type OrNode = {
  kind: "or";
  left: ASTNode;
  right: ASTNode;
  from: number;
  to: number;
};

export type AndNode = {
  kind: "and";
  left: ASTNode;
  right: ASTNode;
  from: number;
  to: number;
};

export type NotNode = {
  kind: "not";
  operand: ASTNode;
  from: number;
  to: number;
};

export type GroupNode = {
  kind: "group";
  body: ASTNode;
  from: number;
  to: number;
};

export type ComparisonNode = {
  kind: "comparison";
  field: string;
  op: CompOp;
  value: ValueNode;
  from: number;
  to: number;
};

export type BetweenNode = {
  kind: "between";
  field: string;
  low: ValueNode;
  high: ValueNode;
  from: number;
  to: number;
};

export type IsNullNode = {
  kind: "is_null";
  field: string;
  negated: boolean;
  from: number;
  to: number;
};

export type IsEmptyNode = {
  kind: "is_empty";
  field: string;
  negated: boolean;
  from: number;
  to: number;
};

export type InNode = {
  kind: "in";
  field: string;
  negated: boolean;
  /** Either an explicit list of values or a list-returning function call */
  values: ValueNode[] | FunctionCallNode;
  from: number;
  to: number;
};

export type FunctionCallNode = {
  kind: "fn_call";
  name: string;
  args: ValueNode[];
  from: number;
  to: number;
};

export type ErrorNode = {
  kind: "error";
  message: string;
  from: number;
  to: number;
};

// ─── Value node types (right-hand side values) ────────────────────────────────

export type ValueNode = StringValueNode | NumberValueNode | BooleanValueNode | NullValueNode | FunctionCallNode;

export type StringValueNode = {
  kind: "string";
  /** The unquoted string value */
  value: string;
  from: number;
  to: number;
};

export type NumberValueNode = {
  kind: "number";
  value: number;
  from: number;
  to: number;
};

export type BooleanValueNode = {
  kind: "boolean";
  value: boolean;
  from: number;
  to: number;
};

export type NullValueNode = {
  kind: "null";
  from: number;
  to: number;
};

// ─── Parse result ─────────────────────────────────────────────────────────────

export type ParseError = {
  message: string;
  from: number;
  to: number;
};

export type ParseResult = {
  ast: ASTNode | null;
  errors: ParseError[];
  isValid: boolean;
};

// ─── Autocomplete types ───────────────────────────────────────────────────────

export type SuggestionKind = "field" | "operator" | "value" | "function" | "keyword";

/**
 * Controls what is appended to the editor immediately after a text suggestion
 * is inserted.  Only applies to `insertText` suggestions; `insertNode`
 * suggestions handle their own trailing content.
 *
 * - `"none"`       → nothing is appended (cursor stays right after the text)
 * - `"whitespace"` → a single space is appended
 * - `"double-quotes"` → opening and closing double quotes are appended
 * - `"brackets"`    → opening and closing brackets are appended (used by IN / NOT IN to open the value list)
 */
export type AppendCharacter = "none" | "whitespace" | "double-quotes" | "brackets";

export type Suggestion = {
  kind: SuggestionKind;
  label: string;
  i18n_description?: string;
  /**
   * When true the cursor should be placed inside the parentheses after the text
   * is inserted (used for n-arity functions that still need arguments, e.g.
   * `membersOf(`).  False / absent means the insertion is already a complete
   * value (e.g. `workspaceMembers()`).
   */
  insertCursorInsideParens?: boolean;
  /**
   * Number of characters to shift the cursor backwards after the text is inserted.
   * Use this when the insertText ends with a closing delimiter that the cursor
   * should sit inside (e.g. insertText = '= ""', cursorShift = 1 puts the cursor
   * between the quotes).
   */
  cursorShift?: number;
  sortOrder: number;
  icon?: React.FC<ISvgIcons> | LucideIcon;
  iconNode?: React.ReactNode;
} & (
  | {
      /** Raw text inserted on accept — no trailing characters baked in. */
      insertText: string;
      /**
       * Required for all text suggestions.  Declares what (if anything) is
       * appended after `insertText` so each suggestion is self-describing and
       * the insertion logic in `applyInsertSuggestion` never hard-codes trailing
       * characters.
       */
      appendCharacter: AppendCharacter;
    }
  | {
      insertNode: { type: "value"; option: IFilterOption<TFilterValue> };
    }
  | {
      insertNode: { type: "customPropertyField"; field: FieldDef };
    }
);

export type SuggestionContextKind =
  | "START"
  | "AFTER_FIELD"
  | "AFTER_OPERATOR"
  | "AFTER_IN" // cursor is right after '(' — first value position, no comma needed
  | "AFTER_IN_NO_BRACKET" // cursor is after IN/NOT IN with no '(' yet — auto-inserts '(' on value select
  | "AFTER_IN_VALUE" // cursor is right after a value (chip, quoted string, or function result) with no trailing comma
  | "AFTER_IN_COMMA" // cursor is right after a ',' — comma already present, just insert value
  | "AFTER_IS"
  | "AFTER_BETWEEN"
  | "AFTER_BETWEEN_AND"
  | "AFTER_CONDITION"
  | "AFTER_ORDER_BY"
  | "AFTER_ORDER_FIELD"
  | "AFTER_SORT_DIR"
  | "AFTER_LIMIT";

export type SuggestionContext = {
  kind: SuggestionContextKind;
  /** The field whose value we are completing (when applicable) */
  field?: string;
  /** The comparison operator (when applicable) */
  op?: CompOp;
  /** Character position of the start of the current token (for replacement range) */
  tokenStart?: number;
};

export type DropdownState = {
  isOpen: boolean;
  activeIndex: number;
  suggestions: Suggestion[];
};

// ─── PQL Editor component types ───────────────────────────────────────────────

export type PQLEditorHandle = {
  blur: () => void;
  clearAll: (args?: { triggerUpdate?: boolean; triggerSubmit?: boolean; preserveFocus?: boolean }) => void;
  focus: () => void;
  getParseResult: () => ParseResult | null;
  getValue: () => string;
  setValue: (value: string) => void;
};

export type PQLEditorProps = {
  autoFocus?: boolean;
  /** Wrapper element class name */
  className?: string;
  /** When true, disables the submit button */
  disableSubmit?: boolean;
  /** When true, hides the submit button and disables the Enter key submit shortcut */
  hideSubmit?: boolean;
  editable: boolean;
  /** Inner contenteditable element class name */
  editorClassName?: string;
  fieldDefs: FieldDef[];
  isSubmitting?: boolean;
  onChange?: (value: { json: JSONContent; text: string }) => void;
  onSubmit?: (value: { json: JSONContent; text: string }) => Promise<void>;
  placeholder?: string;
  value: Content;
};
