# PQL Editor — Design & Implementation Reference

A technical reference for the PQL (Plane Query Language) editor built on Tiptap/ProseMirror.

---

## Table of Contents

- [Overview](#overview)
- [Formal Grammar (EBNF)](#formal-grammar-ebnf)
- [Token Taxonomy & Highlighting](#token-taxonomy--highlighting)
- [Package Structure](#package-structure)
- [Architecture](#architecture)
  - [Document Schema](#document-schema)
  - [Data Flow](#data-flow)
  - [Lexer](#lexer)
  - [Parser](#parser)
  - [Semantic Validator](#semantic-validator)
  - [Highlighter Plugin](#highlighter-plugin)
  - [Autocomplete Plugin](#autocomplete-plugin)
  - [Keymap Plugin](#keymap-plugin)
  - [Tiptap Extension](#tiptap-extension)
  - [Inline Node Extensions](#inline-node-extensions)
- [React Component API](#react-component-api)
- [Autocomplete Design](#autocomplete-design)
- [Error Handling](#error-handling)
- [Styling](#styling)
- [Exports](#exports)
- [Design Decisions](#design-decisions)

---

## Overview

The `PQLEditor` is a dedicated query-language editor that lives inside `packages/editor`. It provides:

- **Rich syntax highlighting** via a custom ProseMirror decoration plugin
- **Inline error markers** (red squiggle underlines) driven by a full recursive-descent parser
- **Context-aware autocomplete** for fields, operators, functions, and known enum values
- **Inline value chips** — `pqlValue` and `pqlCustomPropertyField` atom nodes that render as styled pills but serialize to plain PQL strings
- A **formal EBNF grammar** that is the single source of truth for the lexer, parser, and future tooling

This is **not** a document editor. It is a multi-line query input — conceptually identical to Jira's JQL editor.

---

## Formal Grammar (EBNF)

### Terminal Symbols (Tokens)

```ebnf
(* ── Whitespace ─────────────────────────────────────── *)
WS              ::= ( ' ' | '\t' | '\r' | '\n' )+           (* skip *)

(* ── Keywords (case-insensitive) ───────────────────── *)
AND             ::= [Aa][Nn][Dd]
OR              ::= [Oo][Rr]
NOT             ::= [Nn][Oo][Tt]
IN              ::= [Ii][Nn]
NOT_IN          ::= NOT WS+ IN                               (* collapsed to single token by lexer *)
IS              ::= [Ii][Ss]
NULL_KW         ::= [Nn][Uu][Ll][Ll]
EMPTY_KW        ::= [Ee][Mm][Pp][Tt][Yy]
BETWEEN         ::= [Bb][Ee][Tt][Ww][Ee][Ee][Nn]
TRUE_KW         ::= [Tt][Rr][Uu][Ee]
FALSE_KW        ::= [Ff][Aa][Ll][Ss][Ee]

(* ── Comparison operators ───────────────────────────── *)
EQ              ::= '='
NEQ             ::= '!='
GTE             ::= '>='
GT              ::= '>'
LTE             ::= '<='
LT              ::= '<'
TILDE           ::= '~'

(* ── Punctuation ────────────────────────────────────── *)
LPAREN          ::= '('
RPAREN          ::= ')'
COMMA           ::= ','

(* ── Literals ──────────────────────────────────────── *)
STRING          ::= '"' [^"\n]* '"'
               | "'" [^'\n]* "'"
FLOAT           ::= '-'? [0-9]+ '.' [0-9]+
INTEGER         ::= '-'? [0-9]+
IDENTIFIER      ::= [a-zA-Z_] [a-zA-Z0-9_]*

(* ── Inline node sentinels (used internally by the editor) ── *)
PQL_VALUE_NODE              ::= U+0001   (* pqlValue atom chip *)
CUSTOM_PROPERTY_FIELD_NODE  ::= U+0002   (* pqlCustomPropertyField atom chip *)
```

**Keyword disambiguation:** `IDENTIFIER` is the base token type. The lexer immediately classifies identifiers against three ordered lists: keywords, field names, and function names. Keyword matching is case-insensitive; field and function names are case-sensitive camelCase.

**`NOT_IN` collapsing:** When the lexer encounters `NOT` immediately followed by `IN` (with optional whitespace), it collapses both into a single `NOT_IN` compound-operator token. This means the highlighter applies the `operator` colour to the entire `NOT IN` phrase and the autocomplete plugin only needs to look for one token kind.

### Non-terminal Rules

```ebnf
(* ── Top level ──────────────────────────────────────── *)
query           ::= expr EOF

(* ── Logical expression (handles precedence) ────────── *)
expr            ::= or_expr
or_expr         ::= and_expr  ( OR  and_expr  )*
and_expr        ::= not_expr  ( AND not_expr  )*
not_expr        ::= NOT not_expr
               | primary

(* ── Primary ────────────────────────────────────────── *)
primary         ::= LPAREN expr RPAREN
               | function_call       (* predicate, relation, or history *)
               | comparison

(* ── Comparison ─────────────────────────────────────── *)
comparison      ::= field_name BETWEEN value AND value
               | field_name IS NOT? ( NULL_KW | EMPTY_KW )
               | field_name NOT_IN  ( value_list | function_call )
               | field_name NOT?  IN  ( value_list | function_call )
               | field_name comp_op value

comp_op         ::= EQ | NEQ | GTE | GT | LTE | LT | TILDE

field_name      ::= FIELD                (* any token classified as FIELD by the lexer *)
               | CUSTOM_PROPERTY_FIELD_NODE  (* inline chip for custom properties *)

(* ── Values ─────────────────────────────────────────── *)
value           ::= STRING | FLOAT | INTEGER | TRUE_KW | FALSE_KW | NULL_KW
               | function_call
               | PQL_VALUE_NODE          (* inline value chip *)

value_list      ::= LPAREN value ( COMMA value )* RPAREN

(* ── Function calls ─────────────────────────────────── *)
function_call   ::= IDENTIFIER LPAREN arg_list? RPAREN
arg_list        ::= value ( COMMA value )*
```

### Semantic Validation Rules

These rules are enforced by the post-parse validator, not the grammar:

| Rule | Description |
|------|-------------|
| **R1 — No predicate as value** | Predicate functions (`isOverdue`, `hasChildren`, etc.) must appear only as a standalone `primary`, never on the RHS of an operator or inside `value_list` |
| **R2 — Contains operator field** | `~` is only valid for `name` and `text` fields |
| **R3 — IN list-only functions** | RHS of `IN` / `NOT IN` must be a `value_list` or one of the list-returning functions (`openStates`, `closedStates`, `activeStates`, `activeCycle`, `completedCycles`, `upcomingCycles`) |
| **R4 — Boolean fields** | `isDraft` and `isArchived` only accept `true`/`false` or `IS NULL`/`IS NOT NULL` |
| **R5 — History field names** | First argument to history functions must be a valid history field name |
| **R6 — Arity** | Each function must be called with the correct number of arguments |
| **R7 — Unknown identifiers** | Any bare identifier that is not a known field or function name is an error |

---

## Token Taxonomy & Highlighting

The lexer classifies every character sequence into one of these `TokenKind` values. The highlighter maps them to five CSS decoration classes:

| TokenKind(s) | CSS class suffix | Purpose |
|---|---|---|
| `AND`, `OR`, `NOT` | `logical` | Logical connectors |
| `EQ`, `NEQ`, `GTE`, `GT`, `LTE`, `LT`, `TILDE`, `IN`, `NOT_IN`, `IS`, `BETWEEN` | `operator` | Comparison + structural operators |
| `FIELD`, `CUSTOM_PROPERTY_FIELD_NODE` | `field` | Field names and custom property chips |
| `FN_PREDICATE`, `FN_DATE`, `FN_USER`, `FN_CYCLE`, `FN_STATE`, `FN_RELATION`, `FN_HISTORY` | `function` | All function call keywords |
| `LPAREN`, `RPAREN`, `COMMA` | `punctuation` | Structural punctuation |
| `IDENTIFIER`, `ERROR` | `error` | Unknown identifiers and lexer errors |
| `STRING`, `INTEGER`, `FLOAT`, `TRUE_KW`, `FALSE_KW`, `NULL_KW`, `EMPTY_KW` | *(none)* | Values render in the default text colour |

---

## Package Structure

```
packages/editor/src/
├── core/
│   ├── extensions/
│   │   └── pql-editor/
│   │       ├── index.ts                  # Barrel — re-exports extension, utils, + types
│   │       ├── types.ts                  # All TypeScript types and interfaces
│   │       ├── extension.ts              # Tiptap Extension.create() wrapper
│   │       ├── plugins/
│   │       │   ├── grammar.ts            # FIELD_ALIASES, FUNCTION_DEFS, KEYWORD_MAP, etc.
│   │       │   ├── lexer.ts              # tokenize(input, fieldValues) → Token[]
│   │       │   ├── parser.ts             # parse(tokens) → { ast, errors }
│   │       │   ├── validator.ts          # validate(ast, fieldMap) → ValidationError[]
│   │       │   ├── token-utils.ts        # Shared classification helpers
│   │       │   ├── highlighter-plugin.ts # ProseMirror plugin — DecorationSet
│   │       │   ├── autocomplete-plugin.ts# ProseMirror plugin — cursor context + callbacks
│   │       │   └── keymap-plugin.ts      # ProseMirror plugin — Tab/Enter/Escape
│   │       ├── value/
│   │       │   ├── extension.tsx         # PQLValueExtension (inline value chip node)
│   │       │   ├── node-view.tsx         # React node view for the value chip
│   │       │   └── types.ts              # PQLValueExtensionAttributes
│   │       └── custom-property-field/
│   │           ├── extension.tsx         # PQLCustomPropertyFieldExtension (inline field chip)
│   │           ├── node-view.tsx         # React node view for the field chip
│   │           ├── types.ts              # PQLCustomPropertyFieldExtensionAttributes
│   │           └── utils.ts              # isCustomPropertyField, extractCustomPropertyFieldId
│   ├── hooks/
│   │   └── use-pql-editor.ts             # usePQLEditor hook (Tiptap setup + suggestion logic)
│   ├── utils/
│   │   └── pql-suggestions.ts            # computeAllSuggestions, applyInsertSuggestion, etc.
│   └── components/
│       └── editors/
│           └── pql/
│               ├── editor.tsx             # PQLEditorWithRef (main export)
│               ├── autocomplete-dropdown.tsx
│               └── error-tooltip.tsx
├── styles/
│   ├── index.css                         # (updated to @import pql-editor.css)
│   └── pql-editor.css                   # Token colors, error underlines, dropdown
```

---

## Architecture

### Document Schema

The PQL editor uses a minimal Tiptap schema — a plain-text base extended with two inline atom node types:

```
doc
└── paragraph
      ├── text nodes
      ├── pqlValue (atom)                  — value chip (renders as pill, serializes to "uuid")
      └── pqlCustomPropertyField (atom)    — custom field chip (renders as pill, serializes to cf["id"])
```

All rich-text marks (bold, italic, etc.) are disabled. All paste is normalised to plain text.

### Data Flow

```
User types
  │
  ▼
ProseMirror transaction (docChanged)
  │
  ├──► PQLHighlighterPlugin
  │       1. extractPQLSource(state) — traverse doc, replace atom chips with sentinels (\x01, \x02)
  │       2. tokens = tokenize(text, fieldValues)    [lexer.ts]
  │       3. Patch CUSTOM_PROPERTY_FIELD_NODE token values to real field identifiers
  │       4. { ast, errors } = parse(tokens)         [parser.ts]
  │       5. validationErrors = validate(ast, fieldMap)  [validator.ts]
  │       6. Build DecorationSet from tokens  (color spans per TokenKind → CSS class)
  │       7. Build DecorationSet from errors  (red wavy underlines)
  │       8. Store { tokens, ast, allErrors } in plugin state
  │       9. setTimeout → options.onParseResult({ ast, errors, isValid })
  │
  └──► PQLAutocompletePlugin
          1. Read cursor position from transaction
          2. Read tokens from PQLHighlighterPlugin state
          3. Run determineSuggestionContext(tokens, cursorCharPos)
          4. On view.update: compute anchor DOM coordinates via view.coordsAtPos()
          5. Call options.onContextChange({ editor, context, newAnchor })

React component (usePQLEditor hook)
  ├── Receives onParseResult (currently a no-op; stored for future use)
  └── Receives onContextChange → determines partial token and date context
                              → computeAllSuggestions(context, fieldDefs, fieldMap) [async]
                              → openDropdown(filtered, anchor) → setSuggestions / setAnchor / setShowDatePicker
```

### Lexer

A pure function: `tokenize(input: string, fieldValues: Set<string>): Token[]`

- Single pass with a `pos` cursor
- Tries patterns in descending priority:
  1. Whitespace → skip (no token emitted)
  2. Multi-char operators: `!=`, `>=`, `<=` (before single-char variants)
  3. Single-char operators: `=`, `>`, `<`, `~`
  4. Punctuation: `(`, `)`, `,`
  5. `pqlValue` sentinel `\x01` → `PQL_VALUE_NODE`
  6. `pqlCustomPropertyField` sentinel `\x02` → `CUSTOM_PROPERTY_FIELD_NODE`
  7. Quoted strings: `"..."` or `'...'` (handles EOF-before-close as error)
  8. Floats: `-?[0-9]+\.[0-9]+` (before integers to avoid partial match)
  9. Integers: `-?[0-9]+`
  10. Identifiers: `[a-zA-Z_][a-zA-Z0-9_]*` → then classify:
      - Case-insensitive match against keywords → `AND`, `OR`, `NOT`, etc.
      - When `NOT` is followed by `IN` → collapse both into a single `NOT_IN` compound token
      - Match against caller-supplied `fieldValues` set → `FIELD`
      - Match against function registry → `FN_PREDICATE` / `FN_DATE` / etc.
      - Otherwise → `IDENTIFIER` (unknown, will become `ERROR` in validator)
  11. Any other character → `ERROR` token covering exactly that one character

Always appends an `EOF` token at the end.

**Dynamic field classification:** The `fieldValues` parameter replaces the old built-in `FIELD_NAMES` constant. The caller (`PQLHighlighterPlugin`) builds this set from the `fieldDefs` prop, enabling custom and project-specific fields to be classified correctly.

### Parser

A recursive-descent parser: `parse(tokens: Token[]): ParseResult`

Directly implements the EBNF grammar. Uses a token-stream cursor with lookahead.

**Error recovery strategy:** On any unexpected token:
1. Record a `ParseError` with the token's `from`/`to` range
2. Advance past the bad token
3. Skip tokens until a synchronization point: `AND`, `OR`, `)`, or `EOF`
4. Return an `ErrorNode` and continue parsing

**Special cases handled explicitly:**
- `NOT IN` is now a single `NOT_IN` token emitted by the lexer, so no special parser handling is needed
- `IS NOT NULL` / `IS NOT EMPTY`: recognized as single constructs in `parseComparisonRHS`
- `BETWEEN val AND val`: the `AND` keyword is consumed as a separator inside `parseBetween`, not by the outer `parseAndExpr` loop

### Semantic Validator

A pure function: `validate(ast: ASTNode | null, fieldMap: Map<string, FieldDef>): ValidationError[]`

Walks the AST and enforces rules R1–R7. The `fieldMap` parameter enables field-specific validation (allowed operators, boolean-only fields, etc.) against the caller-provided field registry.

Returns `ValidationError[]` (same shape as `ParseError`). These are merged with parse errors for the highlighter plugin to decorate.

### Highlighter Plugin

A ProseMirror `Plugin` with a `DecorationSet` as its state.

**`extractPQLSource(state)`** — called before tokenisation to build the raw PQL string. It traverses the ProseMirror document and:
- Replaces each `pqlValue` atom with `\x01` (U+0001)
- Replaces each `pqlCustomPropertyField` atom with `\x02` (U+0002)
- Records a `customFieldOffsets: Map<number, string>` — offset → field identifier

This ensures every chip occupies exactly one character position, keeping char offsets consistent with ProseMirror positions (`pmOffset = 1`).

On every `docChanged` transaction:
1. `extractPQLSource(state)` → `{ text, customFieldOffsets }`
2. `tokenize(text, fieldValues)` → `Token[]`
3. Patch each `CUSTOM_PROPERTY_FIELD_NODE` token's `value` from `\x02` to the real field identifier
4. `parse(tokens)` → `{ ast, errors }`
5. `validate(ast, fieldMap)` → `ValidationError[]`
6. Build `Decoration.inline` spans for every token that has a CSS class in `TOKEN_CLASS`
7. Build `Decoration.inline` spans for every error (class `pql-error-underline`, with `data-pql-error` attr)
8. `setTimeout(0)` → `options.onParseResult(parseResult)` (avoids re-render during ProseMirror dispatch)

**TOKEN_CLASS mapping** — simplified to five categories: `logical`, `operator`, `field`, `function`, `punctuation`, `error`. All function kinds (`FN_DATE`, `FN_USER`, etc.) map to the same `"function"` class. Value tokens (`STRING`, `INTEGER`, etc.) are intentionally omitted — they render in the default text colour.

### Autocomplete Plugin

A ProseMirror `Plugin` (no visible state — purely reactive).

**Focus-gain detection:** `view.update` now tracks whether the editor just gained focus (`focusGained`). When it did, context is recomputed even if the doc and selection haven't changed, so the dropdown opens immediately on focus.

On every transaction that changes selection, document, or focus:
1. Gets current selection (`state.selection.from`)
2. Reads `{ tokens }` from the highlighter plugin's state
3. Calls `determineSuggestionContext(tokens, cursorCharPos)` to get a `SuggestionContext`
4. Computes anchor DOM coordinates via `view.coordsAtPos(selection.from)`
5. Calls `options.onContextChange({ editor, context, anchor })`

**Context determination table:**

| What's before the cursor | Context returned |
|--------------------------|-----------------|
| Start of input, or after `AND`/`OR`/`NOT`/`(` | `{ kind: "START" }` |
| After a valid `FIELD` or `CUSTOM_PROPERTY_FIELD_NODE` | `{ kind: "AFTER_FIELD", field }` |
| After `FIELD` + `=`/`!=`/`~`/`>`/`>=`/`<`/`<=` | `{ kind: "AFTER_OPERATOR", field, op }` |
| After `FIELD` + `IN` or `NOT_IN`, with `(` already typed | `{ kind: "AFTER_IN", field }` |
| After `FIELD` + `IN` or `NOT_IN`, no `(` yet | `{ kind: "AFTER_IN_NO_BRACKET", field }` |
| After `FIELD` + `IS` | `{ kind: "AFTER_IS", field }` |
| After `FIELD` + `BETWEEN` | `{ kind: "AFTER_BETWEEN", field }` |
| After `FIELD` + `BETWEEN` + value + `AND` | `{ kind: "AFTER_BETWEEN_AND", field }` |
| After a complete condition (value, `)`, predicate call, pqlValue chip) | `{ kind: "AFTER_CONDITION" }` |
| After `FIELD` + `IN` + `(` + value(s) + `,` | `{ kind: "AFTER_IN_COMMA", field }` |
| Cursor between `IN`/`NOT IN` and an upcoming `(` | `null` (no dropdown) |

**`AFTER_IN_NO_BRACKET`** is a new context introduced to handle the case where the user has typed `priority IN` but not the opening `(` yet. Selecting a value in this state auto-inserts `(` before the chip, then `, ` after it to leave an open list.

**`hasLParenAhead` detection:** If an `LPAREN` token exists at a position ≥ `cursorChar`, the cursor is being repositioned between `IN`/`NOT IN` and an already-typed `(`. No suggestions are shown to avoid confusion.

### Keymap Plugin

A ProseMirror `Plugin` that intercepts keyboard events.

`onSubmit` now receives `{ json: JSONContent; text: string }` instead of a plain string. `onDropdownAccept` receives the Tiptap `Editor` instance so it can call `applyInsertSuggestion` directly.

| Key | Action |
|-----|--------|
| `ArrowDown` | Move selection down in dropdown (if open) |
| `ArrowUp` | Move selection up in dropdown (if open) |
| `Tab` / `Enter` | Accept selected suggestion (if open); `Enter` without dropdown → `onSubmit` |
| `Escape` | Close dropdown (if open); else pass through |

### Tiptap Extension

`PQLEditorExtension` uses `Extension.create<PQLEditorExtensionOptions>()`:

```typescript
interface PQLEditorExtensionOptions {
  /** Field definitions for the lexer, highlighter, and autocomplete. */
  fieldDefs: FieldDef[];
  /** Called whenever the document changes with the latest parse result. */
  onParseResult: (result: ParseResult) => void;
  /** Called whenever the cursor moves; receives the editor instance and anchor coords. */
  onContextChange: (args: {
    editor: Editor;
    context: SuggestionContext | null;
    newAnchor: { top: number; left: number; bottom: number } | null;
  }) => void;
  /** Called when the user presses Enter with no dropdown open. */
  onSubmit?: (val: { json: JSONContent; text: string }) => void;
  /** Returns current dropdown state (avoids passing a React ref object). */
  getDropdownState: () => DropdownState;
  /** Move autocomplete selection up or down. */
  onDropdownNavigate: (direction: "up" | "down") => void;
  /** Accept the currently highlighted autocomplete item. */
  onDropdownAccept: (editor: Editor) => void;
  /** Close the autocomplete dropdown. */
  onDropdownClose: () => void;
}
```

It registers three plugins (`Highlighter`, `Autocomplete`, `Keymap`) via `addProseMirrorPlugins()` and passes `fieldDefs` down to the Highlighter.

### Inline Node Extensions

#### PQLValueExtension

A Tiptap `Node` extension (`name: "pqlValue"`) for inline value chips. When the user selects a dynamic value from the autocomplete (a state UUID, member UUID, label UUID, etc.), it is inserted as a `pqlValue` atom rather than raw text.

- **`renderText`** emits `"<uuid>" ` so `editor.getText()` returns a valid PQL string
- **`renderHTML`** serialises to `<span data-type="pqlValue">` for copy/paste
- **Node view** renders as a styled pill showing `option.label`
- **Command**: `editor.commands.insertPQLValue({ option })`

#### PQLCustomPropertyFieldExtension

A Tiptap `Node` extension (`name: "pqlCustomPropertyField"`) for inline custom property field chips. When the user selects a custom property field from the autocomplete, it is inserted as this atom.

- **`renderText`** emits `cf["<id>"]` for the raw PQL (the backend resolves this syntax)
- Custom property field identifiers follow the pattern `customproperty_<id>`
- **`extractCustomPropertyFieldId(value)`** strips the `customproperty_` prefix to obtain the raw ID
- **Node view** renders as a styled pill showing `field.name`
- **Command**: `editor.commands.insertPQLCustomPropertyField({ field })`

---

## React Component API

```typescript
// Main component (forwardRef wrapper)
export const PQLEditorWithRef: React.ForwardRefExoticComponent<
  PQLEditorProps & React.RefAttributes<PQLEditorHandle>
>

type PQLEditorProps = {
  autoFocus?: boolean;
  /** Wrapper element class name */
  className?: string;
  /** Whether the editor is editable */
  editable: boolean;
  /** Inner contenteditable element class name */
  editorClassName?: string;
  /**
   * Field definitions that drive the lexer, highlighter, and autocomplete.
   * Each FieldDef carries its name, internal value key, icon, description,
   * and an allowedOps map that includes async getOptions() for value suggestions.
   */
  fieldDefs: FieldDef[];
  /** Shows a loading spinner on the submit button */
  isSubmitting?: boolean;
  onChange?: (value: { json: JSONContent; text: string }) => void;
  onSubmit?: (value: { json: JSONContent; text: string }) => Promise<void>;
  placeholder?: string;
  /** Initial content (Tiptap Content — plain string or JSONContent) */
  value: Content;
}

interface PQLEditorHandle {
  blur: () => void;
  clearAll: (args?: { triggerUpdate?: boolean; triggerSubmit?: boolean; preserveFocus?: boolean }) => void;
  focus: () => void;
  getParseResult: () => ParseResult | null;
  getValue: () => string;
  setValue: (value: string) => void;
}
```

`PQLEditorProps` no longer includes `singleLine`, `readOnly`, or `error`. The editor is always multi-line. External API errors should be displayed by the consuming component. Field definitions and their operators are now encapsulated in `fieldDefs` rather than a separate `PQLSuggestionProvider`.

---

## Autocomplete Design

### Field Definitions (`fieldDefs`)

Fields are now injected at the component level via the `fieldDefs: FieldDef[]` prop. Each `FieldDef` contains:

```typescript
type FieldDef = {
  name: string;                   // Human-readable label (e.g. "Priority")
  value: TFilterProperty;         // Internal key used in PQL (e.g. "priority")
  icon: React.FC<ISvgIcons> | LucideIcon;
  description: string;
  allowedOps: IFilterConfig<TFilterProperty>["pqlSupportedOperators"];
};
```

`allowedOps` is a `Map<TAllAvailableOperatorsForDisplay, OperatorConfig>` where each `OperatorConfig` may include an async `getOptions()` method for `single_select`/`multi_select` operators.

### Static Suggestions (from grammar)

- **Fields**: all field names from `fieldDefs`, with custom properties inserting a `pqlCustomPropertyField` chip
- **Operators**: context-filtered from the active field's `allowedOps` map; text-type operators auto-wrap with `= ""` and set `cursorShift: 1`
- **Functions**: all active functions from `FUNCTION_DEFS` with their signatures

### Dynamic Suggestions (from `allowedOps`)

Value suggestions are resolved by calling `getOptions()` on the relevant operator config:

- `single_select` / `multi_select` operators → `getOptions()` → value chips (`insertNode: { type: "value", option }`)
- `date` / `date_range` operators → date function suggestions + date picker calendar panel
- `text`, `number`, `boolean` → no value suggestions (user types freely)

### Suggestion Types

`Suggestion` is a discriminated union:

```typescript
type Suggestion = BaseFields & (
  | { insertText: string; appendCharacter: AppendCharacter }
  | { insertNode: { type: "value"; option: IFilterOption<TFilterValue> } }
  | { insertNode: { type: "customPropertyField"; field: FieldDef } }
);

type AppendCharacter = "none" | "whitespace" | "bracket";
```

- `insertText` suggestions insert raw PQL text, then optionally append a space or ` (` bracket
- `insertNode` value suggestions insert a `pqlValue` chip atom
- `insertNode` customPropertyField suggestions insert a `pqlCustomPropertyField` chip atom

### `AFTER_IN_NO_BRACKET` selection handling

When the user accepts a value chip while in the `AFTER_IN_NO_BRACKET` context (typed `IN` but no `(` yet), `selectOption` automatically:
1. Inserts `(` before the chip
2. Inserts `, ` after the chip (leaving the list open for more values)

### Dropdown UX

- Rendered via `@floating-ui/react` (flip/shift/offset middleware) into a `FloatingPortal`
- `FloatingOverlay lockScroll` prevents background scroll while the dropdown is open
- Grouped sections with labels: "Fields", "Operators", "Values", "Functions", "Keywords"
- Date picker calendar panel (`@plane/propel/calendar`) shown alongside suggestions when context is a date operator
- `↑`/`↓` navigation, `↵`/`Tab` to accept, `Esc` to close
- Outside mousedown closes the dropdown
- `preventDefault` + `stopPropagation` on item `mousedown` keeps editor focus and prevents ProseMirror from re-consuming the event

---

## Error Handling

### Inline errors (from parser + validator)

- Applied as `Decoration.inline` with class `pql-error-underline`
- Error message stored in `data-pql-error` attribute on the decoration
- `PQLErrorTooltip` listens to `mouseover` on decorated spans and shows a floating tooltip

### External API errors

Displayed by the consuming component (no longer a built-in `error` prop).

---

## Styling

`packages/editor/src/styles/pql-editor.css` — imported by `index.css`.

Token colors map to five semantic CSS custom properties:

```css
:root {
  --pql-logical:    #a855f7;   /* purple  — AND, OR, NOT          */
  --pql-operator:   #3b82f6;   /* blue    — =, !=, IN, IS, …      */
  --pql-field:      #8b5cf6;   /* violet  — field names            */
  --pql-function:   #06b6d4;   /* cyan    — all function kinds     */
  --pql-punctuation:#9ca3af;   /* gray    — (, ), ,                */
  --pql-error:      #ef4444;   /* red     — errors + underlines    */
}
```

Values (strings, numbers, booleans, null/empty) render in the default foreground colour.

---

## Exports

### `packages/editor/src/index.ts` (app-level)

```typescript
export { PQLEditorWithRef } from "@/components/editors/pql"
export type { PQLEditorProps, PQLEditorHandle } from "@/components/editors/pql"
```

### `packages/editor/src/core/extensions/pql-editor/index.ts` (extension-level)

```typescript
export { PQLEditorExtension } from "./extension"
export type { PQLEditorExtensionOptions } from "./extension"

export { tokenize }                  from "./plugins/lexer"
export { parse }                     from "./plugins/parser"
export { validate }                  from "./plugins/validator"
export { determineSuggestionContext } from "./plugins/autocomplete-plugin"
export { PQL_HIGHLIGHTER_KEY }       from "./plugins/highlighter-plugin"
export { isFieldToken, isFunctionToken, isCompOp, isConditionEnd, tokenKindToCompOp }
                                     from "./plugins/token-utils"

export * from "./types"
export * from "./plugins/grammar"
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **`fieldDefs` injected at runtime** | The editor is workspace-agnostic. It cannot import project/member/cycle stores. The consuming app injects field definitions including async `getOptions()` callbacks. This replaces the old `PQLSuggestionProvider` pattern with a single, unified interface. |
| **`allowedOps` map replaces string arrays** | Operators carry full config (`type`, `getOptions`) that the autocomplete can use to decide what value suggestions to show and how to format them (e.g., text-type → auto-wrap with quotes). |
| **`NOT IN` collapsed in the lexer** | Collapsing to a single `NOT_IN` token eliminates the need for the parser to disambiguate `NOT` as a logical prefix vs. compound operator. The highlighter can colour the entire phrase uniformly without special-casing. |
| **Inline atom nodes (`pqlValue`, `pqlCustomPropertyField`)** | Raw UUID strings are visually indistinct. Atom chips show human-readable labels in the editor while `renderText` emits valid PQL, so the stored document is always round-trippable. |
| **Sentinel characters (\x01, \x02) for chip positions** | Each chip occupies exactly one ProseMirror position. Replacing chips with single sentinel chars before tokenisation keeps char offsets in the token stream in sync with PM positions (`pmOffset = 1`), avoiding off-by-one errors when computing decoration ranges. |
| **`AFTER_IN_NO_BRACKET` context** | Without this context, typing `priority IN` and selecting a value would insert the value without a surrounding `(…)`, producing invalid PQL. The dedicated context lets `selectOption` auto-insert the bracket structure transparently. |
| **`pql-suggestions.ts` utility module** | Suggestion computation logic is pure (no React hooks, no ProseMirror imports) so it can be tested in isolation and reused from multiple entry points without the hook. |
| **Floating UI for dropdown positioning** | Manual `fixed`-position math breaks when the editor is inside scroll containers, iframes, or transforms. Floating UI's `flip`/`shift` middleware handles all of these cases and updates the position on scroll automatically. |
| **Date picker panel in the dropdown** | Date fields require either a function (`daysAgo(7)`) or a specific ISO string. Embedding the calendar directly in the autocomplete dropdown eliminates the need for a separate date-picker modal and keeps the interaction fully keyboard-navigable. |
| **Lexer + Parser are pure functions** | Makes them independently unit-testable and reusable (standalone CLI, server-side validation preview, future LSP). The plugin just calls them on extracted text. |
| **Decoration-based highlighting, not schema marks** | PQL content is plain text — marks would be persisted in the document JSON. Decorations are ephemeral and re-computed on every change, which is correct for syntax highlighting. |
| **Three separate ProseMirror plugins** | Separation of concerns: the highlighter doesn't know about cursor; the autocomplete doesn't recompute decorations; the keymap doesn't tokenize. Communication happens via plugin state reading, not shared mutable state. |
| **`getDropdownState()` getter instead of React ref** | The keymap plugin reads dropdown state synchronously inside `handleKeyDown`. A getter function `() => dropdownStateRef.current` carries the same runtime semantics as a ref but avoids lint warnings about passing refs to non-React functions. |
| **Error recovery in the parser** | A broken query mid-edit must still get syntax highlighting and autocomplete for the valid parts. Without error recovery, a single missing quote breaks the entire editor experience. |
