# Quality Copy Workflow

Thorough copy development with research, planning, and execution.

## When to Use

- High-stakes content (landing pages, sales pages, campaigns)
- Complex products/services requiring deep understanding
- Brand-critical messaging

## Workflow Steps

1. **Screenshots provided** → Use `ai-multimodal` skill for detailed context analysis
2. **Videos provided** → Use `ai-multimodal` video-analysis for comprehensive context
3. **Research** → Spawn multiple `researcher` agents in parallel:
   - Competitor messaging analysis
   - Target audience insights
   - Industry best practices
   - Product/service details
4. **Scout codebase** → `/scout:ext` (preferred) or `/scout` to find relevant files
5. **Plan** → Use `planner` agent to outline copy structure and strategy
6. **Write** → Use `fullstack-developer` agent to execute plan

## Quality Checklist

- [ ] Research validates messaging direction
- [ ] Plan reviewed against user requirements
- [ ] Copy follows chosen formula (AIDA, PAS, etc.)
- [ ] Multiple headline options provided
- [ ] CTAs tested for clarity
- [ ] Social proof integrated
- [ ] Objections anticipated and addressed

## Related References

- `copy-formulas.md` - Core copywriting structures
- `headline-templates.md` - Headline variations
- `landing-page-copy.md` - Page structure
- `writing-styles.md` - Voice and tone options
