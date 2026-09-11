# Marp Image Syntax Reference

Image placement and styling methods based on official Marpit image syntax.

Official documentation: https://marpit.marp.app/image-syntax

## Basic Image Insertion

### Regular Images

```markdown
![](image.png)
![alt text](image.png)
```

Images are displayed as content.

### Size Specification

Marp allows adding size keywords to images:

```markdown
![width:600px](image.png)
![height:400px](image.png)
![w:600px h:400px](image.png)
```

**Supported units**:
- `px` - Pixels
- `%` - Percent
- `em`, `rem`, `cm`, `mm`, `in`, `pt`, `pc`

**Abbreviations**:
- `w:` = `width:`
- `h:` = `height:`

## Background Images (`bg` keyword)

### Basic Background Image

```markdown
![bg](image.png)
```

Places the image as a slide background. It doesn't overlap with text content and is positioned in the background.

### Background Size Keywords

```markdown
![bg fit](image.png)
![bg cover](image.png)
![bg contain](image.png)
![bg auto](image.png)
```

| Keyword | Behavior | CSS Equivalent |
|---------|----------|----------------|
| `fit` | Preserve aspect ratio, fit within slide | `background-size: contain` |
| `cover` | Preserve aspect ratio, cover entire slide | `background-size: cover` |
| `contain` | Same as `fit` | `background-size: contain` |
| `auto` | Original size | `background-size: auto` |

### Background Size (Numeric Values)

```markdown
![bg 80%](image.png)
![bg 1280px](image.png)
![bg 50% 80%](image.png)
```

Supports the same syntax as CSS `background-size` property.

## Split Backgrounds

You can split the screen using multiple background images.

### Basic Split

```markdown
![bg](image1.png)
![bg](image2.png)
```

Two images are displayed split left and right.

### Three or More Splits

```markdown
![bg](image1.png)
![bg](image2.png)
![bg](image3.png)
```

Three or more images are divided equally.

### Specifying Split Direction

Default is horizontal split, but vertical split is also possible:

```markdown
![bg vertical](image1.png)
![bg](image2.png)
```

Use `vertical` keyword to change to vertical split.

### Left/Right Alignment

```markdown
![bg left](image.png)
```

Places image on the left, reserving text space on the right.

```markdown
![bg right](image.png)
```

Places image on the right, reserving text space on the left.

### Size Ratio Specification

```markdown
![bg left:33%](image.png)
```

33% image on left, 67% text space on right.

```markdown
![bg right:60%](image.png)
```

60% image on right, 40% text space on left.

## Filter Effects

### Brightness Adjustment

```markdown
![brightness:0.5](image.png)
![brightness:1.5](image.png)
```

Value range: 0 (completely black) ~ 1 (normal) ~ 2+ (brighter)

### Contrast

```markdown
![contrast:0.8](image.png)
![contrast:1.5](image.png)
```

### Blur

```markdown
![blur:10px](image.png)
```

### Grayscale

```markdown
![grayscale](image.png)
![grayscale:1](image.png)
```

Value range: 0 (color) ~ 1 (full grayscale)

### Sepia

```markdown
![sepia](image.png)
![sepia:0.8](image.png)
```

### Hue Rotation

```markdown
![hue-rotate:180deg](image.png)
```

### Invert

```markdown
![invert](image.png)
![invert:0.8](image.png)
```

### Opacity

```markdown
![opacity:0.5](image.png)
```

### Saturation

```markdown
![saturate:2](image.png)
```

### Multiple Filters

```markdown
![brightness:1.2 contrast:1.1 saturate:1.3](image.png)
```

## Practical Pattern Examples

### Pattern 1: Text on Left, Image on Right

```markdown
## Product Introduction

![bg right:40%](product.png)

- Feature 1
- Feature 2
- Feature 3
```

### Pattern 2: Background Image + Overlay Text

```markdown
![bg brightness:0.5](hero.png)

# Catchphrase

Subtext
```

White text placed on darkened background.

### Pattern 3: Multiple Image Comparison

```markdown
![bg left:50%](before.png)
![bg right:50%](after.png)
```

Place Before/After side by side.

### Pattern 4: Vertical Comparison

```markdown
![bg vertical](image1.png)
![bg](image2.png)
```

Place images top and bottom.

### Pattern 5: Sized Regular Image

```markdown
## Diagram

![w:600px](diagram.png)

The above diagram shows...
```

### Pattern 6: 3-Split Layout

```markdown
![bg](image1.png)
![bg](image2.png)
![bg](image3.png)
```

### Pattern 7: Background with Filter Effects

```markdown
![bg blur:5px brightness:0.7](background.png)

# Easy-to-Read Text

Subdued background with blur and darkness
```

## Important Notes

1. **Background Images and Text**: `![bg]` images are placed on the background layer and do not overlap with text
2. **Multiple Background Order**: They are placed from left to right (or top to bottom) in the order written
3. **Filter Support**: Not all filters work in all environments
4. **Relative Paths**: Image paths are specified relative to the Markdown file

## Official Reference

For details, refer to official documentation:
- **Image syntax**: https://marpit.marp.app/image-syntax
