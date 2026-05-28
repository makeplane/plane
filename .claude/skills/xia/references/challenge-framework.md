# Challenge Framework

Use these prompts to stress-test a porting decision before it becomes implementation work.

## Universal Challenges

1. Necessity: do we need this feature, or only the idea behind it?
2. Simpler alternative: can the local codebase get 80% of the value with less complexity?
3. Existing overlap: do we already have part of this behavior?
4. Maintenance burden: who owns the imported behavior after the port?
5. Dependency chain: what new dependencies, services, or operational costs does this introduce?

## Architecture Challenges

| Question            | Red Flag                                                | Green Flag                    |
| ------------------- | ------------------------------------------------------- | ----------------------------- |
| Architecture match? | Different paradigm, lifecycle, or state model           | Same or very similar patterns |
| Coupling?           | Spans many unrelated modules                            | Mostly self-contained         |
| New patterns?       | Requires new ORM, state manager, or auth model          | Reuses local patterns         |
| Blast radius?       | Touches auth, payments, or core data flows              | Failure is isolated           |
| Scaling model?      | Source assumptions conflict with local tenancy or scale | Operationally compatible      |

## Decision Matrix Template

```markdown
| #   | Decision | Source's Way | Local Way       | Hybrid  | Risk   | Choice |
| --- | -------- | ------------ | --------------- | ------- | ------ | ------ |
| 1   | Auth     | passport.js  | existing auth   | wrapper | low    | local  |
| 2   | Schema   | 5 tables     | 2 tables + join | partial | medium | hybrid |
```

## Risk Scoring

| Critical Count | Risk   | Action                                 |
| -------------- | ------ | -------------------------------------- |
| 0-2            | Low    | Proceed                                |
| 3-4            | Medium | Resolve the critical assumptions first |
| 5+             | High   | Start with `--compare` or stop         |

Treat a risk as critical when being wrong could cause data loss, a security issue, or more than two days of rework.
