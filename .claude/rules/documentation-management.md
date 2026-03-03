# Project Documentation Management

### Roadmap & Changelog Maintenance

- **Project Roadmap** (`./docs/development-roadmap.md`): Living document tracking project phases, milestones, and progress
- **Project Changelog** (`./docs/project-changelog.md`): Detailed record of all significant changes, features, and fixes
- **System Architecture** (`./docs/system-architecture.md`): Detailed record of all significant changes, features, and fixes
- **Code Standards** (`./docs/code-standards.md`): Detailed record of all significant changes, features, and fixes

### Automatic Updates Required

- **After Feature Implementation**: Update roadmap progress status and changelog entries
- **After Major Milestones**: Review and adjust roadmap phases, update success metrics
- **After Bug Fixes**: Document fixes in changelog with severity and impact
- **After Security Updates**: Record security improvements and version updates
- **Weekly Reviews**: Update progress percentages and milestone statuses

### Documentation Triggers

The `project-manager` agent MUST update these documents when:

- A development phase status changes (e.g., from "In Progress" to "Complete")
- Major features are implemented or released
- Significant bugs are resolved or security patches applied
- Project timeline or scope adjustments are made
- External dependencies or breaking changes occur

### Update Protocol

1. **Before Updates**: Always read current roadmap and changelog status
2. **During Updates**: Maintain version consistency and proper formatting
3. **After Updates**: Verify links, dates, and cross-references are accurate
4. **Quality Check**: Ensure updates align with actual implementation progress

### Plans

### Plan Location

Save plans in `./plans` directory with timestamp and descriptive name.

**Format:** Use naming pattern from `## Naming` section injected by hooks.

**Example:** `plans/251101-1505-authentication-and-profile-implementation/`

#### File Organization

```
plans/
├── 20251101-1505-authentication-and-profile-implementation/
    ├── research/
    │   ├── researcher-XX-report.md
    │   └── ...
│   ├── reports/
│   │   ├── scout-report.md
│   │   ├── researcher-report.md
│   │   └── ...
│   ├── plan.md                                # Overview access point
│   ├── phase-01-setup-environment.md          # Setup environment
│   ├── phase-02-implement-database.md         # Database models
│   ├── phase-03-implement-api-endpoints.md    # API endpoints
│   ├── phase-04-implement-ui-components.md    # UI components
│   ├── phase-05-implement-authentication.md   # Auth & authorization
│   ├── phase-06-implement-profile.md          # Profile page
│   └── phase-07-write-tests.md                # Tests
└── ...
```

#### File Structure

##### Overview Plan (plan.md)

- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- Key dependencies

##### Phase Files (phase-XX-name.md)

Fully respect the `./docs/development-rules.md` file.
Each phase file should contain:

**Context Links**

- Links to related reports, files, documentation

**Overview**

- Priority
- Current status
- Brief description

**Key Insights**

- Important findings from research
- Critical considerations

**Requirements**

- Functional requirements
- Non-functional requirements

**Architecture**

- System design
- Component interactions
- Data flow

**Related Code Files**

- List of files to modify
- List of files to create
- List of files to delete

**Embedded Rules (MANDATORY — prevents attention dilution)**

- Extract ONLY rules relevant to THIS phase from `.claude/rules/`
- Embed them inline so AI sees rules at point-of-use
- Include checklist items specific to this phase's tech stack
- Example: frontend phase embeds color tokens, i18n, component rules
- Example: backend phase embeds ViewSet pattern, permission rules, activity tracking

**Implementation Steps**

- Detailed, numbered steps
- Specific instructions
- Reference embedded rules inline (e.g., "see Rule 2 above")

**Post-Phase Checklist (MANDATORY)**

- Phase-specific quality checks extracted from rules
- Must be verified before marking phase complete
- Frontend example: `[ ] All strings use t()`, `[ ] Color tokens correct`, `[ ] observer() on store components`
- Backend example: `[ ] BaseViewSet inherited`, `[ ] Activity tracking after mutations`, `[ ] Timezone conversion`

**Todo List**

- Checkbox list for tracking

**Success Criteria**

- Definition of done
- Validation methods

**Risk Assessment**

- Potential issues
- Mitigation strategies

**Security Considerations**

- Auth/authorization
- Data protection

**Next Steps**

- Dependencies
- Follow-up tasks

##### Phase Workflow (Attention Dilution Prevention)

Each phase should be implemented in a **fresh context** (`/clear` between phases):

```
1. Read phase-XX file (contains embedded rules + steps + checklist)
2. Implement all steps in the phase
3. Run post-phase checklist
4. Mark phase complete in plan.md
5. /clear context
6. Start next phase in fresh context
```

**Why:** Research confirms AI quality degrades as context grows. Fresh context per phase = focused attention = fewer mistakes.
