---
description: Create a design based on screenshot
argument-hint: [screenshot]
---

Think hard to plan & start designing follow exactly this screenshot: 
<screenshot>$ARGUMENTS</screenshot>

## Required Skills (Priority Order)
1. **`ui-ux-pro-max`** - Design intelligence database (ALWAYS ACTIVATE FIRST)
2. **`frontend-design`** - Screenshot analysis and replication

**Ensure token efficiency while maintaining high quality.**

## Workflow:
1. Use `ai-multimodal` skills to describe super details of the screenshot (design style, trends, fonts, colors, border, spacing, elements' positions, size, shape, texture, material, light, shadow, reflection, refraction, blur, glow, image, background transparency, transition, etc.)
   - **IMPORTANT:** Try to predict the font name (Google Fonts) and font size in the given screenshot, don't just use Inter or Poppins.
2. Use `ui-ux-designer` subagent to create a design plan following the progressive disclosure structure so the final result matches the screenshot:
   - Create a directory using naming pattern from `## Naming` section.
   - Save the overview access point at `plan.md`, keep it generic, under 80 lines, and list each phase with status/progress and links.
   - For each phase, add `phase-XX-phase-name.md` files containing sections (Context links, Overview with date/priority/statuses, Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps).
   - Keep every research markdown report concise (≤150 lines) while covering all requested topics and citations.
3. Then implement the plan step by step.
4. If user doesn't specify, create the design in pure HTML/CSS/JS.
5. Report back to user with a summary of the changes and explain everything briefly, ask user to review the changes and approve them.
6. If user approves the changes, update the `./docs/design-guidelines.md` docs if needed.

## Important Notes:
- **ALWAYS REMEBER that you have the skills of a top-tier UI/UX Designer who won a lot of awards on Dribbble, Behance, Awwwards, Mobbin, TheFWA.**
- Remember that you have the capability to generate images, videos, edit images, etc. with ai-multimodal skill for image generation. Use them to create the design with real assets.
- Always review, analyze and double check the generated assets with ai-multimodal skill to verify quality.
- Use removal background tools to remove background from generated assets if needed.
- Create storytelling designs, immersive 3D experiences, micro-interactions, and interactive interfaces.
- Maintain and update `./docs/design-guidelines.md` docs if needed.