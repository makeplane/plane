# Marp Basic Syntax Reference

Basic Marp syntax based on official documentation.

## Front Matter (Directives)

### Basic Structure

```markdown
---
marp: true
theme: default
paginate: true
---
```

### Main Global Directives

| Directive | Description | Example Values |
|-----------|-------------|----------------|
| `marp` | Enable Marp functionality | `true` |
| `theme` | Specify theme | `default`, `gaia`, `uncover` |
| `size` | Slide size (Marp Core extension) | `16:9`, `4:3`, `A4` |
| `paginate` | Show page numbers | `true`, `false` |
| `header` | Header for all slides | Any text |
| `footer` | Footer for all slides | Any text |
| `backgroundColor` | Background color | `#fff`, `white` |
| `backgroundImage` | Background image | `url('image.png')` |
| `color` | Text color | `#000`, `black` |
| `class` | Apply CSS class | `lead`, `invert` |

### Size Directive (Marp Core)

```markdown
---
size: 16:9
---
```

Available sizes:
- `16:9` (1280x720, default)
- `4:3` (960x720)
- `A4` (210mm x 297mm)

### Page-Specific Directives

To change settings per slide, use `<!-- directive_name: value -->` format:

```markdown
<!-- _class: lead -->
<!-- _backgroundColor: black -->
<!-- _color: white -->

# Apply only to this slide
```

**Meaning of underscore `_`**:
- Without `_`: Apply to all following slides
- With `_`: Apply to current slide only

## Slide Breaks

```markdown
---

# First Slide

---

# Next Slide

---
```

`---` (horizontal rule) switches to a new slide.

## Headers and Footers

### Global Settings

```markdown
---
header: 'Lecture Name'
footer: 'October 2024'
---
```

### Per-Slide Settings

```markdown
<!-- header: 'Section 1' -->
<!-- footer: 'Page number display' -->
```

### Disable

```markdown
<!-- header: '' -->
<!-- footer: '' -->
```

## Pagination (Page Numbers)

```markdown
---
paginate: true
---
```

Display position and style vary by theme.

Hide on specific slide:
```markdown
<!-- paginate: false -->
```

Or:
```markdown
<!-- _paginate: false -->
```

## Inline Styles

### Style Specification in Markdown

```markdown
---
marp: true
---

<style>
section {
  background-color: #f0f0f0;
}

h1 {
  color: #333;
}
</style>

# Slide
```

### Scoped Style

Apply style to specific slide only:

```markdown
<style scoped>
h1 {
  color: red;
}
</style>

# Red heading on this slide only
```

## Math Formulas (Marp Core Extension)

Supports Pandoc-style math formulas:

### Inline Math

```markdown
$E = mc^2$
```

### Block Math

```markdown
$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

## Emoji (Marp Core Extension)

```markdown
:smile: :+1: :sparkles:
```

Supports GitHub Emoji notation.

## Comments

HTML comments are not rendered:

```markdown
<!-- This is a comment -->
```

Directives are also written in comment format:

```markdown
<!-- _class: lead -->
```

## Official Reference Links

For details, refer to official documentation:

- **Directives List**: https://marpit.marp.app/directives
- **Marp Core Features**: https://github.com/marp-team/marp-core
- **Theme CSS Specification**: https://marpit.marp.app/theme-css
- **Official Site**: https://marp.app/

## Common Configuration Examples

### Basic Setup

```markdown
---
marp: true
theme: default
size: 16:9
paginate: true
---
```

### Title Slide

```markdown
---
marp: true
theme: default
---

<!-- _class: lead -->
<!-- _paginate: false -->

# Presentation Title

Presenter Name
```

### Section Breaks

```markdown
<!-- _class: lead -->

# Chapter 2

New Section

---

## Regular Slide
```

### Custom Background Color

```markdown
<!-- _backgroundColor: #e3f2fd -->

# Slide with Light Blue Background
```
