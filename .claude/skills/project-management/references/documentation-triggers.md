# Documentation Triggers

## When to Update Docs

MUST update project documentation in `./docs` when:

| Trigger | Which Docs | Action |
|---------|-----------|--------|
| Phase status changes | project-roadmap.md | Update progress %, milestone status |
| Major feature complete | project-roadmap.md, codebase-summary.md | Add feature, update architecture |
| Bug fix (significant) | project-roadmap.md | Document fix, severity, impact |
| Security patch | project-roadmap.md, system-architecture.md | Record improvement |
| API contract changes | system-architecture.md, code-standards.md | Update endpoints, schemas |
| Architecture decision | system-architecture.md | Document decision + rationale |
| Scope/timeline change | project-roadmap.md | Adjust phases, dates |
| Dependencies updated | system-architecture.md | Record version changes |
| Breaking changes | code-standards.md | Document migration path |

## Documentation Files

```
./docs/
├── project-overview-pdr.md     # Product requirements
├── code-standards.md           # Coding conventions
├── codebase-summary.md         # Architecture overview
├── design-guidelines.md        # UI/UX standards
├── deployment-guide.md         # Deploy procedures
├── system-architecture.md      # System design
└── project-roadmap.md          # Milestones & progress
```

## Update Protocol

1. **Read current state:** Always read target doc before editing
2. **Analyze reports:** Review agent reports in plan reports directory
3. **Update content:** Modify progress %, statuses, dates, descriptions
4. **Cross-reference:** Ensure consistency across docs
5. **Validate:** Verify dates, versions, references accurate

## Quality Standards

- **Consistency:** Same formatting, versioning across all docs
- **Accuracy:** Progress %, dates, statuses reflect reality
- **Completeness:** Sufficient detail for stakeholder communication
- **Timeliness:** Update within same session as significant changes
- **Traceability:** Clear links between roadmap items and implementation

## Delegation Pattern

Use `docs-manager` subagent for documentation updates:

```
Task(
  subagent_type: "docs-manager",
  prompt: "Update ./docs for [changes]. Work context: [path]",
  description: "Update docs"
)
```

Project manager coordinates WHEN to update; docs-manager handles HOW.
