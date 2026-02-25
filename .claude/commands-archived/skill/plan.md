---
description: Plan to create a new agent skill
argument-hint: [skill-name] [prompt]
---

Think harder.
First: Activate `skill-creator` skill and `claude-code-guide` subagent.
Use `docs-seeker` skills to search for documentation if needed.
Employ `sequential-thinking` or `problem-solving` skills for complex problem-solving that requires structured analysis
Finally, when creating a plan, activate `planning` skill.

## Arguments
SKILL: $1 (default: `*`)
PROMPT: $2 (default: empty)

## Your mission
Propose a plan to create a new skill in `.claude/skills/${SKILL}` directory. 
When you finish, ask user to review your plan:
- If the user approve: Write down a plan follow "Output Requirements", then ask user if they want to start implementing.
- If the user reject: Revise the plan or ask more questions to clarify more about the user's request (ask one question at the time), then repeat the review process.

## Additional instructions
<additional-instructions>$PROMPT</additional-instructions>

## Your Approach
1. **Question Everything**: Ask probing questions to fully understand the user's request, constraints, and true objectives. Don't assume - clarify until you're 100% certain.
2. **Brutal Honesty**: Provide frank, unfiltered feedback about ideas. If something is unrealistic, over-engineered, or likely to cause problems, say so directly. Your job is to prevent costly mistakes.
3. **Explore Alternatives**: Always consider multiple approaches. Present 2-3 viable solutions with clear pros/cons, explaining why one might be superior.
4. **Challenge Assumptions**: Question the user's initial approach. Often the best solution is different from what was originally envisioned.
5. **Consider All Stakeholders**: Evaluate impact on end users, developers, operations team, and business objectives.

## Output Requirements
An output implementation plan must also follow the progressive disclosure structure:
- Always keep in mind that `SKILL.md` and reference files should be token consumption efficient, so that **progressive disclosure** can be leveraged at best.
- `SKILL.md` is always short and concise, straight to the point, treat it as a quick reference guide.
- Create a directory using naming pattern from `## Naming` section.
- Save the overview access point at `plan.md`, keep it generic, under 80 lines, and list each phase with status/progress and links.
- For each phase, add `phase-XX-phase-name.md` files containing sections (Context links, Overview with date/priority/statuses, Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps).

**IMPORTANT:**
- Analyze the given task and use `AskUserQuestion` tool to ask for more details if needed.
- Ensure token consumption efficiency while maintaining high quality.
- Skills are not documentation, they are practical instructions for Claude Code to use the tools, packages, plugins or APIs to achieve the tasks.
- Each skill teaches Claude how to perform a specific development task, not what a tool does.
- Claude Code can activate multiple skills automatically to achieve the user's request.