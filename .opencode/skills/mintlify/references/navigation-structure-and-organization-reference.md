# Navigation Structure and Organization Reference

Complete guide for organizing documentation with Mintlify's navigation system.

## Navigation Hierarchy

Mintlify supports complex navigation structures with multiple organizational patterns.

### Basic Navigation

Simple page groups:

```json
{
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["introduction", "quickstart", "installation"]
    },
    {
      "group": "Core Concepts",
      "pages": ["concepts/overview", "concepts/architecture"]
    }
  ]
}
```

### Group Properties

```json
{
  "navigation": [
    {
      "group": "API Reference",
      "icon": "code",
      "tag": "New",
      "expanded": false,
      "pages": ["api/overview", "api/authentication"]
    }
  ]
}
```

**Properties:**
- `group` - Group title (required)
- `icon` - Icon from Font Awesome or Lucide
- `tag` - Badge text (e.g., "New", "Beta", "Deprecated")
- `expanded` - Expand group by default (boolean)
- `pages` - Array of page paths or nested groups (required)

## Pages

Reference MDX files without extension.

```json
{
  "navigation": [
    {
      "group": "Guides",
      "pages": [
        "guides/getting-started",
        "guides/authentication",
        "guides/deployment"
      ]
    }
  ]
}
```

**File mapping:**
- `"introduction"` → `/introduction.mdx`
- `"api/users"` → `/api/users.mdx`
- `"guides/quickstart"` → `/guides/quickstart.mdx`

## Nested Groups

Groups can contain nested groups (one level of nesting).

```json
{
  "navigation": [
    {
      "group": "API Reference",
      "pages": [
        "api/overview",
        {
          "group": "Users",
          "pages": ["api/users/list", "api/users/create", "api/users/get"]
        },
        {
          "group": "Posts",
          "pages": ["api/posts/list", "api/posts/create", "api/posts/get"]
        }
      ]
    }
  ]
}
```

## Tabs

Organize documentation into major sections with tabs.

```json
{
  "tabs": [
    {
      "name": "Documentation",
      "url": "docs"
    },
    {
      "name": "API Reference",
      "url": "api",
      "icon": "code"
    },
    {
      "name": "Guides",
      "url": "guides",
      "icon": "book"
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["docs/introduction", "docs/quickstart"],
      "tab": "Documentation"
    },
    {
      "group": "Endpoints",
      "pages": ["api/users", "api/posts"],
      "tab": "API Reference"
    },
    {
      "group": "Tutorials",
      "pages": ["guides/auth", "guides/deploy"],
      "tab": "Guides"
    }
  ]
}
```

**Tab properties:**
- `name` - Tab display name (required)
- `url` - URL path segment (required)
- `icon` - Tab icon

**Important:** Page paths must match tab URL:
- Tab `"url": "api"` → pages must start with `api/`
- Tab `"url": "docs"` → pages must start with `docs/`

## Menus

Dropdown menus within tabs for version/variant switching.

```json
{
  "tabs": [
    {
      "name": "Documentation",
      "url": "docs",
      "menu": [
        {
          "name": "v2.0",
          "url": "docs/v2"
        },
        {
          "name": "v1.0",
          "url": "docs/v1"
        }
      ]
    }
  ]
}
```

## Anchors

Global navigation anchors for external links.

### Global Anchors

Appear in top-level navigation:

```json
{
  "anchors": [
    {
      "name": "Community",
      "icon": "discord",
      "url": "https://discord.gg/example"
    },
    {
      "name": "Blog",
      "icon": "newspaper",
      "url": "https://blog.example.com"
    },
    {
      "name": "GitHub",
      "icon": "github",
      "url": "https://github.com/example/repo"
    },
    {
      "name": "Status",
      "icon": "activity",
      "url": "https://status.example.com"
    }
  ]
}
```

### Local Anchors

Anchors within specific tabs:

```json
{
  "tabs": [
    {
      "name": "API Reference",
      "url": "api"
    }
  ],
  "anchors": [
    {
      "name": "API Status",
      "icon": "activity",
      "url": "https://status.example.com/api",
      "tab": "API Reference"
    }
  ]
}
```

## Dropdowns

Top-level dropdown menus for resources.

```json
{
  "dropdowns": [
    {
      "name": "Resources",
      "icon": "book-open",
      "items": [
        {
          "name": "Blog",
          "url": "https://blog.example.com"
        },
        {
          "name": "Changelog",
          "url": "https://example.com/changelog"
        },
        {
          "name": "Status Page",
          "url": "https://status.example.com"
        },
        {
          "name": "Support",
          "url": "https://support.example.com"
        }
      ]
    },
    {
      "name": "Tools",
      "icon": "wrench",
      "items": [
        {
          "name": "API Explorer",
          "url": "https://api-explorer.example.com"
        },
        {
          "name": "SDK Generator",
          "url": "https://sdk.example.com"
        }
      ]
    }
  ]
}
```

## Products

Partition documentation into separate products with independent navigation.

```json
{
  "products": [
    {
      "name": "Product A",
      "slug": "product-a",
      "icon": "rocket"
    },
    {
      "name": "Product B",
      "slug": "product-b",
      "icon": "star"
    },
    {
      "name": "Product C",
      "slug": "product-c",
      "icon": "zap"
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["product-a/intro", "product-a/quickstart"],
      "product": "product-a"
    },
    {
      "group": "Getting Started",
      "pages": ["product-b/intro", "product-b/setup"],
      "product": "product-b"
    },
    {
      "group": "Overview",
      "pages": ["product-c/intro"],
      "product": "product-c"
    }
  ]
}
```

Users select product from top-level switcher. Each product has its own navigation tree.

## Versions

Manage multiple documentation versions.

```json
{
  "versions": [
    {
      "name": "v3.0",
      "slug": "v3"
    },
    {
      "name": "v2.0",
      "slug": "v2"
    },
    {
      "name": "v1.0 (Legacy)",
      "slug": "v1"
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["v3/introduction", "v3/installation"],
      "version": "v3"
    },
    {
      "group": "Getting Started",
      "pages": ["v2/introduction", "v2/installation"],
      "version": "v2"
    },
    {
      "group": "Getting Started",
      "pages": ["v1/introduction", "v1/installation"],
      "version": "v1"
    }
  ]
}
```

Users switch versions via dropdown. Each version maintains independent navigation.

## Languages

Multi-language documentation with i18n support.

```json
{
  "languages": [
    {
      "name": "English",
      "slug": "en"
    },
    {
      "name": "Español",
      "slug": "es"
    },
    {
      "name": "Français",
      "slug": "fr"
    },
    {
      "name": "Deutsch",
      "slug": "de"
    },
    {
      "name": "日本語",
      "slug": "ja"
    },
    {
      "name": "中文",
      "slug": "zh"
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["en/introduction", "en/quickstart"],
      "language": "en"
    },
    {
      "group": "Primeros Pasos",
      "pages": ["es/introduccion", "es/inicio-rapido"],
      "language": "es"
    },
    {
      "group": "Commencer",
      "pages": ["fr/introduction", "fr/demarrage"],
      "language": "fr"
    }
  ]
}
```

### Supported Locales

28+ languages supported:

- `en` - English
- `es` - Español
- `fr` - Français
- `de` - Deutsch
- `it` - Italiano
- `pt` - Português
- `pt-BR` - Português (Brasil)
- `zh` - 中文
- `zh-TW` - 中文 (台灣)
- `ja` - 日本語
- `ko` - 한국어
- `ru` - Русский
- `ar` - العربية
- `hi` - हिन्दी
- `nl` - Nederlands
- `pl` - Polski
- `tr` - Türkçe
- `sv` - Svenska
- `da` - Dansk
- `no` - Norsk
- `fi` - Suomi
- `cs` - Čeština
- `hu` - Magyar
- `ro` - Română
- `th` - ไทย
- `vi` - Tiếng Việt
- `id` - Bahasa Indonesia
- `ms` - Bahasa Melayu

## Combining Products, Versions, and Languages

Complex navigation with all organizational patterns:

```json
{
  "products": [
    {
      "name": "Platform API",
      "slug": "api"
    },
    {
      "name": "SDK",
      "slug": "sdk"
    }
  ],
  "versions": [
    {
      "name": "v2.0",
      "slug": "v2"
    },
    {
      "name": "v1.0",
      "slug": "v1"
    }
  ],
  "languages": [
    {
      "name": "English",
      "slug": "en"
    },
    {
      "name": "Español",
      "slug": "es"
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["api/v2/en/intro"],
      "product": "api",
      "version": "v2",
      "language": "en"
    },
    {
      "group": "Primeros Pasos",
      "pages": ["api/v2/es/intro"],
      "product": "api",
      "version": "v2",
      "language": "es"
    },
    {
      "group": "Getting Started",
      "pages": ["sdk/v2/en/intro"],
      "product": "sdk",
      "version": "v2",
      "language": "en"
    }
  ]
}
```

## Navigation Rules

### Nesting Rules

1. **One root-level element:** Choose tabs OR products OR simple groups
2. **One child type per level:** Groups can contain pages or groups, not both
3. **Max depth:** Limited nesting (typically 2-3 levels)

**Valid nesting:**
```json
{
  "navigation": [
    {
      "group": "API",
      "pages": [
        "api/overview",
        {
          "group": "Resources",
          "pages": ["api/users", "api/posts"]
        }
      ]
    }
  ]
}
```

**Invalid nesting:**
```json
{
  "navigation": [
    {
      "group": "API",
      "pages": [
        "api/overview",
        {
          "group": "Resources",
          "pages": [
            "api/users",
            {
              "group": "Nested too deep",
              "pages": ["api/deep"]
            }
          ]
        }
      ]
    }
  ]
}
```

### Path Consistency

Pages must match their organizational context:

```json
{
  "tabs": [
    {"name": "Docs", "url": "docs"},
    {"name": "API", "url": "api"}
  ],
  "products": [
    {"name": "Platform", "slug": "platform"}
  ],
  "versions": [
    {"name": "v2", "slug": "v2"}
  ],
  "languages": [
    {"name": "English", "slug": "en"}
  ],
  "navigation": [
    {
      "group": "Guide",
      "pages": ["api/platform/v2/en/introduction"],
      "tab": "API",
      "product": "platform",
      "version": "v2",
      "language": "en"
    }
  ]
}
```

Path structure: `{tab}/{product}/{version}/{language}/{page}`

## Drilldown Navigation

Enable multi-level expandable navigation.

```json
{
  "interaction": {
    "drilldown": true
  }
}
```

With drilldown enabled:
- Groups expand/collapse on click
- Deep nesting feels more navigable
- Better for complex documentation structures

## Icons

Use Font Awesome or Lucide icons in navigation.

### Font Awesome Icons

```json
{
  "icon": {
    "library": "fontawesome"
  },
  "navigation": [
    {
      "group": "Getting Started",
      "icon": "rocket",
      "pages": ["intro"]
    },
    {
      "group": "API Reference",
      "icon": "code",
      "pages": ["api"]
    }
  ]
}
```

Common Font Awesome icons:
- `rocket` - Getting started
- `book` - Documentation
- `code` - API reference
- `wrench` - Tools
- `star` - Features
- `shield` - Security
- `users` - Community
- `github` - GitHub
- `discord` - Discord

### Lucide Icons

```json
{
  "icon": {
    "library": "lucide"
  },
  "navigation": [
    {
      "group": "Guides",
      "icon": "book-open",
      "pages": ["guides"]
    },
    {
      "group": "Components",
      "icon": "layout",
      "pages": ["components"]
    }
  ]
}
```

Common Lucide icons:
- `book-open` - Guides
- `layout` - Components
- `terminal` - CLI
- `zap` - Quick start
- `shield-check` - Security
- `code-2` - API

## Complete Navigation Example

Full-featured navigation structure:

```json
{
  "icon": {
    "library": "fontawesome"
  },
  "tabs": [
    {
      "name": "Documentation",
      "url": "docs"
    },
    {
      "name": "API Reference",
      "url": "api",
      "icon": "code",
      "menu": [
        {"name": "v2.0", "url": "api/v2"},
        {"name": "v1.0", "url": "api/v1"}
      ]
    }
  ],
  "anchors": [
    {
      "name": "Community",
      "icon": "discord",
      "url": "https://discord.gg/example"
    },
    {
      "name": "GitHub",
      "icon": "github",
      "url": "https://github.com/example/repo"
    }
  ],
  "dropdowns": [
    {
      "name": "Resources",
      "icon": "book-open",
      "items": [
        {"name": "Blog", "url": "https://blog.example.com"},
        {"name": "Status", "url": "https://status.example.com"}
      ]
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "icon": "rocket",
      "pages": ["docs/introduction", "docs/quickstart"],
      "tab": "Documentation"
    },
    {
      "group": "Core Concepts",
      "icon": "book",
      "expanded": true,
      "pages": [
        "docs/concepts/overview",
        {
          "group": "Advanced",
          "pages": ["docs/concepts/architecture", "docs/concepts/security"]
        }
      ],
      "tab": "Documentation"
    },
    {
      "group": "Authentication",
      "icon": "shield",
      "pages": ["api/v2/auth/overview", "api/v2/auth/oauth"],
      "tab": "API Reference"
    },
    {
      "group": "Endpoints",
      "icon": "code",
      "pages": [
        {
          "group": "Users",
          "pages": ["api/v2/users/list", "api/v2/users/create"]
        },
        {
          "group": "Posts",
          "pages": ["api/v2/posts/list", "api/v2/posts/create"]
        }
      ],
      "tab": "API Reference"
    }
  ],
  "interaction": {
    "drilldown": true
  }
}
```
