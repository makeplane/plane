# GKG Language Support

## Support Matrix

| Language | Definitions | Imports | Intra-file Refs | Cross-file Refs |
|----------|-------------|---------|-----------------|-----------------|
| Ruby | ✅ | ✅ | ✅ | ✅ |
| Java | ✅ | ✅ | ✅ | ✅ |
| Kotlin | ✅ | ✅ | ✅ | ✅ |
| Python | ✅ | ✅ | ✅ | 🚧 |
| TypeScript | ✅ | ✅ | ✅ | 🚧 |
| JavaScript | ✅ | ✅ | ✅ | 🚧 |

## Feature Definitions

**Definitions**: Classes, functions, methods, constants, interfaces extracted from AST.

**Imports**: Module/package imports tracked for dependency analysis.

**Intra-file Refs**: References to symbols within same file.

**Cross-file Refs**: References to symbols defined in other files. Critical for impact analysis.

## Fully Supported (Ruby, Java, Kotlin)

Complete semantic analysis:
- Go-to-definition across files
- Find all usages across codebase
- Full dependency graph
- Impact analysis for refactoring

## Partially Supported (Python, TS/JS)

Current capabilities:
- Definition extraction works
- Import tracking works
- Same-file reference tracking works

Limitations:
- Cross-file `get_references` may miss some usages
- `get_definition` may not resolve all external symbols
- Use with awareness of gaps

## Best Practices

### For Full Support Languages
Use all MCP tools confidently for complete analysis.

### For Partial Support Languages
1. Verify critical refactoring impacts manually
2. Use `search_codebase_definitions` for discovery
3. Cross-reference with `grep` for completeness
4. Supplement with repomix for context dumps

## Future Plans

Cross-file reference support for Python/TS/JS under active development. Check [GitLab Knowledge Graph](https://gitlab.com/gitlab-org/rust/knowledge-graph) for updates.
