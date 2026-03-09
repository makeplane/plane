# PQL Editor — Internals Reference

How every plugin, language tool, inline node extension, and React layer works, and how they connect to each other.

---

## Table of Contents

- [Big Picture](#big-picture)
- [Layer 1 — Language Tools (pure TypeScript)](#layer-1--language-tools-pure-typescript)
  - [Lexer (`lexer.ts`)](#lexer-lexerts)
  - [Parser (`parser.ts`)](#parser-parserts)
  - [Validator (`validator.ts`)](#validator-validatorts)
  - [Token Utils (`token-utils.ts`)](#token-utils-token-utilsts)
  - [Grammar Registry (`grammar.ts`)](#grammar-registry-grammarts)
- [Layer 2 — ProseMirror Plugins](#layer-2--prosemirror-plugins)
  - [PQLHighlighterPlugin](#pqlhighlighterplugin)
  - [PQLAutocompletePlugin](#pqlautocompleteplugin)
  - [PQLKeymapPlugin](#pqlkeymapplugin)
- [Layer 3 — Tiptap Extension (`extension.ts`)](#layer-3--tiptap-extension-extensionts)
- [Layer 3b — Inline Node Extensions](#layer-3b--inline-node-extensions)
  - [PQLValueExtension](#pqlvalueextension)
  - [PQLCustomPropertyFieldExtension](#pqlcustompropertyfieldextension)
- [Layer 4 — `usePQLEditor` Hook](#layer-4--usepqleditor-hook)
  - [Editor Setup](#editor-setup)
  - [Context Change Handler](#context-change-handler)
  - [Suggestion Pipeline](#suggestion-pipeline)
  - [Insertion Logic (`applyInsertSuggestion`)](#insertion-logic-applyinsertsuggestion)
  - [Option Selection Logic (`selectOption`)](#option-selection-logic-selectoption)
  - [Dropdown State Management](#dropdown-state-management)
- [Layer 5 — React Component (`pql/editor.tsx`)](#layer-5--react-component-pqlindextsx)
- [Layer 6 — React UI Components](#layer-6--react-ui-components)
  - [PQLAutocompleteDropdown](#pqlautocompletedropdown)
  - [PQLErrorTooltip](#pqlerrortooltip)
- [Data Flow Diagram](#data-flow-diagram)
- [Key Design Decisions](#key-design-decisions)
- [Common Gotchas](#common-gotchas)

---

## Big Picture

The editor is split into six layers. Each layer has a single responsibility and communicates with adjacent layers through narrow, well-typed interfaces.

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5 — React Component (PQLEditor)                          │
│  Composes usePQLEditor hook + renders EditorContent + dropdowns │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4 — usePQLEditor Hook                                    │
│  Tiptap setup, suggestion computation, ref synchronisation      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3 — Tiptap Extension (PQLEditorExtension)                │
│  Assembles the three ProseMirror plugins into one unit          │
├──────────────────┬──────────────────┬───────────────────────────┤
│  Highlighter     │  Autocomplete    │  Keymap                   │
│  Plugin          │  Plugin          │  Plugin                   │
│  (Layer 2)       │  (Layer 2)       │  (Layer 2)                │
├──────────────────┴──────────────────┴───────────────────────────┤
│  Layer 3b — Inline Node Extensions                              │
│  PQLValueExtension  ·  PQLCustomPropertyFieldExtension          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1 — Language Tools                                       │
│  tokenize  →  parse  →  validate  ·  token-utils                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Language Tools (pure TypeScript)

These are **stateless pure functions** with no ProseMirror or React dependency. They can be imported and run in any context — unit tests, server-side validation, CLI tools, etc.

### Lexer (`lexer.ts`)

**Entry point:** `tokenize(input: string, fieldValues: Set<string>): Token[]`

Converts a raw PQL string into a flat array of `Token` objects. Each token records:

| Field  | Type       | Meaning                               |
|--------|------------|---------------------------------------|
| `kind` | `TokenKind`| Category (FIELD, KEYWORD, STRING, …) |
| `value`| `string`   | Raw text as it appears in the source  |
| `from` | `number`   | Inclusive start character offset      |
| `to`   | `number`   | Exclusive end character offset        |

**`fieldValues` parameter:** Previously the lexer used a static `FIELD_NAMES` constant from `grammar.ts`. It now accepts a caller-supplied `Set<string>` of recognised field identifiers. The highlighter plugin builds this set from the `fieldDefs` prop at runtime, enabling custom and project-specific fields to be classified as `FIELD` tokens instead of `IDENTIFIER` (unknown).

**How it works — single pass:**

The lexer scans `input` character-by-character with a `pos` cursor. For each position it tries patterns in priority order:

1. **Whitespace** → skipped (no token emitted)
2. **Multi-char operators** (`!=`, `>=`, `<=`) — checked before single-char to prevent partial match
3. **Single-char operators** (`=`, `>`, `<`, `~`)
4. **Punctuation** (`(`, `)`, `,`)
5. **`pqlValue` sentinel** (`\x01`) → `PQL_VALUE_NODE` token
6. **`pqlCustomPropertyField` sentinel** (`\x02`) → `CUSTOM_PROPERTY_FIELD_NODE` token (value patched later by the highlighter to the real field identifier)
7. **Quoted strings** — reads until matching quote or newline; an unterminated string emits an `ERROR` token covering the partial text
8. **Numbers** — float tried before integer (needs the decimal point to disambiguate)
9. **Identifiers** — reads `[a-zA-Z_][a-zA-Z0-9_]*`, then classifies via `classifyIdentifier`:
   - Lower-cased match against `KEYWORD_MAP` → `AND`, `OR`, `NOT`, `IN`, `IS`, `BETWEEN`, `NULL`, `EMPTY`, `TRUE`, `FALSE`
   - When `NOT` is immediately followed by `IN` (with optional whitespace) → both are consumed and emitted as a single `NOT_IN` compound-operator token
   - Match against caller-supplied `fieldValues` set → `FIELD`
   - Match against `FUNCTION_TOKEN_KIND` map → `FN_PREDICATE`, `FN_DATE`, `FN_USER`, `FN_CYCLE`, `FN_STATE`, `FN_RELATION`, or `FN_HISTORY`
   - Otherwise → `IDENTIFIER` (unknown, will be flagged by the validator)
10. **Fallback** → one `ERROR` token for the unrecognised character

The array always ends with exactly one `EOF` token at the final position.

**`NOT_IN` collapsing:** After reading a `NOT` token, the lexer peeks ahead for whitespace followed by an identifier. If that identifier is `IN`, both tokens are discarded and a single `NOT_IN` token spanning the entire `NOT … IN` text is emitted. This means the highlighter and autocomplete only need to handle one token kind for the compound operator.

**Error tolerance:** The lexer never throws. Every character produces a token, even if that token is `ERROR`. This guarantees the highlighter and autocomplete can work on partial / malformed input.

---

### Parser (`parser.ts`)

**Entry point:** `parse(tokens: Token[]): ParseResult`

Converts the flat token array into an AST using recursive descent. Returns:

```ts
interface ParseResult {
  ast:     ASTNode | null;   // null for empty input
  errors:  ParseError[];     // { message, from, to }
  isValid: boolean;
}
```

**Grammar summary (simplified):**

```
query    = or_expr EOF
or_expr  = and_expr  ( OR  and_expr  )*
and_expr = not_expr  ( AND not_expr  )*
not_expr = NOT not_expr | primary

primary  = ( expr )
         | function_call
         | field BETWEEN value AND value
         | field IS [NOT] (NULL | EMPTY)
         | field [NOT_IN | (NOT)? IN] ( value_list | function_call )
         | field comp_op value
```

**Special parser cases:**

- **`NOT IN`** — the lexer now emits a single `NOT_IN` token, so the parser recognises it as a single operator token in `parseComparisonRHS`. No disambiguation is needed at the parser level.
- **`BETWEEN val AND val`** — the `AND` separator is consumed inside `parseBetween`, so the outer `parseAndExpr` loop never sees it.
- **Function calls** — syntactically identical whether standalone predicates or value arguments. The parser treats them all as `fn_call` nodes; semantic meaning is resolved by the validator.
- **`pqlValue` atom** — `PQL_VALUE_NODE` tokens are treated as string-like values in `parseValue`, allowing chips to appear anywhere a quoted string is valid.

**Error recovery:** When an unexpected token is encountered the parser:
1. Records a `ParseError` with the token's character range
2. Skips forward until it hits a synchronisation point (`AND`, `OR`, `)`, or `EOF`)
3. Returns an `ErrorNode` and continues parsing

---

### Validator (`validator.ts`)

**Entry point:** `validate(ast: ASTNode | null, fieldMap: Map<string, FieldDef>): ParseError[]`

The `fieldMap` parameter (new) enables field-specific validation — checking allowed operators, boolean-only field constraints, etc. — against the caller-supplied field registry rather than a static built-in list.

Walks the AST and enforces seven semantic rules:

| Rule | Description |
|------|-------------|
| R1 — No predicate as value | Predicate functions must only appear as standalone conditions |
| R2 — Contains field | `~` is only valid for `name` and `text` |
| R3 — IN list functions | RHS of `IN`/`NOT IN` must be a value list or a list-returning function |
| R4 — Boolean fields | `isDraft` / `isArchived` only accept `true`, `false`, or `IS NULL` |
| R5 — History field names | First arg to history functions must be a documented history field |
| R6 — Arity | Each function call must have the correct number of arguments |
| R7 — Unknown identifiers | Any bare `IDENTIFIER` is flagged |

Returns the same `ParseError[]` shape so errors from the parser and validator can be merged and treated uniformly.

---

### Token Utils (`token-utils.ts`)

A shared utility module extracted so that `autocomplete-plugin.ts` and `parser.ts` (and any future consumers) can import classification helpers without circular dependencies.

| Function | Returns `true` when… |
|---|---|
| `isFunctionToken(kind)` | Token is any `FN_*` variant |
| `isFieldToken(kind)` | Token is `FIELD` **or** `CUSTOM_PROPERTY_FIELD_NODE` |
| `isCompOp(kind)` | Token is a binary comparison operator (`=`, `!=`, `>`, etc.) |
| `isConditionEnd(kind)` | Token ends a complete value: literal, `RPAREN`, or `PQL_VALUE_NODE` |
| `tokenKindToCompOp(kind)` | Maps a comparison token kind to its `CompOp` string (`"="`, `"!="`, …) |

`isFieldToken` recognising `CUSTOM_PROPERTY_FIELD_NODE` is the key change that allows the autocomplete to treat custom property field chips the same as plain text field tokens when deriving suggestion context.

---

### Grammar Registry (`grammar.ts`)

A static data file consumed by the lexer, parser, validator, and suggestion utilities. Key exports:

- **`FIELD_ALIASES`** — maps internal filter property keys (`state_id`, `assignee_id`, …) to their PQL camelCase aliases (`state`, `assignee`, …). Mirrors the Python `FIELD_ALIASES` constant in the backend.
- **`HISTORY_FIELD_NAMES`** — set of valid history field names for R5 validation
- **`FUNCTION_DEFS`** — all active functions with `kind`, `minArity`, `maxArity`, `returnsList`, `isStandalone`, `i18n_description`, and `signature`. Many relation and history functions are currently commented out (pending backend implementation).
- **`FUNCTION_MAP`** — `Map<string, FunctionDef>` for O(1) name lookup
- **`FUNCTION_TOKEN_KIND`** — function name → the matching `FN_*` `TokenKind`
- **`LIST_RETURNING_FUNCTIONS`** — set of function names valid on the RHS of `IN`
- **`STANDALONE_FUNCTIONS`** — set of predicate / relation / history function names that cannot be used as values
- **`KEYWORD_MAP`** — lower-cased keyword string → `TokenKind`

**No `FIELD_DEFS` or `FIELD_NAMES`:** These no longer exist in `grammar.ts`. Field definitions are injected at runtime via the `fieldDefs` prop.

---

## Layer 2 — ProseMirror Plugins

Each plugin is a standard ProseMirror `Plugin`. They are independent of each other except that the Autocomplete Plugin **reads state from the Highlighter Plugin** via the `PQL_HIGHLIGHTER_KEY` plugin key.

### PQLHighlighterPlugin

**File:** `highlighter-plugin.ts`
**Key:** `PQL_HIGHLIGHTER_KEY`
**Plugin state type:** `HighlighterState`

```ts
interface HighlighterState {
  decorations: DecorationSet;   // applied to the editor DOM
  tokens:      Token[];         // shared with the Autocomplete Plugin
  parseResult: ParseResult;     // includes AST + merged errors
}
```

**`extractPQLSource(state)`** is called at the start of every `buildState` invocation. It traverses the ProseMirror document node-by-node:

- `text` nodes → appended as-is
- `pqlValue` atoms → replaced with `\x01` (U+0001, one char = one PM position)
- `pqlCustomPropertyField` atoms → replaced with `\x02` (U+0002) and their field identifier recorded in `customFieldOffsets: Map<charOffset, fieldIdentifier>`

After tokenisation, each `CUSTOM_PROPERTY_FIELD_NODE` token's `value` is patched from the sentinel `\x02` to the real field identifier (e.g. `"customproperty_abc123"`) so the autocomplete plugin can look the field up in `fieldMap`.

**Responsibilities:**

1. Run the full language pipeline (`extractPQLSource → tokenize → patch custom field tokens → parse → validate`) on every document change
2. Build a `DecorationSet` of inline spans from the token array using the `TOKEN_CLASS` map
3. Build a second set of inline spans for parser / validator errors (red wavy underline + `data-pql-error` attribute for tooltip)
4. Store the result in plugin state so other plugins can read tokens without re-tokenising
5. Notify the React component about the parse result via `setTimeout(() => onParseResult(...), 0)` — the `setTimeout` avoids calling React state setters inside a ProseMirror dispatch

**`TOKEN_CLASS` mapping:**

```
logical     → AND, OR, NOT
operator    → EQ, NEQ, GTE, GT, LTE, LT, TILDE, IN, NOT_IN, IS, BETWEEN
field       → FIELD, CUSTOM_PROPERTY_FIELD_NODE
function    → all FN_* kinds (unified class — no per-kind colours)
punctuation → LPAREN, RPAREN, COMMA
error       → IDENTIFIER, ERROR
(none)      → STRING, INTEGER, FLOAT, TRUE_KW, FALSE_KW, NULL_KW, EMPTY_KW
```

Values are intentionally undecorated — they render in the default foreground colour.

**`apply` optimisation:** The state is only recomputed when `tr.docChanged` is true. Selection-only changes do not re-run the language pipeline.

**Error deduplication:** `ERROR` tokens from the lexer already receive the red colour class. `buildDecorations` builds a set of `"from:to"` keys from lexer error tokens and skips any validator/parser error that falls on the same range to avoid double-decorating.

**Position offset:** ProseMirror's document model wraps the text in a `paragraph` node, so character offset `0` in the plain text corresponds to ProseMirror position `1`. Every decoration position is adjusted by `+1`.

---

### PQLAutocompletePlugin

**File:** `autocomplete-plugin.ts`
**Key:** `PQL_AUTOCOMPLETE_KEY`
**Plugin state type:** `null` (no state stored in ProseMirror)

**Responsibilities:**

1. After every document, selection, or focus change, determine the **suggestion context**
2. Compute viewport coordinates of the cursor (used to position the dropdown)
3. Call `onContextChange({ editor, context, anchor })` to hand off to React

**Two update paths:**

| Path | When it fires | Anchor passed |
|------|---------------|---------------|
| `view.update()` | Synchronously when the DOM view is updated (doc, selection, or focus change) | Valid `{top, left, bottom}` from `view.coordsAtPos()` |
| `state.apply` → `scheduleContextUpdate` | On any transaction that changes doc or selection, deferred via `setTimeout(0)` | `null` |

**Focus-gain detection:** `view.update` tracks `wasFocused` between calls. When `isFocused && !wasFocused` (focus just gained), context is recomputed even if doc and selection haven't changed — so the dropdown opens immediately on focus.

The `setTimeout(0)` path exists to handle cases where `view.update` isn't triggered. When the deferred call fires with `null` anchor, `openDropdown` in the hook only updates the anchor if the new value is non-null — so the null from the deferred path never clobbers a valid anchor set by `view.update`.

**Context determination — `determineSuggestionContext`:**

Collects tokens whose `to ≤ cursorChar` (fully before the cursor), then inspects the last 1–3 tokens:

| Last token(s) | Context returned |
|---------------|-----------------|
| Empty / start | `START` |
| `IDENTIFIER` or any `FN_*` with `last.to === cursorChar` | **Partial word** — strips partial, calls `contextFromPrecedingTokens` |
| `LPAREN` after IN-list pattern | `AFTER_IN` |
| `LPAREN` otherwise | `START` |
| `OR` / `NOT` | `START` |
| `FIELD` or `CUSTOM_PROPERTY_FIELD_NODE` | `AFTER_FIELD` |
| `FIELD IS` | `AFTER_IS` |
| `FIELD BETWEEN` | `AFTER_BETWEEN` |
| `FIELD NOT_IN` (no `(` yet) | `AFTER_IN_NO_BRACKET` |
| `FIELD IN` (no `(` yet) | `AFTER_IN_NO_BRACKET` |
| `COMMA` inside IN list | `AFTER_IN_COMMA` |
| `PQL_VALUE_NODE` inside IN list | `AFTER_IN_COMMA` |
| `PQL_VALUE_NODE` elsewhere | `AFTER_CONDITION` |
| `AND` (BETWEEN separator) | `AFTER_BETWEEN_AND` |
| `AND` (logical) | `START` |
| `FIELD comp_op` | `AFTER_OPERATOR` |
| String / number / RPAREN / bool / null | `AFTER_CONDITION` |

**`hasLParenAhead` check:** Before returning `AFTER_IN_NO_BRACKET` (or its partial-word equivalent), the plugin checks whether an `LPAREN` token exists at a position ≥ `cursorChar`. If it does, the cursor is somewhere between `IN`/`NOT IN` and an already-typed `(`, and the plugin returns `null` (no suggestions). This prevents confusing suggestions while the user repositions the cursor.

**`AFTER_IN_NO_BRACKET` context:** When the cursor is right after `IN` or `NOT IN` and no `(` has been typed yet, value suggestions are shown. On selection, `selectOption` auto-inserts `(` before the chip and `, ` after it.

**`findFieldForInList`** — walks backward through tokens with depth-tracking to skip over matched `RPAREN … LPAREN` pairs, finding the opening `LPAREN` of the current IN list. Without depth tracking, a query like `state IN (a, b) AND priority = c` with the cursor after `c` would incorrectly walk back through the closed list and return a stale field.

**`isBetweenAndSeparator`** — walks backward from the `AND` token tracking paren depth to skip function-call parens (e.g. the `()` in `today()`). Returns `true` if it finds `BETWEEN` before any unbalanced logical `AND`/`OR`.

---

### PQLKeymapPlugin

**File:** `keymap-plugin.ts`
**Key:** `PQL_KEYMAP_KEY`

Intercepts keyboard events through ProseMirror's `handleKeyDown` prop.

**Key routing table:**

| Key | Dropdown open? | Action |
|-----|---------------|--------|
| `ArrowDown` | Yes | `onDropdownNavigate("down")`, prevent default, return `true` |
| `ArrowDown` | No | return `false` (pass through) |
| `ArrowUp` | Yes | `onDropdownNavigate("up")`, prevent default, return `true` |
| `ArrowUp` | No | return `false` |
| `Tab` | Yes | `onDropdownAccept(editor)`, prevent default, return `true` |
| `Tab` | No | return `false` |
| `Enter` | Yes | `onDropdownAccept(editor)`, prevent default, return `true` |
| `Enter` | No | `onSubmit({ json, text })`, prevent default, return `true` if `onSubmit` provided |
| `Escape` | Yes | `onDropdownClose()`, prevent default, return `true` |
| `Escape` | No | return `false` |

`onDropdownAccept` now receives the Tiptap `Editor` instance so the acceptance handler in `usePQLEditor` can call `applyInsertSuggestion` without needing a separate `editorRef`.

**Synchronous state reads:** `getDropdownState()` is called synchronously inside `handleKeyDown`. The hook keeps `dropdownStateRef.current` always up-to-date so the plugin reads the latest dropdown state at the exact moment a key is pressed.

---

## Layer 3 — Tiptap Extension (`extension.ts`)

`PQLEditorExtension` is a Tiptap `Extension` (not a `Node` or `Mark` — it adds no schema). Its sole job is to assemble the three ProseMirror plugins and expose a typed options surface.

```ts
export const PQLEditorExtension = Extension.create<PQLEditorExtensionOptions>({
  name: "pqlEditor",
  addProseMirrorPlugins() {
    return [
      PQLHighlighterPlugin({ onParseResult: this.options.onParseResult, fieldDefs: this.options.fieldDefs }),
      PQLAutocompletePlugin({
        onContextChange: (context, anchor) =>
          this.options.onContextChange({ editor: this.editor, context, newAnchor: anchor }),
      }),
      PQLKeymapPlugin({
        editor: this.editor,
        onSubmit: this.options.onSubmit,
        getDropdownState: this.options.getDropdownState,
        onDropdownNavigate: this.options.onDropdownNavigate,
        onDropdownAccept: () => this.options.onDropdownAccept(this.editor),
        onDropdownClose: this.options.onDropdownClose,
      }),
    ];
  },
});
```

**Options interface:**

| Option | Type | Purpose |
|--------|------|---------|
| `fieldDefs` | `FieldDef[]` | Passed to Highlighter for dynamic field classification |
| `onParseResult` | `(result: ParseResult) => void` | Called by Highlighter after every doc change |
| `onContextChange` | `(args) => void` | Called by Autocomplete with editor + context + anchor |
| `onSubmit` | `(val: { json, text }) => void` | Called by Keymap on Enter with no dropdown |
| `getDropdownState` | `() => DropdownState` | Called synchronously by Keymap on every keydown |
| `onDropdownNavigate` | `(dir) => void` | Called by Keymap on Arrow keys |
| `onDropdownAccept` | `(editor: Editor) => void` | Called by Keymap on Enter/Tab with dropdown open |
| `onDropdownClose` | `() => void` | Called by Keymap on Escape with dropdown open |

---

## Layer 3b — Inline Node Extensions

### PQLValueExtension

**File:** `value/extension.tsx`

A Tiptap `Node.create()` extension for inline value chips. Configuration:

- `group: "inline"`, `inline: true`, `atom: true`, `selectable: true`
- **Attribute:** `option: IFilterOption<TFilterValue> | undefined`
- **`renderText`** → `"${option.value}" ` (quoted UUID + trailing space for PQL token separation)
- **`renderHTML`** → `<span data-type="pqlValue">`
- **Command:** `editor.commands.insertPQLValue({ option })`
- **Node view:** `PQLValueNodeView` — renders as `<NodeViewWrapper>` with a pill style showing `option.label`

### PQLCustomPropertyFieldExtension

**File:** `custom-property-field/extension.tsx`

A Tiptap `Node.create()` extension for inline custom property field chips.

- `group: "inline"`, `inline: true`, `atom: true`, `selectable: true`
- **Attribute:** `field: FieldDef`
- **`renderText`** → `cf["${extractCustomPropertyFieldId(field.value)}"]` (the backend resolves this `cf[…]` syntax)
- **`renderHTML`** → `<span data-type="pqlCustomPropertyField">`
- **Command:** `editor.commands.insertPQLCustomPropertyField({ field })`
- **Node view:** `PQLCustomPropertyFieldNodeView` — renders as a pill showing `field.name`

**`isCustomPropertyField(value)`** — returns `true` when `value.startsWith("customproperty_")`.

**`extractCustomPropertyFieldId(value)`** — strips the `customproperty_` prefix: `"customproperty_abc123"` → `"abc123"`.

---

## Layer 4 — `usePQLEditor` Hook

**File:** `hooks/use-pql-editor.ts`

The `usePQLEditor` hook centralises all Tiptap editor construction and suggestion logic. The React component is thin — it renders what the hook provides.

### Editor Setup

The hook creates the Tiptap editor via `useEditor` with:

- **`StarterKit`** configured to disable all marks and block-level nodes (bold, heading, lists, etc.)
- **`Placeholder`** extension
- **`PQLEditorExtension`** with `fieldDefs` and all callback options
- **`PQLValueExtension`** and **`PQLCustomPropertyFieldExtension`**
- Paste handler normalises to plain text (`event.clipboardData.getData("text/plain")`)
- Editor attributes: `spellcheck="false"`, `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="off"`

**`useImperativeHandle`** exposes `PQLEditorHandle`:

| Method | Behaviour |
|--------|-----------|
| `blur()` | `editor.commands.blur()` |
| `clearAll(args?)` | `clearContent()`, optionally triggers update/submit/focus |
| `focus()` | `editor.commands.focus()` |
| `getParseResult()` | Returns `{ ast: null, errors: [], isValid: true }` (placeholder; parse result tracking pending) |
| `getValue()` | `editor.getText()` |
| `setValue(v)` | `setContent('<p>' + escapeHtml(v) + '</p>', false)` |

### Context Change Handler

`handleContextChange({ editor, context, newAnchor })` is called by the extension on every cursor move. It:

1. Stores `context` in `currentContextRef` (consumed synchronously by `selectOption`)
2. Builds the sentinel-substituted text: `doc.textBetween(…, "", nodeMapper)` where `pqlValue` → `\x01`, `pqlCustomPropertyField` → `\x02`
3. Computes `partial = getPartialToken(text, cursorChar)` — alphanumeric characters immediately before the cursor
4. Checks **`canShow`**: the dropdown only opens when `tokenStart === 0` (very start of input) or the character immediately before the partial token is whitespace, `\x01`, `\x02`, `(`, or `,`. This prevents the dropdown from appearing mid-identifier in unexpected positions.
5. If not `canShow` → closes dropdown and returns
6. Determines `isDateContext(context, fieldMap)` → calls `setShowDatePicker`
7. Calls `computeAllSuggestions(context, fieldDefs, fieldMap)` (async)
8. On resolve: filters by `partial` → calls `openDropdown(filtered, newAnchor)`

### Suggestion Pipeline

```
handleContextChange
  → canShow check (whitespace/chip/paren/comma gate)
  → isDateContext check → setShowDatePicker
  → computeAllSuggestions(context, fieldDefs, fieldMap)  [async, pql-suggestions.ts]
      ↓
  START            → field chips + predicate/relation/history functions
  AFTER_FIELD      → operator suggestions from field.allowedOps
  AFTER_OPERATOR   → single_select/multi_select → resolveOptionsFromConfig()
                   → date/date_range → DATE functions (+ date picker shown separately)
                   → others → field-specific functions only
  AFTER_IN / AFTER_IN_NO_BRACKET / AFTER_IN_COMMA
                   → resolveOptionsFromConfig(field, "in") + field functions
  AFTER_IS         → NULL / NOT NULL / EMPTY / NOT EMPTY keywords
  AFTER_BETWEEN / AFTER_BETWEEN_AND → DATE functions
  AFTER_CONDITION  → AND / OR keywords
      ↓
  filter(all, partial) → openDropdown(list, anchor)
```

`openDropdown` updates React state and synchronously writes to `dropdownStateRef`:
```ts
if (newAnchor) setAnchor(newAnchor);
setSuggestions(list);
setActiveIndex(0);
dropdownStateRef.current = { isOpen: list.length > 0, activeIndex: 0, suggestions: list };
```

### Insertion Logic (`applyInsertSuggestion`)

**File:** `utils/pql-suggestions.ts` — `applyInsertSuggestion(editor, suggestion)`

A pure module-level function (no closures over React state):

1. Build sentinel-substituted text via `doc.textBetween(…, nodeMapper)` — this is critical because `editor.getText()` would expand chips via `renderText`, causing the walk-back to index into the middle of an expanded UUID
2. Walk back through `[a-zA-Z0-9_]` characters to find `tokenStart` (the start of the partial identifier). `\x01` stops the walk cleanly at chip boundaries.
3. `deleteRange({ from: tokenStart + 1, to: cursorPm })` — removes the partial
4. Dispatch based on suggestion variant:
   - **`insertText`** → `insertContent(suggestion.insertText)`, then `appendCharacter`: `"whitespace"` → insert ` `; `"bracket"` → insert ` (`; `"none"` → nothing
   - **`cursorShift`** → move cursor back N positions (used for `= ""` to land inside quotes)
   - **`insertNode` value** → `insertPQLValue({ option })`
   - **`insertNode` customPropertyField** → `insertPQLCustomPropertyField({ field })` then insert ` `

### Option Selection Logic (`selectOption`)

`selectOption(ed, suggestion)` adds extra intelligence on top of `applyInsertSuggestion`:

1. Captures `contextKind = currentContextRef.current?.kind` **before** insertion (the view plugin fires `onContextChange` synchronously inside `editor.chain().run()`, overwriting `currentContextRef` to the post-insertion context)
2. **`AFTER_IN_NO_BRACKET` + value chip**: inserts `(` before the chip, then `, ` after, and closes the dropdown
3. **`AFTER_IN` or `AFTER_IN_COMMA`** with a complete value (chip or 0-arity list function): appends `, ` to leave the list open for more entries
4. Calls `handleDropdownClose()` in all paths

### Dropdown State Management

Three separate variables are kept in sync:

| Variable | Type | Who reads it | Updated by |
|----------|------|-------------|------------|
| `suggestions` | `Suggestion[]` | React (renders dropdown) | `openDropdown`, `handleDropdownClose` |
| `activeIndex` | `number` | React (highlights active item) | `handleDropdownNavigate`, `openDropdown` |
| `anchor` | `{ top, left, bottom }` | React (positions dropdown) | `openDropdown` |
| `showDatePicker` | `boolean` | React (shows calendar panel) | `handleContextChange`, `handleDropdownClose` |
| `dropdownStateRef.current` | `DropdownState` | Keymap plugin (synchronous) | Every handler that mutates dropdown state |

`handleDropdownNavigate` updates both:
```ts
dropdownStateRef.current.activeIndex = next;  // sync — keydown reads this immediately
setActiveIndex(next);                          // async — triggers re-render
```

---

## Layer 5 — React Component (`pql/editor.tsx`)

`PQLEditor` is a thin wrapper around `usePQLEditor`. It:

- Manages local UI state: `isMaximized`, `suggestions`, `activeIndex`, `anchor`, `showDatePicker`
- Owns `dropdownStateRef` (passed into the hook)
- Renders `<EditorContent>`, a maximize/minimize `IconButton`, an optional submit `IconButton` (with `loading={isSubmitting}`), `PQLAutocompleteDropdown`, and `PQLErrorTooltip`
- **Maximize mode:** `isMaximized` toggles a `min-h-37.5` Tailwind class on the wrapper, expanding the editor for multi-line visibility

The `forwardRef` wrapper (`PQLEditorWithRef`) passes `ref` as `forwardedRef` via props instead of the standard ref forwarding pattern, because `useImperativeHandle` is called inside the `usePQLEditor` hook.

---

## Layer 6 — React UI Components

### PQLAutocompleteDropdown

**File:** `autocomplete-dropdown.tsx`

Renders a floating overlay anchored to the cursor coordinates. Uses `@floating-ui/react` for automatic placement.

**Key behaviours:**

- **Floating UI setup:** `useFloating` with `placement: "bottom-start"` and `offset(4)`, `flip({ padding: 8 })`, `shift({ padding: 8 })` middleware. `whileElementsMounted: autoUpdate` repositions the dropdown on scroll and resize.
- **Virtual reference:** The anchor `{ top, left, bottom }` from the autocomplete plugin is used to construct a virtual DOM element via `refs.setReference({ getBoundingClientRect() { … } })` in a `useLayoutEffect`.
- **Portal + scroll lock:** Rendered inside `FloatingPortal` with a `FloatingOverlay lockScroll` overlay at `z-index: 99` (dropdown at `z-index: 100`) to prevent background scroll while the dropdown is open.
- **Date picker panel:** When `showDatePicker` is true, a `@plane/propel/calendar` (`Calendar`) panel is rendered to the right of the suggestion list. The selected date is formatted and inserted as `"YYYY-MM-DD"` via `onSelect`.
- **Grouping:** Suggestions are grouped by `kind` in section order (`field`, `operator`, `value`, `function`, `keyword`) with sticky section headers.
- **Scroll to active:** A `useLayoutEffect` on `activeIndex` calls `scrollIntoView({ block: "nearest" })` on the active `li` child.
- **Outside-click close:** A `document.addEventListener("mousedown", …)` in `useEffect` calls `onClose()` when the target is not inside the floating element.
- **`onMouseDown` on items:** Uses `mousedown` (not `click`) to fire before the browser moves focus away from the editor. Both `e.preventDefault()` (keeps editor focus) and `e.stopPropagation()` (prevents stacked ProseMirror handlers) are called before `onSelect(suggestion)`.
- **Visibility guard:** Returns `null` if the editor is not editable or not focused (`!editor.isEditable || !editor.isFocused`).

---

### PQLErrorTooltip

**File:** `error-tooltip.tsx`

A lightweight hover tooltip for inline error underlines. Subscribes to native `mouseover` / `mouseout` events on the container ref (the editor's outer div) and shows a `fixed`-position tooltip when the pointer enters any element with the `.pql-error-underline` class.

**Error message source:** `span.dataset.pqlError` — set by the Highlighter plugin as `data-pql-error="message text"` on every error decoration span.

---

## Data Flow Diagram

```
User types a character
        │
        ▼
ProseMirror transaction dispatched
        │
        ├──► PQLHighlighterPlugin.state.apply
        │       extractPQLSource(state) → { text, customFieldOffsets }
        │       tokenize(text, fieldValues) → Token[]
        │       patch CUSTOM_PROPERTY_FIELD_NODE token values
        │       parse(tokens)  → { ast, errors }
        │       validate(ast, fieldMap)  → ValidationError[]
        │       buildDecorations(tokens, allErrors) → DecorationSet
        │       setTimeout → onParseResult(result)
        │               └── React: handleParseResult (currently no-op)
        │
        ├──► PQLAutocompletePlugin.state.apply
        │       setTimeout → computeContext → onContextChange({ editor, context, null })
        │
        └──► PQLAutocompletePlugin.view.update  [synchronous]
                focusGained check
                computeContext(state)
                getAnchorCoords(view)
                onContextChange({ editor, context, anchor })
                        │
                        └── React: handleContextChange
                                  canShow gate (whitespace / chip / paren)
                                  isDateContext check → setShowDatePicker
                                  computeAllSuggestions(ctx, fieldDefs, fieldMap)  [async]
                                          │
                                          └── openDropdown(filtered, anchor)
                                                  setAnchor, setSuggestions, setActiveIndex
                                                  dropdownStateRef.current = { isOpen: true, … }

User presses ArrowDown / ArrowUp / Enter / Tab / Escape
        │
        ▼
PQLKeymapPlugin.handleKeyDown
        │
        ├── getDropdownState()  [synchronous — reads dropdownStateRef.current]
        │
        ├── Enter / Tab + dropdown open
        │       onDropdownAccept(editor)
        │               └── React: handleDropdownAccept
        │                         selectOption(editor, list[activeIndex])
        │                           → applyInsertSuggestion / chip insertion
        │                           → handleDropdownClose()
        │
        ├── Enter + dropdown closed
        │       onSubmit({ json, text })
        │
        ├── ArrowDown / ArrowUp
        │       onDropdownNavigate("down" | "up")
        │               └── React: handleDropdownNavigate
        │                         dropdownStateRef.current.activeIndex = next  [sync]
        │                         setActiveIndex(next)  [async]
        │
        └── Escape
                onDropdownClose()
                        └── React: handleDropdownClose
                                  setSuggestions([]), setAnchor(null), setShowDatePicker(false)
                                  dropdownStateRef.current = { isOpen: false, … }

User clicks a dropdown item
        │
        ▼
SuggestionItem.onMouseDown
        e.preventDefault()   — keeps editor focus
        e.stopPropagation()  — stops stacked ProseMirror handlers
        onSelect(suggestion)
                └── React:
                      selectOption(editor, suggestion)
                        → contextKind = currentContextRef.current.kind
                        → AFTER_IN_NO_BRACKET + chip: insert '(' → chip → ', '
                        → default: applyInsertSuggestion
                        → if AFTER_IN/AFTER_IN_COMMA + complete value: append ', '
                        → handleDropdownClose()

User picks a date from the calendar panel
        │
        ▼
Calendar.onSelect(date)
        handleDateSelect(date)
                └── React: onSelect({ insertText: '"YYYY-MM-DD"', appendCharacter: "whitespace" })
                      → selectOption path (same as clicking a suggestion)
```

---

## Key Design Decisions

### Why `NOT_IN` is collapsed in the lexer, not the parser

The original design handled `NOT IN` entirely in `parseComparisonRHS` — the parser peeked ahead for `IN` after consuming `NOT`. Moving the collapse to the lexer has two advantages:

1. The highlighter can colour the entire `NOT IN` phrase with the `operator` class without special-casing two separate tokens
2. The autocomplete context logic only needs to check `last.kind === TokenKind.NOT_IN` instead of the two-token pattern `[NOT, IN]`

The tradeoff is that standalone `NOT` (logical prefix) still needs to be recognised at the point of emission, not before the `IN` check. The lexer peeks ahead only when it has just read a `NOT` token, so non-`IN` identifiers after `NOT` are still emitted normally.

### Why `fieldDefs` replaces built-in `FIELD_DEFS`

The original grammar had a static `FIELD_DEFS` array hardcoded in `grammar.ts`. This prevented the editor from supporting:

- Project-specific custom property fields
- Different field sets across different editor instances on the same page

By accepting `fieldDefs` as a runtime prop, the lexer, highlighter, and autocomplete all become field-agnostic. The consuming app injects the field registry.

### Why inline atom nodes instead of raw UUID strings

Raw UUIDs like `"550e8400-e29b-41d4-a716-446655440000"` are visually indistinguishable and error-prone to edit. Atom chips show `option.label` while `renderText` emits valid PQL, so the document round-trips correctly through copy/paste, submission, and setValue.

### Why sentinel characters (\x01, \x02) for chip positions

A `pqlValue` chip occupies one ProseMirror document position. If `extractPQLSource` used the chip's `renderText` output (`"uuid" `) instead, a chip that expands to 8 characters would shift all subsequent char offsets by 7, desynchronising the token stream from ProseMirror positions. Replacing each chip with a single sentinel character keeps the invariant `pmPosition = charOffset + 1` exact for the entire document.

### Why `canShow` gate in `handleContextChange`

Without the `canShow` guard, the dropdown would open mid-identifier in places the user would not expect — for example, after typing `priorityFoo` the autocomplete would suggest field names filtered to "foo". The gate requires either a start-of-input position or a whitespace/chip/paren/comma character immediately before the partial token. This matches the positions where the user is genuinely starting a new token.

### Why `currentContextRef` is captured before `applyInsertSuggestion`

`editor.chain().run()` is synchronous. The view plugin fires `onContextChange` inside it, overwriting `currentContextRef.current` to the post-insertion context before `applyInsertSuggestion` returns. Capturing `contextKind` from `currentContextRef.current` at the start of `selectOption` (before calling `applyInsertSuggestion`) ensures the `AFTER_IN_NO_BRACKET` and `AFTER_IN_COMMA` append logic reads the context the user was in when they made the selection, not the context after insertion.

### Why `dropdownStateRef` is updated synchronously

`useEffect` and `useLayoutEffect` run after the render cycle. A keydown event fires in the browser's synchronous event loop, potentially before the next React commit. If `dropdownStateRef` were only updated in an effect, pressing Arrow/Enter immediately after the dropdown appears could read a stale closed state. Updating `dropdownStateRef.current` directly inside `openDropdown`, `handleDropdownClose`, and `handleDropdownNavigate` ensures the ref is always consistent at the exact moment a keydown fires.

### Why Floating UI replaces manual fixed-position math

The original dropdown calculated `top`/`left` from `view.coordsAtPos()` and set them as `fixed` CSS properties. This breaks when the editor is inside a scroll container (cursor coordinate is viewport-relative but the container may be scrolled), or inside a CSS `transform` context (which creates a new stacking context, offsetting fixed-position children). Floating UI's `autoUpdate` middleware recalculates position on scroll and resize, and its `flip`/`shift` middleware ensures the dropdown stays within the viewport.

### Why `e.stopPropagation()` on dropdown item `mousedown`

ProseMirror registers native DOM listeners on the editor view. When a mouse event is dispatched from inside a `FloatingPortal` that is a DOM descendant of the editor container, the event bubbles through ProseMirror's listener tree. Without `stopPropagation`, ProseMirror could re-process the event and disrupt the editor state before `onSelect` finishes inserting the suggestion.

---

## Common Gotchas

### "NOT IN is tokenised as two separate tokens"

The lexer collapses `NOT IN` into a single `NOT_IN` token. If you add a test or debugging tool that calls `tokenize` directly, remember that `NOT IN` with any amount of whitespace between the words will produce a single `NOT_IN` token, not `[NOT, IN]`.

### "Custom property fields are not highlighted or autocompleted"

Custom property field identifiers start with `customproperty_`. The lexer only classifies them as `FIELD` tokens when they appear in the caller-supplied `fieldValues` set. If a custom field is not in `fieldDefs`, it will be lexed as `IDENTIFIER` (unknown) and flagged as an error. Make sure every field the user can reference is included in the `fieldDefs` prop.

### "Suggestion context is wrong when cursor is inside a chip"

ProseMirror treats atom nodes as a single position. The autocomplete plugin reads `state.selection.from` which will be the position immediately after the chip, not inside it. The context determination will treat the chip as a completed value (`PQL_VALUE_NODE`) and suggest `AND`/`OR` connectors. This is correct — the cursor cannot be placed inside an atom.

### "Enter still inserts a newline"

Do not add `addKeyboardShortcuts() { return { Enter: () => true } }` to the extension. Tiptap's keyboard shortcuts run at a higher priority than ProseMirror plugins' `handleKeyDown`. An `Enter: () => true` shortcut would consume the event before `PQLKeymapPlugin` ever sees it, breaking both autocomplete acceptance and the submit callback. The keymap plugin prevents the newline by returning `true` whenever it handles Enter.

### "The date picker calendar appears but selecting a date does nothing"

The `handleDateSelect` callback in `PQLAutocompleteDropdown` calls `onSelect` with an `insertText` suggestion. This eventually calls `selectOption` in `usePQLEditor`, which calls `applyInsertSuggestion`. If the editor is not focused at the time (e.g., because the calendar steals focus), `applyInsertSuggestion` will still run because `editor.chain().focus()` is called inside it. If the date is still not inserted, check that `onMouseDown` on the calendar wrapper calls `e.stopPropagation()` to prevent the outside-click handler from closing the dropdown before `onSelect` fires.

### "Clicking a suggestion closes the dropdown but doesn't insert text"

This is usually caused by `editor.isDestroyed` being `true`. Check that the editor instance passed to `selectOption` is the one from `usePQLEditor` (not a stale closure). The `selectOption` function receives `ed: Editor` as its first argument and guards with `if (!ed || ed.isDestroyed) return`.

### "The dropdown shows at the wrong position after inserting text"

After insertion the editor dispatches a transaction that triggers `view.update` with a new cursor position. This fires `onContextChange(newCtx, newAnchor)` with fresh coordinates. The anchor is updated inside `openDropdown` only when `newAnchor` is non-null. If the deferred `scheduleContextUpdate` path calls `onContextChange(ctx, null)` later, it will not clobber the valid anchor set by `view.update`.
