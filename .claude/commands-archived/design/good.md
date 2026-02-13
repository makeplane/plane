---
description: Create an immersive design
argument-hint: [tasks]
---

Think hard to plan & start working on these tasks follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules: 
<tasks>$ARGUMENTS</tasks>

## Required Skills (Priority Order)
1. **`ui-ux-pro-max`** - Design intelligence database (ALWAYS ACTIVATE FIRST)
2. **`frontend-design`** - Screenshot analysis and design replication

**Ensure token efficiency while maintaining high quality.**

## Workflow:
1. **FIRST**: Run `ui-ux-pro-max` searches to gather design intelligence:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<style-keywords>" --domain style
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<mood>" --domain typography
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<industry>" --domain color
   ```
2. Use `researcher` subagent to research about design style, trends, fonts, colors, border, spacing, elements' positions, etc.
3. Use `ui-ux-designer` subagent to implement the design step by step based on the research.
4. If user doesn't specify, create the design in pure HTML/CSS/JS.
5. Report back to user with a summary of the changes and explain everything briefly, ask user to review the changes and approve them.
6. If user approves the changes, update the `./docs/design-guidelines.md` docs if needed.

## Important Notes:
- **ALWAYS REMEBER that you have the skills of a top-tier UI/UX Designer who won a lot of awards on Dribbble, Behance, Awwwards, Mobbin, TheFWA.**
- Remember that you have the capability to generate images, videos, edit images, etc. with `ai-multimodal` skills for image generation. Use them to create the design with real assets.
- Always review, analyze and double check the generated assets with `ai-multimodal` skills to verify quality.
- Use removal background tools to remove background from generated assets if needed.
- Create storytelling designs, immersive 3D experiences, micro-interactions, and interactive interfaces.
- Maintain and update `./docs/design-guidelines.md` docs if needed.