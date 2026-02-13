# AI Artist Validation Workflow

Agent instructions for mandatory validation interview before image generation.

## Step 1: Parse Arguments

Extract from user input:
- **concept**: The subject/description (required)
- **--mode**: search (default), creative, or wild
- **--skip**: If present, use defaults and skip to Step 4

**Defaults for --skip mode:** Style=Photorealistic, Mood=Professional, Colors=Auto, Aspect=16:9

## Step 2: Interview User

Use `AskUserQuestion` with these 4 questions in a single call:

```json
{"questions": [
  {"question": "Visual style?", "header": "Style", "multiSelect": false, "options": [
    {"label": "Photorealistic (Recommended)", "description": "Professional photography, 8K"},
    {"label": "Cinematic", "description": "Film-like, dramatic lighting"},
    {"label": "Illustration", "description": "Digital art, stylized"},
    {"label": "Minimalist", "description": "Clean, white space"}
  ]},
  {"question": "Mood?", "header": "Mood", "multiSelect": false, "options": [
    {"label": "Professional", "description": "Corporate, trustworthy"},
    {"label": "Energetic", "description": "Dynamic, bold"},
    {"label": "Calm", "description": "Peaceful, serene"},
    {"label": "Dramatic", "description": "High contrast, intense"}
  ]},
  {"question": "Colors?", "header": "Colors", "multiSelect": false, "options": [
    {"label": "Auto-select (Recommended)", "description": "AI chooses"},
    {"label": "Warm tones", "description": "Oranges, reds"},
    {"label": "Cool tones", "description": "Blues, greens"},
    {"label": "High contrast", "description": "Blacks, neons"}
  ]},
  {"question": "Aspect ratio?", "header": "Ratio", "multiSelect": false, "options": [
    {"label": "16:9 (Recommended)", "description": "Widescreen"},
    {"label": "1:1", "description": "Square"},
    {"label": "9:16", "description": "Vertical"},
    {"label": "4:3", "description": "Standard"}
  ]}
]}
```

**Dynamic questions** (ask separately if concept matches):
- "banner/poster/thumbnail" → Ask about text space
- "product/showcase" → Ask about background preference

## Step 3: Build Prompt

Map answers to keywords:

| Style | Keywords |
|-------|----------|
| Photorealistic | photorealistic, professional photography, 8K, RAW |
| Cinematic | cinematic, film still, anamorphic, dramatic lighting |
| Illustration | digital illustration, artistic, stylized |
| Minimalist | minimalist, clean design, white space |

| Mood | Keywords |
|------|----------|
| Professional | professional, clean, corporate, polished |
| Energetic | dynamic, bold, vibrant, high energy |
| Calm | serene, peaceful, soft, tranquil |
| Dramatic | dramatic, high contrast, intense, moody |

| Colors | Keywords |
|--------|----------|
| Auto-select | (none) |
| Warm tones | warm palette, golden tones, amber |
| Cool tones | cool palette, blue tones, teal |
| High contrast | high contrast, bold blacks, neon |

**Template:** `[concept], [style], [mood], [colors]. Professional quality. NEVER add watermarks.`

## Step 4: Confirm & Generate

Show preview, then ask confirmation:

```json
{"questions": [{"question": "Generate?", "header": "Confirm", "multiSelect": false, "options": [
  {"label": "Yes, generate (Recommended)", "description": "Proceed"},
  {"label": "Edit prompt", "description": "Modify first"},
  {"label": "Start over", "description": "Re-answer"}
]}]}
```

**If "Edit prompt":** Ask user for edited text, use that instead.
**If "Start over":** Return to Step 2.

Run generation:
```bash
cd .claude/skills/ai-artist && .venv/bin/python3 scripts/generate.py "[concept]" \
  -o ./generated-$(date +%Y%m%d-%H%M%S).png \
  --mode [mode] \
  -ar [ratio] \
  -v
```

## Error Handling

| Error | Action |
|-------|--------|
| API key missing | Tell user to set GEMINI_API_KEY |
| Model error | Suggest `--model flash` |
| No concept | Ask user for concept |

## Output

```
[OK] Image generated: [path]
    Style: [style] | Mood: [mood] | Aspect: [ratio]

Tip: Use --skip to bypass interview next time.
```
