---
description: Create immersive interactive 3D designs with Three.js
argument-hint: [tasks]
---

Think hard to plan & start working on these tasks follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules:
<tasks>$ARGUMENTS</tasks>

## Required Skills (Priority Order)
1. **`ui-ux-pro-max`** - Design intelligence database (ALWAYS ACTIVATE FIRST)
2. **`threejs`** - Three.js/WebGL expertise
3. **`frontend-design`** - Implementation patterns

**Ensure token efficiency while maintaining high quality.**

## Workflow:
0. **FIRST**: Run `ui-ux-pro-max` searches for 3D design context:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "immersive 3d" --domain style
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "animation" --domain ux
   ```
1. Use `ui-ux-designer` subagent and `researcher` subagent to create a comprehensive 3D design plan following the progressive disclosure structure:
   - Create a directory using naming pattern from `## Naming` section.
   - Save the overview access point at `plan.md`, keep it generic, under 80 lines, and list each phase with status/progress and links.
   - For each phase, add `phase-XX-phase-name.md` files containing sections (Context links, Overview with date/priority/statuses, Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps).
   - Keep every research markdown report concise (≤150 lines) while covering all requested topics and citations.
2. Then use `ui-ux-designer` subagent to implement the plan step by step.
3. Create immersive 3D experiences using Three.js with particle effects, custom shaders, and interactive elements.
4. Leverage all available Gemini skills (ai-multimodal, ai-multimodal) for asset generation and validation.
5. Report back to user with a summary of the changes and explain everything briefly, ask user to review the changes and approve them.
6. If user approves the changes, update the `./docs/design-guidelines.md` docs if needed.

## 3D Design Requirements:
- Implement Three.js scenes with proper optimization
- Create custom GLSL shaders for unique visual effects
- Design GPU-accelerated particle systems
- Add immersive camera controls and cinematic effects
- Implement post-processing effects and render pipelines
- Ensure responsive behavior across all devices
- Optimize performance for real-time rendering
- Add interactive elements and smooth animations

## Gemini Skills Integration:

### ai-multimodal Skills & ImageMagick Skill (Asset Generation & Processing):
- Generate textures, skyboxes, and environment maps with ai-multimodal skills
- Create custom particle sprites and effect assets via ai-multimodal prompts
- Generate 3D object textures with specific styles using ai-multimodal skills
- Create video backgrounds for immersive scenes with ai-multimodal capabilities
- Apply camera movements, inpainting, and outpainting through ai-multimodal skills
- Refine, batch edit, and optimize outputs with imagemagick skill workflows

### ImageMagick Skill (Image Processing):
- Process and optimize textures for WebGL
- Create normal maps and height maps from images
- Generate sprite sheets for particle systems
- Remove backgrounds for transparent textures
- Resize and optimize assets for performance
- Apply masks for complex texture effects

### Eyes Tools (Visual Analysis):
- Analyze reference images for 3D scene composition
- Compare design mockups with implementation
- Validate texture quality and visual consistency
- Extract color palettes from reference materials
- Verify shader effects and visual output

## Implementation Stack:
- Three.js for 3D rendering
- GLSL for custom vertex and fragment shaders
- HTML/CSS/JS for UI integration
- WebGL for GPU-accelerated graphics
- Post-processing libraries for effects

## Notes:
- Remember that you have the capability to generate images, videos, edit images, etc. with ai-multimodal skill. Use them extensively to create realistic 3D assets.
- Always review, analyze and double check generated assets with ai-multimodal skill.
- Leverage ai-multimodal skills and imagemagick skill to create custom textures, particle sprites, environment maps, and visual effects.
- Use imagemagick skill to process and optimize all visual assets for WebGL performance.
- Test 3D scenes across different devices and optimize for smooth 60fps performance.
- Maintain and update `./docs/design-guidelines.md` docs with 3D design patterns and shader libraries.
- Document shader code, particle systems, and reusable 3D components for future reference.