# Immersive Design Workflow

Create award-quality designs with storytelling, 3D experiences, and micro-interactions.

## Prerequisites
- Activate `ui-ux-pro-max` skill first

## Initial Research
Run `ui-ux-pro-max` searches:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<style-keywords>" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<mood>" --domain typography
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<industry>" --domain color
```

## Workflow Steps

### 1. Research Phase
Use `researcher` subagent to investigate:
- Design style and current trends
- Font combinations and typography
- Color theory for the context
- Border and spacing patterns
- Element positioning principles
- Animation and interaction patterns

### 2. Design Implementation
Use `ui-ux-designer` subagent:
- Build step by step from research
- Create plan with `## Naming` pattern
- Default to HTML/CSS/JS if unspecified

### 3. Storytelling Elements
Incorporate:
- Narrative flow through scroll
- Emotional pacing
- Visual hierarchy for story beats
- Progressive disclosure of content

### 4. 3D Experiences
If applicable, integrate:
- Three.js scenes
- Interactive 3D elements
- Parallax depth effects
- WebGL enhancements

### 5. Micro-interactions
Add polish:
- Button feedback
- Form interactions
- Loading states
- Hover effects
- Scroll responses

### 6. Asset Generation
Use `ai-multimodal` skill:
- Generate high-quality visuals
- Create unique imagery
- Verify asset quality
- Remove backgrounds as needed

### 7. Verify & Report
- Review against inspiration
- Report to user
- Request approval
- Update `./docs/design-guidelines.md`

## Quality Standards
Match award-winning sites:
- Dribbble top shots
- Behance featured
- Awwwards winners
- Mobbin patterns
- TheFWA selections

## Design Principles
- **Bold aesthetic choices**: Commit fully to direction
- **Attention to detail**: Every pixel matters
- **Cohesive experience**: All elements work together
- **Memorable moments**: Create surprise and delight
- **Technical excellence**: Performance + polish

## Related
- `workflow-3d.md` - 3D implementation details
- `animejs.md` - Animation patterns
- `technical-best-practices.md` - Quality guidelines
