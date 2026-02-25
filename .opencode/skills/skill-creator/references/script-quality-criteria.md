# Script Quality Criteria

Scripts provide deterministic reliability and token efficiency.

## When to Include Scripts

- Same code rewritten repeatedly
- Deterministic operations needed
- Complex transformations
- External tool integrations

## Cross-Platform Requirements

**Prefer:** Node.js or Python
**Avoid:** Bash scripts (not well-supported on Windows)

If bash required, provide Node.js/Python alternative.

## Testing Requirements

**Mandatory:** All scripts must have tests

```bash
# Run tests before packaging
python -m pytest scripts/tests/
# or
npm test
```

Tests must pass. No skipping failed tests.

## Environment Variables

Respect hierarchy (first found wins):

1. `process.env` (runtime)
2. `$HOME/.opencode/skills/<skill-name>/.env` (skill-specific)
3. `$HOME/.opencode/skills/.env` (shared skills)
4. `$HOME/.opencode/.env` (global)
5. `./.opencode/skills/${SKILL}/.env` (cwd)
6. `./.opencode/skills/.env` (cwd)
7. `./.opencode/.env` (cwd)

**Implementation pattern (Python):**

```python
from dotenv import load_dotenv
import os

# Load in reverse order (last loaded wins if not set)
load_dotenv('$HOME/.opencode/.env')
load_dotenv('$HOME/.opencode/skills/.env')
load_dotenv('$HOME/.opencode/skills/my-skill/.env')
load_dotenv('./.opencode/skills/my-skill/.env')
load_dotenv('./.opencode/skills/.env')
load_dotenv('./.opencode/.env')
# process.env already takes precedence
```

## Documentation Requirements

### .env.example
Show required variables without values:

```
API_KEY=
DATABASE_URL=
DEBUG=false
```

### requirements.txt (Python)
Pin major versions:

```
requests>=2.28.0
python-dotenv>=1.0.0
```

### package.json (Node.js)
Include scripts:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

## Manual Testing

Before packaging, test with real use cases:

```bash
# Example: PDF rotation script
python scripts/rotate_pdf.py input.pdf 90 output.pdf
```

Verify output matches expectations.

## Error Handling

- Clear error messages
- Graceful failures
- No silent errors
- Exit codes: 0 success, non-zero failure
