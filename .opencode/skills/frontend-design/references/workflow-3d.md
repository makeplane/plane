# 3D Design Workflow

Create immersive interactive 3D designs with Three.js.

## Prerequisites
- Activate `ui-ux-pro-max` skill first
- Activate `threejs` skill for 3D and WebGL expertise
- Have `ai-multimodal` skill ready for asset generation

## Initial Research
Run `ui-ux-pro-max` searches:
```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "immersive 3d" --domain style
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "animation" --domain ux
```

## Workflow Steps

### 1. Create Implementation Plan
Use `ui-ux-designer` + `researcher` subagents:
- Create plan directory (use `## Naming` pattern)
- Write `plan.md` (<80 lines overview)
- Add `phase-XX-name.md` files
- Keep research reports under 150 lines

### 2. Implement with Three.js
Use `ui-ux-designer` subagent to build:
- Three.js scene setup
- Custom GLSL shaders
- GPU particle systems
- Cinematic camera controls
- Post-processing effects
- Interactive elements

### 3. Generate 3D Assets
Use `ai-multimodal` skill for:
- Textures and materials
- Skyboxes and environment maps
- Particle sprites
- Video backgrounds

Use `media-processing` skill for:
- Texture optimization for WebGL
- Normal/height map generation
- Sprite sheet creation
- Background removal
- Asset optimization

### 4. Verify & Report
- Test across devices
- Optimize for 60fps
- Report to user
- Request approval

### 5. Document
Update `./docs/design-guidelines.md` with:
- 3D design patterns
- Shader libraries
- Reusable components

## Technical Requirements

### Three.js Implementation
- Proper scene optimization
- Efficient draw calls
- LOD (Level of Detail) where needed
- Responsive canvas behavior
- Memory management

### Shader Development
- Custom vertex shaders
- Custom fragment shaders
- Uniform management
- Performance optimization

### Particle Systems
- GPU-accelerated rendering
- Efficient buffer geometry
- Point sprite optimization

### Post-Processing
- Render pipeline setup
- Effect composition
- Performance budgeting

## Implementation Stack
- Three.js - 3D rendering
- GLSL - Custom shaders
- HTML/CSS/JS - UI integration
- WebGL - GPU graphics

## Performance Targets
- 60fps minimum
- < 100ms initial load
- Responsive to viewport
- Mobile-friendly fallbacks

## Related
- `animejs.md` - UI animation patterns
- `technical-optimization.md` - Performance tips
- `asset-generation.md` - Asset creation
