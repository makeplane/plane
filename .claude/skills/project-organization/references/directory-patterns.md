# Directory Patterns

Detailed patterns for each top-level category. See SKILL.md Rule 1 for overview.

## Documentation (`docs/`)

Evergreen project documentation for humans and AI agents.

```text
docs/
├── project-overview-pdr.md          # Product/project requirements
├── system-architecture.md           # Architecture & components
├── code-standards.md                # Coding conventions
├── codebase-summary.md              # Auto-generated structure overview
├── project-roadmap.md               # Milestones & progress
├── project-changelog.md             # Version history
├── design-guidelines.md             # UI/UX standards
├── deployment-guide.md              # Deploy procedures
├── journals/                        # Technical diary
│   └── {YYMMDD-HHmm}-{slug}.md     # Session reflections, decisions
└── decisions/                       # Architecture Decision Records
    └── {YYMMDD}-{slug}.md           # ADR documents
```

**Rules:**
- Evergreen docs: no date prefix, slug-only naming
- Journals: always timestamped, one per session/event
- ADRs: date-prefixed, sequential numbering optional
- Keep docs under 200 lines; split into subsections if needed

## Plans (`plans/`)

Implementation plans, research, and agent communication.

```text
plans/
├── {YYMMDD-HHmm}-{slug}/           # Timestamped plan folders
│   ├── plan.md                      # Overview (<80 lines)
│   ├── phase-{NN}-{name}.md         # Phase details
│   ├── research/                    # Research for this plan
│   │   └── researcher-{NN}-{topic}.md
│   └── reports/                     # Agent reports scoped to plan
│       ├── scout-report.md
│       ├── code-reviewer-report.md
│       └── tester-report.md
├── reports/                         # Standalone agent reports
│   └── {type}-{YYMMDD-HHmm}-{slug}.md
├── research/                        # Standalone research
│   └── researcher-{YYMMDD-HHmm}-{topic}.md
├── templates/                       # Reusable plan templates
│   └── {type}-template.md
└── visuals/                         # Generated diagrams/previews
    └── {slug}.{ext}
```

**Report type prefixes:** `scout-`, `researcher-`, `brainstorm-`, `code-reviewer-`, `tester-`, `debugger-`, `planner-`

**Rules:**
- Plan folders always timestamped
- Phase files: `phase-{NN}-{name}.md` with zero-padded numbers (01, 02...)
- Scoped reports go inside their plan folder
- Standalone reports go in `plans/reports/`
- plan.md: keep generic, under 80 lines, link to phase files

## Tests (`tests/`)

Test suites mirroring source structure.

```text
tests/
├── unit/                            # Unit tests
│   └── {module}.test.{ext}
├── integration/                     # Integration tests
│   └── {feature}.integration.{ext}
├── e2e/                             # End-to-end tests
│   └── {flow}.e2e.{ext}
├── fixtures/                        # Test data/fixtures
│   └── {name}.{ext}
└── helpers/                         # Shared test utilities
    └── {name}.{ext}
```

**Rules:**
- Mirror source directory structure where practical
- Use `.test.`, `.spec.`, `.integration.`, `.e2e.` suffixes
- Fixtures: descriptive names, no dates
- Follow project's existing test convention if one exists

## Scripts (`scripts/`)

Build, deploy, and utility scripts.

```text
scripts/
├── {action}-{target}.{ext}          # e.g., prepare-release-assets.cjs
├── {category}/                      # Group if 5+ scripts
│   └── {action}-{target}.{ext}
```

**Rules:**
- Kebab-case, verb-first naming: `generate-manifest.cjs`, `send-notification.py`
- Group into subdirs only when 5+ scripts in same category
- Include shebang line for shell scripts
- No date prefixes (versioned in git)

## Assets (`assets/`)

Media, branding, designs, and generated content.

```text
assets/
├── images/                          # Static images, screenshots
│   └── {slug}.{ext}
├── videos/                          # Video files
│   ├── {slug}/                      # Multi-file: self-contained folder
│   │   ├── master.mp4
│   │   ├── scene-{NN}.mp4
│   │   └── captions.srt
│   └── {slug}.mp4                   # Single file: flat
├── designs/                         # UI/UX designs, mockups
│   └── {project}/
│       ├── mockup-{variant}.{ext}
│       └── exports/
├── branding/                        # Logos, brand assets
│   └── {name}-{variant}.{ext}       # logo-dark.svg, logo-icon.png
├── generated/                       # AI-generated content
│   └── {type}/                      # images/, audio/, text/
│       └── {YYMMDD-HHmm}-{slug}.{ext}
└── {custom-type}/                   # Project-specific categories
    └── ...
```

**Rules:**
- Single file → flat in category dir
- Multi-file → self-contained subdirectory
- Variants: append `-{variant}` suffix (not separate folders)
- Size variants: `{name}-{width}x{height}.{ext}`
- Platform variants: `{name}-{platform}.{ext}`
- Generated content: always timestamped
- Custom categories allowed for project-specific needs

## Configuration (Root / `.config/`)

```text
project-root/
├── .env                             # Environment variables (gitignored)
├── .env.example                     # Env template (committed)
├── .gitignore
├── .eslintrc.*                      # Linter config
├── tsconfig.json                    # TypeScript config
├── package.json                     # Node.js manifest
└── .config/                         # Optional: grouped configs
    └── {tool}.{ext}
```

**Rules:**
- Follow ecosystem conventions (package.json at root, not in .config/)
- `.env` files: never commit actual secrets, only `.example` templates
- Group into `.config/` only if ecosystem supports it

## Guides (`guide/` or `guides/`)

User-facing reference documentation, tutorials.

```text
guide/
├── {topic}.md                       # Reference docs
├── {topic}.yaml                     # Structured data
└── {category}/                      # Group by category if 5+ files
    └── {topic}.md
```

**Rules:**
- Evergreen naming (no dates)
- Flat structure unless 5+ files warrant categorization
- Self-documenting names: `SKILLS.md`, `COMMANDS.md`, `ENVIRONMENT_RESOLVER.md`
