# Configuration Reference

Detailed configuration options for Repomix.

## Configuration File

Create `repomix.config.json` in project root:

```json
{
  "output": {
    "filePath": "repomix-output.xml",
    "style": "xml",
    "removeComments": false,
    "showLineNumbers": true,
    "copyToClipboard": false
  },
  "include": ["**/*"],
  "ignore": {
    "useGitignore": true,
    "useDefaultPatterns": true,
    "customPatterns": ["additional-folder", "**/*.log", "**/tmp/**"]
  },
  "security": {
    "enableSecurityCheck": true
  }
}
```

### Output Options

- `filePath`: Output file path (default: `repomix-output.xml`)
- `style`: Format - `xml`, `markdown`, `json`, `plain` (default: `xml`)
- `removeComments`: Strip comments (default: `false`). Supports HTML, CSS, JS/TS, Vue, Svelte, Python, PHP, Ruby, C, C#, Java, Go, Rust, Swift, Kotlin, Dart, Shell, YAML
- `showLineNumbers`: Include line numbers (default: `true`)
- `copyToClipboard`: Auto-copy output (default: `false`)

### Include/Ignore

- `include`: Glob patterns for files to include (default: `["**/*"]`)
- `useGitignore`: Respect .gitignore (default: `true`)
- `useDefaultPatterns`: Use default ignore patterns (default: `true`)
- `customPatterns`: Additional ignore patterns (same format as .gitignore)

### Security

- `enableSecurityCheck`: Scan for sensitive data with Secretlint (default: `true`)
- Detects: API keys, passwords, credentials, private keys, AWS secrets, DB connections

## Glob Patterns

**Wildcards:**
- `*` - Any chars except `/`
- `**` - Any chars including `/`
- `?` - Single char
- `[abc]` - Char from set
- `{js,ts}` - Either extension

**Examples:**
- `**/*.ts` - All TypeScript
- `src/**` - Specific dir
- `**/*.{js,jsx,ts,tsx}` - Multiple extensions
- `!**/*.test.ts` - Exclude tests

### CLI Options

```bash
# Include patterns
repomix --include "src/**/*.ts,*.md"

# Ignore patterns
repomix -i "tests/**,*.test.js"

# Disable .gitignore
repomix --no-gitignore

# Disable defaults
repomix --no-default-patterns
```

### .repomixignore File

Create `.repomixignore` for Repomix-specific patterns (same format as .gitignore):

```
# Build artifacts
dist/
build/
*.min.js
out/

# Test files
**/*.test.ts
**/*.spec.ts
coverage/
__tests__/

# Dependencies
node_modules/
vendor/
packages/*/node_modules/

# Large files
*.mp4
*.zip
*.tar.gz
*.iso

# Sensitive files
.env*
secrets/
*.key
*.pem

# IDE files
.vscode/
.idea/
*.swp

# Logs
logs/
**/*.log
```

### Pattern Precedence

Order (highest to lowest priority):
1. CLI ignore patterns (`-i`)
2. `.repomixignore` file
3. Custom patterns in config
4. `.gitignore` (if enabled)
5. Default patterns (if enabled)

### Pattern Examples

**TypeScript:**
```json
{"include": ["**/*.ts", "**/*.tsx"], "ignore": {"customPatterns": ["**/*.test.ts", "dist/"]}}
```

**React:**
```json
{"include": ["src/**/*.{js,jsx,ts,tsx}", "*.md"], "ignore": {"customPatterns": ["build/"]}}
```

**Monorepo:**
```json
{"include": ["packages/*/src/**"], "ignore": {"customPatterns": ["packages/*/dist/"]}}
```

## Output Formats

### XML (Default)
```bash
repomix --style xml
```
Structured AI consumption. Features: tags, hierarchy, metadata, AI-optimized separators.
Use for: LLMs, structured analysis, programmatic parsing.

### Markdown
```bash
repomix --style markdown
```
Human-readable with syntax highlighting. Features: syntax highlighting, headers, TOC.
Use for: documentation, code review, sharing.

### JSON
```bash
repomix --style json
```
Programmatic processing. Features: structured data, easy parsing, metadata.
Use for: API integration, custom tooling, data analysis.

### Plain Text
```bash
repomix --style plain
```
Simple concatenation. Features: no formatting, minimal overhead.
Use for: simple analysis, minimal processing.

## Advanced Options

```bash
# Verbose - show processing details
repomix --verbose

# Custom config file
repomix -c /path/to/custom-config.json

# Initialize config
repomix --init

# Disable line numbers - smaller output
repomix --no-line-numbers
```

### Performance

**Worker Threads:** Parallel processing handles large codebases efficiently (e.g., facebook/react: 29x faster, 123s → 4s)

**Optimization:**
```bash
# Exclude unnecessary files
repomix -i "node_modules/**,dist/**,*.min.js"

# Specific directories only
repomix --include "src/**/*.ts"

# Remove comments, disable line numbers
repomix --remove-comments --no-line-numbers
```
