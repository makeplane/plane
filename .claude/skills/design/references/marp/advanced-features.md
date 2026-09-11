# Marp Advanced Features Reference

Advanced features of Marp Core and Marpit.

## Fragmented List (Progressive Display)

Feature to display list items progressively (animation effect).

Official documentation: https://github.com/marp-team/marpit/tree/main/docs/fragmented-list

### Basic Usage

```markdown
* Item 1
* Item 2
* Item 3
```

Normally, all items are displayed at once.

### Using Asterisks (*)

```markdown
* Item 1
* Item 2
* Item 3
```

When using `--html` option with Marp CLI, each item displays sequentially.

### Important Notes

- **Only effective in HTML output**: No effect in PDF/PPTX/images
- **Presentation mode**: Works during browser presentations
- **Marp for VS Code**: May not work in preview

## Math Notation (Marp Core Extension)

Supports Pandoc-style math formulas. Rendered using KaTeX.

Official: https://github.com/marp-team/marp-core#math-typesetting

### Inline Math

```markdown
Insert $E = mc^2$ in text
```

### Block Math

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### Multi-line Math

```markdown
$$
\begin{aligned}
  f(x) &= x^2 + 2x + 1 \\
  &= (x + 1)^2
\end{aligned}
$$
```

### Math Examples

```markdown
## Quadratic Formula

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

## Euler's Identity

$$
e^{i\pi} + 1 = 0
$$
```

### Important Notes

- **KaTeX notation**: Subset of LaTeX syntax
- **Unsupported notation**: Some LaTeX features not supported
- **KaTeX official**: https://katex.org/docs/supported.html

## Emoji (Marp Core Extension)

Supports GitHub Emoji notation.

Official: https://github.com/marp-team/marp-core#emoji

### Usage

```markdown
:smile: :heart: :+1: :sparkles:
```

Rendered result: 😄 ❤️ 👍 ✨

### Common Emoji

```markdown
:arrow_right: →
:check: ✓
:x: ✗
:bulb: 💡
:warning: ⚠️
:rocket: 🚀
:tada: 🎉
```

### Emoji List

Complete list: https://github.com/ikatyang/emoji-cheat-sheet

## Auto-scaling

Automatically adjusts font size when there's too much text.

### Disable

```markdown
---
marp: true
---

<!-- _class: no-scaling -->

# No auto-scaling
```

Control with custom CSS:

```css
section.no-scaling {
  --marpit-auto-scaling: off;
}
```

## Using HTML Tags

You can write HTML directly in Markdown.

### Alignment Control

```markdown
<div style="text-align: center;">
Centered text
</div>
```

### Two-Column Layout

```markdown
<div style="display: flex;">
<div style="flex: 1;">

## Left Side

- Point 1
- Point 2

</div>
<div style="flex: 1;">

## Right Side

- Point 3
- Point 4

</div>
</div>
```

### Styled Box

```markdown
<div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px;">

**Important Point**

Important content goes here

</div>
```

## Marp CLI Detailed Options

Official: https://github.com/marp-team/marp-cli

### Basic Commands

```bash
# Convert to HTML
marp slide.md

# Convert to PDF
marp slide.md --pdf

# Convert to PowerPoint
marp slide.md --pptx

# Convert to image
marp slide.md --images png
```

### Watch Mode

```bash
# Watch file and auto-convert
marp -w slide.md

# Watch in server mode
marp -s -w slide.md
```

### Specify Theme

```bash
# Use custom theme
marp slide.md --theme custom-theme.css

# Specify theme directory
marp slide.md --theme-set themes/
```

### Batch Convert Multiple Files

```bash
# Convert all Markdown in directory
marp slides/*.md

# Specify output directory
marp slides/*.md -o output/
```

### HTML Output Options

```bash
# HTML output (single file)
marp slide.md -o output.html

# Standalone HTML (using CDN)
marp slide.md --html
```

### PDF Output Options

```bash
# PDF output
marp slide.md --pdf --allow-local-files

# PDF without page numbers
marp slide.md --pdf --pdf-notes
```

### Image Output

```bash
# Output as PNG images
marp slide.md --images png

# Output as JPEG images
marp slide.md --images jpeg

# Specify resolution
marp slide.md --images png --image-scale 2
```

## Marp for VS Code

Official: https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode

### Enable

Write in Markdown file front matter:

```markdown
---
marp: true
---
```

### Preview

- `Ctrl+Shift+V` (Win/Linux)
- `Cmd+Shift+V` (Mac)

### Export

1. Command Palette (`Ctrl+Shift+P`)
2. Select "Marp: Export slide deck..."
3. Choose format (HTML/PDF/PPTX/PNG/JPEG)

### Settings

Customizable in VS Code settings:

```json
{
  "markdown.marp.themes": [
    "./themes/custom-theme.css"
  ],
  "markdown.marp.enableHtml": true
}
```

## Automated Build with GitHub Actions

Official: https://github.com/marketplace/actions/marp-action

### Basic Workflow

```yaml
name: Marp Build

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Marp Build
        uses: docker://marpteam/marp-cli:latest
        with:
          args: slides.md --pdf --allow-local-files

      - name: Upload PDF
        uses: actions/upload-artifact@v3
        with:
          name: slides
          path: slides.pdf
```

### Publish to GitHub Pages

```yaml
- name: Marp to Pages
  uses: docker://marpteam/marp-cli:latest
  with:
    args: slides.md -o index.html

- name: Deploy to Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./
```

## Tips & Tricks

### 1. Customize Slide Numbers

```css
section::after {
  content: 'Page ' attr(data-marpit-pagination);
}
```

### 2. Gradient Background

```markdown
---
backgroundImage: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
color: white
---
```

### 3. Two-Column Layout

```markdown
<div class="columns">
<div>

Left side content

</div>
<div>

Right side content

</div>
</div>

<style>
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
</style>
```

### 4. Progress Bar

```css
section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--paginate) / var(--paginate-total) * 100%);
  height: 5px;
  background-color: #3b82f6;
}
```

## Troubleshooting

### PDF Not Generated

- Check if Chrome or Edge is installed
- Add `--allow-local-files` option

### Fonts Not Displaying

- Load Google Fonts with `@import`
- Specify local fonts with absolute path

### Images Not Displaying

- Check image relative paths
- May need `--allow-local-files`

## Official References

- **Marp Official Site**: https://marp.app/
- **Marpit Directives**: https://marpit.marp.app/directives
- **Image Syntax**: https://marpit.marp.app/image-syntax
- **Theme CSS**: https://marpit.marp.app/theme-css
- **Marp Core**: https://github.com/marp-team/marp-core
- **Marp CLI**: https://github.com/marp-team/marp-cli
- **VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode
