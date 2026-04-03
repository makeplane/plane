# GKG MCP Tools

7 Model Context Protocol tools for AI assistants. Available when server runs with `--register-mcp`.

## Endpoints

- **HTTP**: `http://localhost:27495/mcp`
- **SSE**: `http://localhost:27495/mcp/sse`

## Tools

### list_projects

List all indexed projects with paths.

**Use**: Discover available codebases before analysis.

**Returns**: Project names and absolute paths.

### search_codebase_definitions

Search for functions, classes, methods, constants, interfaces.

**Parameters**:
- `query`: Search terms
- `limit`: Max results (pagination)

**Use**: Find symbol definitions by name pattern.

**Returns**: Matching definitions with FQN and locations.

### index_project

Re-index a project to reflect code changes.

**Parameters**:
- `project_path`: Path to project

**Use**: Update graph after code modifications.

**Returns**: Statistics (files processed, definitions found).

### get_references

Find all usages of a specific definition.

**Parameters**:
- `definition_id`: Symbol identifier
- `project_path`: Project context

**Use**: Impact analysis, find call sites before refactoring.

**Returns**: All locations where symbol is referenced.

### read_definitions

Retrieve complete source code for multiple symbols.

**Parameters**:
- `definition_ids`: List of symbol IDs

**Use**: Batch-read implementations. Token-efficient for same-file symbols.

**Returns**: Full definition bodies.

### get_definition

Navigate to definition of a call on specific line.

**Parameters**:
- `file_path`: Source file
- `line`: Line number
- `column`: Column position

**Use**: Go-to-definition for function/method calls.

**Returns**: Definition location (handles workspace and external deps).

### repo_map

Generate token-efficient ASCII tree of repository structure.

**Parameters**:
- `project_path`: Repository path
- `depth`: Tree depth limit

**Use**: Quick codebase overview for LLMs.

**Returns**: Compact tree with condensed definitions, human-readable.

## Integration Pattern

```
1. list_projects → discover codebases
2. search_codebase_definitions → find symbols
3. read_definitions → get implementations
4. get_references → find usages
5. repo_map → architecture overview
```
