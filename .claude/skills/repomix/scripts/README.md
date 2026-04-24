# Repomix Scripts

Utility scripts for batch processing repositories with Repomix.

## repomix_batch.py

Batch process multiple repositories (local or remote) using the repomix CLI tool.

### Features

- Process multiple repositories in one command
- Support local and remote repositories
- Configurable output formats (XML, Markdown, JSON, Plain)
- Environment variable loading from multiple .env file locations
- Comprehensive error handling
- Progress reporting

### Installation

Requires Python 3.10+ and repomix CLI:

```bash
# Install repomix
npm install -g repomix

# Install Python dependencies (if needed)
pip install pytest pytest-cov pytest-mock  # For running tests
```

### Usage

**Process single repository:**
```bash
python repomix_batch.py /path/to/repo
```

**Process multiple repositories:**
```bash
python repomix_batch.py /repo1 /repo2 /repo3
```

**Process remote repositories:**
```bash
python repomix_batch.py owner/repo1 owner/repo2 --remote
```

**From JSON file:**
```bash
python repomix_batch.py -f repos.json
```

**With options:**
```bash
python repomix_batch.py /repo1 /repo2 \
  --style markdown \
  --output-dir output \
  --remove-comments \
  --include "src/**/*.ts" \
  --ignore "tests/**" \
  --verbose
```

### Configuration File Format

Create `repos.json` with repository configurations:

```json
[
  {
    "path": "/path/to/local/repo",
    "output": "custom-output.xml"
  },
  {
    "path": "owner/repo",
    "remote": true
  },
  {
    "path": "https://github.com/owner/repo",
    "remote": true,
    "output": "repo-output.md"
  }
]
```

### Environment Variables

Loads .env files in order of precedence:
1. Process environment (highest priority)
2. `./repomix/.env` (skill-specific)
3. `./skills/.env` (skills directory)
4. `./.claude/.env` (lowest priority)

### Command Line Options

```
positional arguments:
  repos                  Repository paths or URLs to process

options:
  -h, --help            Show help message
  -f, --file FILE       JSON file containing repository configurations
  --style {xml,markdown,json,plain}
                        Output format (default: xml)
  -o, --output-dir DIR  Output directory (default: repomix-output)
  --remove-comments     Remove comments from source files
  --include PATTERN     Include pattern (glob)
  --ignore PATTERN      Ignore pattern (glob)
  --no-security-check   Disable security checks
  -v, --verbose         Verbose output
  --remote              Treat all repos as remote URLs
```

### Examples

**Process local repositories:**
```bash
python repomix_batch.py /path/to/repo1 /path/to/repo2 --style markdown
```

**Process remote repositories:**
```bash
python repomix_batch.py yamadashy/repomix facebook/react --remote
```

**Mixed configuration:**
```bash
python repomix_batch.py \
  /local/repo \
  --remote owner/remote-repo \
  -f additional-repos.json \
  --style json \
  --remove-comments
```

**TypeScript projects only:**
```bash
python repomix_batch.py /repo1 /repo2 \
  --include "**/*.ts,**/*.tsx" \
  --ignore "**/*.test.ts,dist/" \
  --remove-comments \
  --style markdown
```

### Testing

Run tests with coverage:

```bash
cd tests
pytest test_repomix_batch.py -v --cov=repomix_batch --cov-report=term-missing
```

Current coverage: 99%

### Exit Codes

- `0` - All repositories processed successfully
- `1` - One or more repositories failed or error occurred

### Troubleshooting

**repomix not found:**
```bash
npm install -g repomix
```

**Permission denied:**
```bash
chmod +x repomix_batch.py
```

**Timeout errors:**
- Default timeout: 5 minutes per repository
- Reduce scope with `--include` patterns
- Exclude large directories with `--ignore`

**No repositories specified:**
- Provide repository paths as arguments
- Or use `-f` flag with JSON config file
