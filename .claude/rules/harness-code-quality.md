# Code Quality

You MUST follow these code quality rules:

## Forbidden

- No `console.log` / `fmt.Println` / `print()` for debugging in production code.
- No hardcoded secrets, tokens, or passwords. Use environment variables or a secrets manager.

## Required

- All public APIs must have documentation (JSDoc, GoDoc, docstrings, etc.).
- All public functions must have type annotations where the language supports them.
