# Formula Engine

A lightweight, zero-dependency Python library for validating and executing dynamic formulas with type checking, field references, and spreadsheet-like expressions.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Formula Syntax](#formula-syntax)
- [API Reference](#api-reference)
- [Type System](#type-system)
- [Architecture](#architecture)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Quick Start

```python
from datetime import date
from plane.ee.utils.formula.engine import execute_formula
from plane.ee.utils.formula.work_item_properties import WorkItemPropertyFormulaConversionPayload

# Define formula with field references
formula = '({{end_date}} - {{start_date}}) & " days remaining"'

# Provide field values
fields = [
    WorkItemPropertyFormulaConversionPayload("end_date", "date", date(2024, 2, 1)),
    WorkItemPropertyFormulaConversionPayload("start_date", "date", date(2024, 1, 1)),
]

# Execute
result = execute_formula(formula, fields)
print(result.value)        # "31 days remaining"
print(result.result_type)  # "text"
print(result.success)      # True
```

---

## Features

| Feature               | Description                                               |
| --------------------- | --------------------------------------------------------- |
| **Zero Dependencies** | Pure Python stdlib — no external packages required        |
| **Type Safety**       | Full type checking at validation time                     |
| **Field References**  | `{{field_name}}` syntax supports any field name format    |
| **Rich Operators**    | Math, date arithmetic, text concatenation, comparisons    |
| **Functions**         | IF, ROUND, ABS, UPPER, LOWER, LEN, CONCAT, TODAY, NOW     |
| **None Propagation**  | Graceful handling of missing/null values                  |
| **Case Insensitive**  | `{{start_date}}` matches `Start Date`, `START_DATE`, etc. |
| **Error Messages**    | Helpful hints for validation and execution errors         |

---

## Formula Syntax

### Field References

Wrap all dynamic field references in double curly braces:

```
{{field_name}}
{{Start Date}}
{{5c015e36-011f-4c2f-9633-a0df16900e93}}
```

### Operators

| Operator    | Use Case        | Example                | Result Type   |
| ----------- | --------------- | ---------------------- | ------------- |
| `+ - * /`   | Arithmetic      | `{{price}} * {{qty}}`  | NUMBER        |
| `+ -`       | Date arithmetic | `{{date}} + 30`        | DATE          |
| `-`         | Date difference | `{{end}} - {{start}}`  | NUMBER (days) |
| `&`         | Concatenation   | `{{name}} & " active"` | TEXT          |
| `= !=`      | Equality        | `{{status}} = "open"`  | BOOLEAN       |
| `< <= > >=` | Comparison      | `{{price}} > 100`      | BOOLEAN       |
| `-` (unary) | Negation        | `-{{value}}`           | NUMBER        |

**Operator Precedence** (lowest to highest):

1. `&` (concatenation)
2. `= != < <= > >=` (comparisons)
3. `+ -` (addition/subtraction)
4. `* /` (multiplication/division)
5. Unary `-`, functions, parentheses

### Functions

| Function   | Arguments                          | Returns             | Example                              |
| ---------- | ---------------------------------- | ------------------- | ------------------------------------ |
| **IF**     | `(condition, true_val, false_val)` | Matches branch type | `IF({{qty}} > 0, "In stock", "Out")` |
| **ROUND**  | `(number, decimals)`               | NUMBER              | `ROUND({{price}}, 2)`                |
| **ABS**    | `(number)`                         | NUMBER              | `ABS({{delta}})`                     |
| **UPPER**  | `(text)`                           | TEXT                | `UPPER({{name}})`                    |
| **LOWER**  | `(text)`                           | TEXT                | `LOWER({{code}})`                    |
| **LEN**    | `(text)`                           | NUMBER              | `LEN({{description}})`               |
| **CONCAT** | `(text, ...)`                      | TEXT                | `CONCAT({{first}}, " ", {{last}})`   |
| **TODAY**  | `()`                               | DATE                | `TODAY()`                            |
| **NOW**    | `()`                               | DATE                | `NOW()`                              |

### Examples

**Profit Percentage:**

```python
formula = '''
IF({{selling_price}} > {{cost_price}},
   ROUND((({{selling_price}} - {{cost_price}}) / {{cost_price}}) * 100, 2) & "%",
   "No profit")
'''
```

**Days Until Deadline:**

```python
formula = '''
IF(({{deadline}} - TODAY()) < 7,
   "URGENT: " & ({{deadline}} - TODAY()) & " days left",
   ({{deadline}} - TODAY()) & " days remaining")
'''
```

**Status Label:**

```python
formula = 'UPPER({{status}}) & ": " & {{title}} & " (" & LEN({{title}}) & " chars)"'
```

---

## API Reference

### execute_formula()

Validate and execute a formula with actual field values.

```python
def execute_formula(
    formula: str,
    work_item_properties: list[WorkItemPropertyFormulaConversionPayload],
) -> ExecutionResult
```

**Parameters:**

- `formula` — Formula string with `{{field_name}}` syntax
- `work_item_properties` — List of fields with name, type, and value

**Returns:**

```python
@dataclass
class ExecutionResult:
    success: bool
    value: Any              # Computed result
    result_type: str | None # "text" | "number" | "date" | "boolean"
    error: str | None       # Error message if success=False
```

**Example:**

```python
result = execute_formula(
    '{{price}} * {{qty}}',
    [
        WorkItemPropertyFormulaConversionPayload("price", "number", 100),
        WorkItemPropertyFormulaConversionPayload("qty", "number", 5),
    ]
)

if result.success:
    print(result.value)        # 500
    print(result.result_type)  # "number"
else:
    print(result.error)
```

### validate_formula()

Validate formula syntax and types without execution.

```python
def validate_formula(
    formula: str,
    work_item_properties: list[WorkItemPropertyFormulaConversionPayload],
) -> ValidationResult
```

**Parameters:**

- `formula` — Formula string
- `work_item_properties` — List of fields with name and type (value not required)

**Returns:**

```python
@dataclass
class ValidationResult:
    valid: bool
    result_type: str | None         # "text" | "number" | "date" | "boolean"
    error: str | None
    referenced_fields: set[str]     # Fields used in formula
```

**Example:**

```python
result = validate_formula(
    '{{selling_price}} > {{cost_price}}',
    [
        WorkItemPropertyFormulaConversionPayload("selling_price", "number"),
        WorkItemPropertyFormulaConversionPayload("cost_price", "number"),
    ]
)

if result.valid:
    print(result.result_type)         # "boolean"
    print(result.referenced_fields)   # {"selling_price", "cost_price"}
else:
    print(result.error)
```

### WorkItemPropertyFormulaConversionPayload

Input contract for field data.

```python
@dataclass
class WorkItemPropertyFormulaConversionPayload:
    field: str              # Field name (any format)
    type: str               # "number" | "text" | "date" | "boolean"
    value: Any | None       # Runtime value (None propagates as None result)

    @property
    def normalised_key(self) -> str:
        # Returns normalized key for case-insensitive matching
```

**Field Matching Rules:**

- Case insensitive: `{{start_date}}` matches `"Start Date"`, `"START_DATE"`
- Space/underscore insensitive: `{{start_date}}` matches `"start date"`
- Supports UUID field names with hyphens

---

## Type System

### Data Types

| Type        | Python Type        | Example Values            |
| ----------- | ------------------ | ------------------------- |
| **NUMBER**  | `int`, `float`     | `42`, `3.14`, `-10`       |
| **TEXT**    | `str`              | `"hello"`, `""`, `"2024"` |
| **DATE**    | `date`, `datetime` | `date(2024, 1, 1)`        |
| **BOOLEAN** | `bool`             | `True`, `False`           |

### Type Rules

Complete operator type compatibility matrix:

| Operator             | Left    | Right   | Result  | Example                      |
| -------------------- | ------- | ------- | ------- | ---------------------------- |
| `+`                  | NUMBER  | NUMBER  | NUMBER  | `{{a}} + {{b}}`              |
| `-`                  | NUMBER  | NUMBER  | NUMBER  | `{{a}} - {{b}}`              |
| `*`                  | NUMBER  | NUMBER  | NUMBER  | `{{a}} * {{b}}`              |
| `/`                  | NUMBER  | NUMBER  | NUMBER  | `{{a}} / {{b}}`              |
| `-`                  | DATE    | DATE    | NUMBER  | `{{end}} - {{start}}` (days) |
| `+`                  | DATE    | NUMBER  | DATE    | `{{date}} + 30`              |
| `-`                  | DATE    | NUMBER  | DATE    | `{{date}} - 7`               |
| `&`                  | TEXT    | TEXT    | TEXT    | `{{a}} & {{b}}`              |
| `&`                  | NUMBER  | TEXT    | TEXT    | `{{count}} & " items"`       |
| `&`                  | TEXT    | NUMBER  | TEXT    | `"Total: " & {{amount}}`     |
| `&`                  | DATE    | TEXT    | TEXT    | `{{date}} & " due"`          |
| `&`                  | TEXT    | DATE    | TEXT    | `"Due: " & {{date}}`         |
| `&`                  | BOOLEAN | TEXT    | TEXT    | `{{flag}} & " status"`       |
| `&`                  | NUMBER  | NUMBER  | TEXT    | `{{area}} & {{code}}`        |
| `=`, `!=`            | NUMBER  | NUMBER  | BOOLEAN | `{{a}} = {{b}}`              |
| `=`, `!=`            | TEXT    | TEXT    | BOOLEAN | `{{status}} = "open"`        |
| `=`, `!=`            | DATE    | DATE    | BOOLEAN | `{{d1}} = {{d2}}`            |
| `=`, `!=`            | BOOLEAN | BOOLEAN | BOOLEAN | `{{f1}} = {{f2}}`            |
| `<`, `<=`, `>`, `>=` | NUMBER  | NUMBER  | BOOLEAN | `{{price}} > 100`            |
| `<`, `<=`, `>`, `>=` | DATE    | DATE    | BOOLEAN | `{{deadline}} > TODAY()`     |

### None Propagation

**Rule:** If any operand is `None`, the result is `None`.

**Exception:** `IF()` only evaluates the branch that will be returned.

```python
# None propagates
{{price}} + {{tax}}  # If either is None → result is None

# None in untaken branch doesn't propagate
IF({{score}} > 50, "Pass", {{reason}})  # If score=75, reason can be None
```

---

## Architecture

The formula engine uses a **4-stage pipeline**:

```
Input String
    ↓
[1. Lexer]      String → Tokens
    ↓
[2. Parser]     Tokens → AST (Abstract Syntax Tree)
    ↓
[3. Validator]  AST → Type checking
    ↓
[4. Executor]   AST + values → Result
```

### Stage 1: Lexer (`lexer.py`)

**Purpose:** Convert raw formula string into tokens.

**Key Feature:** When lexer encounters `{{`, it reads until `}}` as a single `FIELD` token, allowing any characters inside (spaces, hyphens, etc.).

```python
Input:  '({{start_date}} - {{target_date}}) & " days"'

Output:
  Token(LPAREN, '(')
  Token(FIELD, 'start_date')
  Token(MINUS, '-')
  Token(FIELD, 'target_date')
  Token(RPAREN, ')')
  Token(AMPERSAND, '&')
  Token(STRING, ' days')
  Token(EOF)
```

### Stage 2: Parser (`parser.py`)

**Purpose:** Build Abstract Syntax Tree (AST) respecting operator precedence.

**Strategy:** Recursive descent parser with one function per precedence level.

```python
Input:  ({{start_date}} - {{target_date}}) & " days"

AST:
  BinaryOpNode(&)
  ├── BinaryOpNode(-)
  │   ├── FieldNode("start_date")
  │   └── FieldNode("target_date")
  └── StringNode(" days")
```

### Stage 3: Validator (`validator.py`)

**Purpose:** Walk AST and validate type compatibility.

**Data Structures:**

- `OP_TYPE_RULES` — Dict mapping `(operator, left_type, right_type)` → `result_type`
- `FUNCTION_REGISTRY` — Dict mapping function names to signatures and return types

**Example:**

```python
OP_TYPE_RULES = {
    ('+', NUMBER, NUMBER): NUMBER,
    ('-', DATE, DATE): NUMBER,      # date - date = days
    ('&', TEXT, NUMBER): TEXT,       # auto-coerce number to text
    # ... 40+ rules
}
```

### Stage 4: Executor (`executor.py`)

**Purpose:** Walk AST and compute actual values.

**Key Features:**

- None propagation (except for IF branches)
- Date arithmetic using `timedelta`
- Type coercion for concatenation

---

## Development Guide

### Adding a New Operator Rule

**File:** `validator.py`

```python
OP_TYPE_RULES = {
    # ... existing rules
    ('<', TEXT, TEXT): BOOLEAN,  # ← Add one line
}
```

That's it! No other file needs modification.

### Adding a New Function

**Step 1:** Add to `lexer.py` — Function name recognition

```python
FUNCTION_NAMES = {
    "IF", "ROUND", "FLOOR",  # ← Add FLOOR
    # ...
}
```

**Step 2:** Add to `validator.py` — Function signature

```python
FUNCTION_REGISTRY = {
    # ...
    "FLOOR": {"arg_types": [N], "return_type": N},  # ← Define signature
}
```

**Step 3:** Add to `executor.py` — Implementation

```python
def _exec_function(self, node):
    # ... existing functions
    if name == "FLOOR":
        return math.floor(args[0])  # ← Implement logic
```

### Adding a New Data Type

**File:** `validator.py`

```python
class DataType(Enum):
    NUMBER = auto()
    TEXT = auto()
    DATE = auto()
    BOOLEAN = auto()
    CURRENCY = auto()  # ← Add new type

# Then add operator rules
OP_TYPE_RULES = {
    # ...
    ('+', CURRENCY, CURRENCY): CURRENCY,
    ('*', CURRENCY, NUMBER): CURRENCY,
    # ...
}
```

### Error Handling

All errors are caught and returned in the result object. **No exceptions propagate to callers.**

**Error Types:**

- `LexerError` — Syntax errors (unterminated strings, unclosed braces)
- `ParseError` — Structure errors (missing parentheses, unexpected tokens)
- `ValidationError` — Type errors (incompatible types, unknown fields)
- `ExecutionError` — Runtime errors (division by zero)

**Example Error Messages:**

```
"Cannot apply '+' to DATE and DATE. Hint: Can't add two dates. Add a NUMBER to shift forward."

"IF() condition must be BOOLEAN, got NUMBER. Hint: use a comparison like {{price}} > 100"

"Unknown field '{{unknown_field}}'. Available fields: ['start_date', 'end_date', 'price']"
```

---

## Testing

### Test Files

| File                             | Purpose                | Test Count |
| -------------------------------- | ---------------------- | ---------- |
| `tests.py`                       | Standalone test runner | 177+       |
| `test_formulas_comprehensive.py` | Pytest test suite      | 111+       |
| `TEST_COVERAGE.md`               | Coverage documentation | —          |

### Running Tests

**Standalone Test Runner:**

```bash
cd apps/api/plane/ee/utils/formula
python tests.py
```

**Pytest Suite (Recommended):**

```bash
cd apps/api
pytest plane/ee/utils/formula/test_formulas_comprehensive.py -v

# Run specific test class
pytest plane/ee/utils/formula/test_formulas_comprehensive.py::TestArithmeticOperators -v

# Run with coverage
pytest plane/ee/utils/formula/test_formulas_comprehensive.py --cov=plane.ee.utils.formula
```

### Test Coverage

**100% coverage** across all categories:

| Category                 | Coverage | Test Count |
| ------------------------ | -------- | ---------- |
| **Arithmetic Operators** | ✅ 100%  | 8 tests    |
| **Date Arithmetic**      | ✅ 100%  | 6 tests    |
| **Concatenation**        | ✅ 100%  | 8 tests    |
| **Comparison Operators** | ✅ 100%  | 14 tests   |
| **IF Function**          | ✅ 100%  | 10 tests   |
| **ROUND Function**       | ✅ 100%  | 6 tests    |
| **ABS Function**         | ✅ 100%  | 5 tests    |
| **Text Functions**       | ✅ 100%  | 9 tests    |
| **CONCAT Function**      | ✅ 100%  | 3 tests    |
| **TODAY/NOW Functions**  | ✅ 100%  | 4 tests    |
| **None Propagation**     | ✅ 100%  | 10 tests   |
| **Field References**     | ✅ 100%  | 4 tests    |
| **Complex Formulas**     | ✅ 100%  | 5 tests    |
| **Error Cases**          | ✅ 100%  | 19 tests   |

**Test Organization** (pytest suite):

- `TestArithmeticOperators` — Math operations
- `TestDateArithmetic` — Date operations
- `TestConcatenationOperator` — Text joining
- `TestComparisonOperators` — Comparisons
- `TestIFFunction` — Conditional logic
- `TestROUNDFunction` — Number rounding
- `TestABSFunction` — Absolute values
- `TestTextFunctions` — UPPER, LOWER, LEN
- `TestCONCATFunction` — String concatenation
- `TestTodayAndNowFunctions` — Date functions
- `TestNonePropagation` — Null handling
- `TestFieldReferences` — Field matching
- `TestComplexFormulas` — Real-world scenarios
- `TestErrorCases` — Validation errors

**Example Test Cases:**

```python
# Simple arithmetic
def test_addition_numbers(self):
    result = execute_formula(
        "{{price}} + {{tax}}",
        [F("price", "number", 100), F("tax", "number", 15)]
    )
    assert result.success
    assert result.value == 115

# Complex nested formula
def test_profit_margin_with_status(self):
    result = execute_formula(
        'IF({{revenue}} > {{cost}}, "Profit: " & ROUND(...), "Loss: " & ABS(...))',
        [F("revenue", "number", 1500), F("cost", "number", 1000)]
    )
    assert result.success
    assert result.value == "Profit: 50.0%"

# Error handling
def test_division_by_zero(self):
    result = execute_formula(
        "{{price}} / {{qty}}",
        [F("price", "number", 100), F("qty", "number", 0)]
    )
    assert not result.success
    assert "Division by zero" in result.error
```

See `TEST_COVERAGE.md` for detailed test documentation.

---

## Project Structure

```
apps/api/plane/ee/utils/formula/
├── __init__.py                          # Public API exports
├── engine.py                            # Main entry points (execute_formula, validate_formula)
├── work_item_properties.py             # Input payload dataclass
├── utils.py                             # normalise() helper
├── tokens.py                            # Token types and definitions
├── nodes.py                             # AST node dataclasses
├── lexer.py                             # Tokenization (String → Tokens)
├── parser.py                            # Parsing (Tokens → AST)
├── validator.py                         # Type checking (AST → validation)
├── executor.py                          # Execution (AST + values → result)
├── tests.py                             # Standalone test runner (177+ tests)
├── test_formulas_comprehensive.py      # Pytest test suite (111+ tests)
├── TEST_COVERAGE.md                    # Test coverage documentation
└── README.md                            # This file
```

**Total:** 13 files, zero external dependencies.

---

## Common Use Cases

### 1. Profit Margin Calculation

```python
formula = 'ROUND((({{revenue}} - {{cost}}) / {{revenue}}) * 100, 1) & "% margin"'

fields = [
    WorkItemPropertyFormulaConversionPayload("revenue", "number", 10000),
    WorkItemPropertyFormulaConversionPayload("cost", "number", 6000),
]

result = execute_formula(formula, fields)
# result.value = "40.0% margin"
```

### 2. Due Date Status

```python
formula = '''
IF(({{due_date}} - TODAY()) < 0,
   "OVERDUE by " & ABS({{due_date}} - TODAY()) & " days",
   IF(({{due_date}} - TODAY()) < 3,
      "DUE SOON: " & ({{due_date}} - TODAY()) & " days",
      ({{due_date}} - TODAY()) & " days remaining"))
'''

fields = [
    WorkItemPropertyFormulaConversionPayload("due_date", "date", date(2024, 3, 15)),
]

result = execute_formula(formula, fields)
```

### 3. Task Identifier

```python
formula = 'UPPER({{project_code}}) & "-" & {{task_number}} & ": " & {{title}}'

fields = [
    WorkItemPropertyFormulaConversionPayload("project_code", "text", "web"),
    WorkItemPropertyFormulaConversionPayload("task_number", "number", 42),
    WorkItemPropertyFormulaConversionPayload("title", "text", "Fix login bug"),
]

result = execute_formula(formula, fields)
# result.value = "WEB-42: Fix login bug"
```

### 4. Price Calculation with Discount

```python
formula = '''
ROUND({{quantity}} * {{unit_price}} * (1 - {{discount}} / 100), 2) &
" (saved: " & ROUND({{quantity}} * {{unit_price}} * {{discount}} / 100, 2) & ")"
'''

fields = [
    WorkItemPropertyFormulaConversionPayload("quantity", "number", 10),
    WorkItemPropertyFormulaConversionPayload("unit_price", "number", 50),
    WorkItemPropertyFormulaConversionPayload("discount", "number", 20),
]

result = execute_formula(formula, fields)
# result.value = "400.0 (saved: 100.0)"
```

---

## Performance Considerations

- **Validation:** O(n) where n is the number of AST nodes
- **Execution:** O(n) where n is the number of AST nodes
- **Field Lookup:** O(1) with dict-based field resolution
- **Memory:** AST stored in memory during execution

**Optimization Tips:**

1. Reuse validation results for the same formula
2. Cache parsed ASTs if executing the same formula multiple times
3. Use `validate_formula()` once when saving, `execute_formula()` for each computation

---

## FAQ

**Q: Can I use the same field name multiple times?**  
A: Yes. `{{price}} * {{quantity}} + {{price}} * {{tax_rate}}` works fine.

**Q: What happens if a field value is None?**  
A: The entire result becomes None (except in untaken IF branches).

**Q: Are field names case-sensitive?**  
A: No. `{{Start Date}}`, `{{start_date}}`, and `{{START_DATE}}` all match.

**Q: Can I use parentheses for precedence?**  
A: Yes. `({{a}} + {{b}}) * {{c}}` ensures addition happens first.

**Q: How do I handle division by zero?**  
A: The executor catches it and returns `ExecutionResult(success=False, error="Division by zero")`.

**Q: Can formulas call other formulas?**  
A: Not directly. You need to evaluate dependencies separately and pass results as fields.

**Q: What's the maximum formula length?**  
A: No hard limit. Tested with formulas up to several hundred characters.

**Q: Are dates timezone-aware?**  
A: The engine accepts both `date` and `datetime` objects. Timezone handling is the caller's responsibility.

---

## License

SPDX-FileCopyrightText: 2023-present Plane Software, Inc.  
SPDX-License-Identifier: LicenseRef-Plane-Commercial

Licensed under the Plane Commercial License. See project root for full license details.

---

## Support

For issues or questions:

1. Check error messages (they include helpful hints)
2. Review the [Type System](#type-system) section
3. See [Development Guide](#development-guide) for extensions
4. Consult `TEST_COVERAGE.md` for examples

**Remember:** Every error message includes a hint pointing to the solution.
