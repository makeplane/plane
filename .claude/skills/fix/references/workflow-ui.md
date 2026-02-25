# UI Fix Workflow

For fixing visual/UI issues. Requires design skills.

## Required Skills (activate in order)
1. `ui-ux-pro-max` - Design database (ALWAYS FIRST)
2. `ui-ux-pro-max` - Design principles
3. `frontend-design` - Implementation patterns

## Pre-fix Research
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<style>" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility" --domain ux
```

## Workflow

1. **Analyze** screenshots/videos with `ai-multimodal` skill

2. **Implement** fix with `ui-ux-designer` agent

3. **Verify** with screenshot + `ai-multimodal` analysis
   - Capture parent container, not whole page
   - Compare to design guidelines
   - Iterate until correct

4. **DevTools check** with `chrome-devtools` skill

5. **Test** compilation with `tester` agent

6. **Document** updates to `./docs/design-guidelines.md` if needed

## Tips
- Read `./docs/design-guidelines.md` first
- Use `ai-multimodal` for generating visual assets
- Use `ImageMagick` for image editing
