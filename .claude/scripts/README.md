# Claude Code Scripts

Centralized utility scripts for Claude Code skills.

## Installation

Install required dependencies:

```bash
pip install -r requirements.txt
```

## resolve_env.py

Centralized environment variable resolver that follows Claude Code's hierarchy.

### Priority Order (Highest to Lowest)

1. **process.env** - Runtime environment variables (HIGHEST)
2. **PROJECT/.claude/skills/\<skill\>/.env** - Project skill-specific
3. **PROJECT/.claude/skills/.env** - Project shared across skills
4. **PROJECT/.claude/.env** - Project global defaults
5. **~/.claude/skills/\<skill\>/.env** - User skill-specific
6. **~/.claude/skills/.env** - User shared across skills
7. **~/.claude/.env** - User global defaults (LOWEST)

### CLI Usage

```bash
# Resolve a variable for a specific skill
python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --skill ai-multimodal

# With verbose output
python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --skill ai-multimodal --verbose

# Find all locations where variable is defined
python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --find-all

# Show hierarchy for a skill
python ~/.claude/scripts/resolve_env.py --show-hierarchy --skill ai-multimodal

# Export format for shell sourcing
eval $(python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --export)
```

### Python API Usage

```python
# Add to sys.path if needed
import sys
from pathlib import Path
sys.path.insert(0, str(Path.home() / '.claude' / 'scripts'))

from resolve_env import resolve_env, find_all, show_hierarchy

# Simple resolution
api_key = resolve_env('GEMINI_API_KEY', skill='ai-multimodal')

# With default value
api_key = resolve_env('GEMINI_API_KEY', skill='ai-multimodal', default='fallback-key')

# With verbose output
api_key = resolve_env('GEMINI_API_KEY', skill='ai-multimodal', verbose=True)

# Find all locations
locations = find_all('GEMINI_API_KEY', skill='ai-multimodal')
for description, value, path in locations:
    print(f"{description}: {value}")

# Show hierarchy
show_hierarchy(skill='ai-multimodal')
```

### Integration Pattern

Skills should use this script instead of implementing their own resolution logic:

```python
#!/usr/bin/env python3
import sys
from pathlib import Path

# Import centralized resolver
sys.path.insert(0, str(Path.home() / '.claude' / 'scripts'))
from resolve_env import resolve_env

# Resolve API key
api_key = resolve_env('GEMINI_API_KEY', skill='ai-multimodal')

if not api_key:
    print("Error: GEMINI_API_KEY not found")
    print("Run: python ~/.claude/scripts/resolve_env.py --show-hierarchy --skill ai-multimodal")
    sys.exit(1)

# Use api_key...
```

### Benefits

- **Consistent**: All skills use the same resolution logic
- **Maintainable**: Single source of truth for hierarchy
- **Debuggable**: Built-in verbose mode and find-all functionality
- **Flexible**: Supports both project-local and user-global configs
- **Clear**: Shows exactly where each value comes from

### Testing

```bash
# Test without any config files
python ~/.claude/scripts/resolve_env.py TEST_VAR --verbose

# Test with environment variable
export TEST_VAR=from-runtime
python ~/.claude/scripts/resolve_env.py TEST_VAR --verbose

# Test with skill context
python ~/.claude/scripts/resolve_env.py GEMINI_API_KEY --skill ai-multimodal --find-all
```

## generate_catalogs.py

Generate YAML catalogs from command and skill data files. Outputs to stdout by default for easy consumption by Claude.

### Usage

```bash
# Generate skills catalog (outputs to stdout)
python .claude/scripts/generate_catalogs.py --skills

# Generate commands catalog (outputs to stdout)
python .claude/scripts/generate_catalogs.py --commands

# Generate both catalogs (outputs to stdout)
python .claude/scripts/generate_catalogs.py

# Write to file instead of stdout
python .claude/scripts/generate_catalogs.py --skills --output guide/SKILLS.yaml

# View help
python .claude/scripts/generate_catalogs.py --help
```

### Input Files

Located in the same directory as the script:

- `commands_data.yaml` - Source data for commands
- `skills_data.yaml` - Source data for skills

### Output

By default, outputs YAML to stdout. Use `--output PATH` to write to a file instead.

**Note:** The script can be run from any directory - it resolves input files relative to the script location.
