# docs.json Configuration Reference

Complete reference for Mintlify's `docs.json` configuration file.

## Required Fields

```json
{
  "theme": "mint",
  "name": "Documentation Name",
  "colors": {
    "primary": "#0D9373"
  },
  "navigation": []
}
```

## Theme

Choose from 7 available themes:

- `mint` - Default, clean design
- `maple` - Warm, professional
- `palm` - Light, airy
- `willow` - Nature-inspired
- `linden` - Modern, minimal
- `almond` - Soft, neutral
- `aspen` - Bold, contemporary

## Branding

```json
{
  "logo": {
    "light": "/logo/light.svg",
    "dark": "/logo/dark.svg",
    "href": "https://example.com"
  },
  "favicon": "/favicon.svg",
  "name": "Product Name",
  "description": "Brief description for SEO",
  "thumbnails": {
    "og:image": "/images/og.png",
    "twitter:image": "/images/twitter.png"
  }
}
```

## Colors

```json
{
  "colors": {
    "primary": "#0D9373",
    "light": "#55D799",
    "dark": "#007A5A",
    "background": {
      "light": "#FFFFFF",
      "dark": "#0F1117"
    }
  }
}
```

## Styling

```json
{
  "eyebrows": "section",         // "section" | "breadcrumbs"
  "latex": true,                 // Enable LaTeX math rendering
  "codeblocks": {
    "theme": {
      "light": "github-light",
      "dark": "github-dark"
    }
  }
}
```

**Shiki themes:** github-light, github-dark, min-light, min-dark, nord, one-dark-pro, poimandres, rose-pine, slack-dark, slack-ochin, solarized-dark, solarized-light, vitesse-dark, vitesse-light

## Icons

```json
{
  "icon": {
    "library": "fontawesome"     // "fontawesome" | "lucide"
  }
}
```

## Fonts

```json
{
  "font": {
    "headings": "Inter",
    "body": "Inter",
    "code": "Fira Code"
  }
}
```

Use any Google Font name. Custom fonts loaded automatically.

## Appearance

```json
{
  "modeToggle": {
    "default": "light",          // "light" | "dark"
    "isHidden": false
  }
}
```

## Background

```json
{
  "background": {
    "image": "/images/background.png",
    "decoration": "grid",         // "grid" | "gradient" | "none"
    "color": "#FFFFFF"
  }
}
```

## Navbar

```json
{
  "navbar": {
    "links": [
      {
        "name": "Blog",
        "url": "https://example.com/blog"
      }
    ],
    "primary": {
      "type": "button",           // "button" | "github"
      "label": "Get Started",
      "url": "https://example.com/signup"
    }
  }
}
```

For GitHub:
```json
{
  "navbar": {
    "primary": {
      "type": "github",
      "url": "https://github.com/user/repo"
    }
  }
}
```

## Navigation

### Basic Structure

```json
{
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["introduction", "quickstart"]
    },
    {
      "group": "API Reference",
      "pages": [
        "api/overview",
        {
          "group": "Endpoints",
          "pages": ["api/users", "api/posts"]
        }
      ]
    }
  ]
}
```

### Tabs

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
    }
  ],
  "navigation": [
    {
      "group": "Docs",
      "pages": ["docs/intro"],
      "tab": "Documentation"
    },
    {
      "group": "Endpoints",
      "pages": ["api/users"],
      "tab": "API Reference"
    }
  ]
}
```

### Anchors

Global navigation anchors:

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
    }
  ]
}
```

### Dropdowns

```json
{
  "dropdowns": [
    {
      "name": "Resources",
      "icon": "book",
      "items": [
        {
          "name": "Blog",
          "url": "https://blog.example.com"
        },
        {
          "name": "Community",
          "url": "https://discord.gg/example"
        }
      ]
    }
  ]
}
```

### Products

Partition documentation into multiple products:

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
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["intro"],
      "product": "product-a"
    },
    {
      "group": "Setup",
      "pages": ["setup"],
      "product": "product-b"
    }
  ]
}
```

### Versions

Manage multiple documentation versions:

```json
{
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
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["v2/intro"],
      "version": "v2"
    },
    {
      "group": "Getting Started",
      "pages": ["v1/intro"],
      "version": "v1"
    }
  ]
}
```

### Languages

Support 28+ locales:

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
    }
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["en/intro"],
      "language": "en"
    },
    {
      "group": "Primeros Pasos",
      "pages": ["es/intro"],
      "language": "es"
    }
  ]
}
```

**Supported locales:** en, es, fr, de, it, pt, pt-BR, zh, zh-TW, ja, ko, ru, ar, hi, nl, pl, tr, sv, da, no, fi, cs, hu, ro, th, vi, id, ms

### Menus

Dropdown menus within tabs:

```json
{
  "tabs": [
    {
      "name": "Docs",
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

## Interaction

```json
{
  "interaction": {
    "drilldown": true              // Enable multi-level navigation
  }
}
```

## Metadata

```json
{
  "metadata": {
    "timestamp": "last-modified"   // Show last modified date
  }
}
```

## Footer

```json
{
  "footer": {
    "socials": {
      "twitter": "https://twitter.com/example",
      "github": "https://github.com/example",
      "discord": "https://discord.gg/example",
      "linkedin": "https://linkedin.com/company/example"
    },
    "links": [
      {
        "name": "Privacy Policy",
        "url": "https://example.com/privacy"
      },
      {
        "name": "Terms of Service",
        "url": "https://example.com/terms"
      }
    ]
  }
}
```

## Banner

```json
{
  "banner": {
    "content": "We're launching v2.0! [Read more →](/blog/v2)",
    "dismissible": true
  }
}
```

Supports MDX formatting in content.

## Search

```json
{
  "search": {
    "prompt": "Ask me anything..."
  }
}
```

## Error Pages

```json
{
  "errors": {
    "404": {
      "redirect": "/introduction",
      "title": "Page Not Found",
      "description": "The page you're looking for doesn't exist."
    }
  }
}
```

## Contextual Menu

```json
{
  "contextual": {
    "options": ["copy", "view", "chatgpt", "claude", "perplexity", "mcp", "cursor", "vscode"]
  }
}
```

Options:
- `copy` - Copy page content
- `view` - View raw markdown
- `chatgpt` - Open in ChatGPT
- `claude` - Open in Claude
- `perplexity` - Open in Perplexity
- `mcp` - Model Context Protocol integration
- `cursor` - Open in Cursor editor
- `vscode` - Open in VS Code

## API Configuration

```json
{
  "api": {
    "openapi": "/openapi.yaml",
    "asyncapi": "/asyncapi.yaml",
    "params": {
      "expanded": true
    },
    "playground": {
      "display": "interactive",    // "interactive" | "simple" | "none"
      "proxy": "https://api.example.com"
    },
    "examples": {
      "languages": ["bash", "python", "javascript", "go"],
      "defaults": {
        "bash": "curl",
        "python": "requests"
      },
      "prefill": {
        "apiKey": "your-api-key"
      },
      "autogenerate": true
    }
  }
}
```

## SEO

```json
{
  "seo": {
    "metatags": [
      {
        "name": "keywords",
        "content": "documentation, api, guide"
      }
    ],
    "indexing": "navigable"        // "navigable" | "all"
  }
}
```

## Integrations

### Analytics

```json
{
  "integrations": {
    "ga4": {
      "measurementId": "G-XXXXXXXXXX"
    },
    "posthog": {
      "apiKey": "phc_xxxx",
      "apiHost": "https://app.posthog.com"
    },
    "amplitude": {
      "apiKey": "xxx"
    },
    "clarity": {
      "projectId": "xxx"
    },
    "fathom": {
      "siteId": "xxx"
    },
    "gtm": {
      "tagId": "GTM-XXXXXXX"
    },
    "heap": {
      "appId": "xxx"
    },
    "hotjar": {
      "siteId": "xxx"
    },
    "logrocket": {
      "appId": "xxx/project"
    },
    "mixpanel": {
      "projectToken": "xxx"
    },
    "pirsch": {
      "code": "xxx"
    },
    "plausible": {
      "domain": "docs.example.com"
    }
  }
}
```

### Support

```json
{
  "integrations": {
    "intercom": {
      "appId": "xxx"
    },
    "front": {
      "chatId": "xxx"
    }
  }
}
```

### Marketing

```json
{
  "integrations": {
    "segment": {
      "writeKey": "xxx"
    },
    "hightouch": {
      "sourceId": "xxx"
    },
    "clearbit": {
      "publicKey": "xxx"
    }
  }
}
```

### Privacy

```json
{
  "integrations": {
    "osano": {
      "customerId": "xxx",
      "configId": "xxx"
    },
    "cookies": {
      "necessary": ["analytics"],
      "optional": ["marketing"]
    }
  }
}
```

### Telemetry

```json
{
  "integrations": {
    "telemetry": {
      "enabled": false
    }
  }
}
```

## Redirects

```json
{
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    },
    {
      "source": "/docs/:slug*",
      "destination": "/documentation/:slug*"
    }
  ]
}
```

## Complete Example

```json
{
  "theme": "mint",
  "name": "Acme Docs",
  "description": "Documentation for Acme products",
  "logo": {
    "light": "/logo/light.svg",
    "dark": "/logo/dark.svg"
  },
  "favicon": "/favicon.svg",
  "colors": {
    "primary": "#0D9373",
    "light": "#55D799",
    "dark": "#007A5A"
  },
  "navbar": {
    "links": [
      {"name": "Blog", "url": "https://blog.acme.com"}
    ],
    "primary": {
      "type": "github",
      "url": "https://github.com/acme/docs"
    }
  },
  "tabs": [
    {"name": "Docs", "url": "docs"},
    {"name": "API", "url": "api", "icon": "code"}
  ],
  "anchors": [
    {"name": "Community", "icon": "discord", "url": "https://discord.gg/acme"}
  ],
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["docs/introduction", "docs/quickstart"],
      "tab": "Docs"
    },
    {
      "group": "Endpoints",
      "pages": ["api/users", "api/posts"],
      "tab": "API"
    }
  ],
  "footer": {
    "socials": {
      "twitter": "https://twitter.com/acme",
      "github": "https://github.com/acme"
    }
  },
  "api": {
    "openapi": "/openapi.yaml",
    "playground": {
      "display": "interactive"
    }
  },
  "integrations": {
    "ga4": {
      "measurementId": "G-XXXXXXXXXX"
    }
  }
}
```
