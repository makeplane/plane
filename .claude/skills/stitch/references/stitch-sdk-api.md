# Stitch SDK API Reference

Condensed reference for `@google/stitch-sdk`. Agent-optimized — covers common operations only.

## Installation

```bash
npm install @google/stitch-sdk
# Optional: Vercel AI SDK integration
npm install @google/stitch-sdk ai
```

## Authentication

```bash
export STITCH_API_KEY="sk_..."  # From https://stitch.withgoogle.com/settings/api
```

SDK auto-reads `STITCH_API_KEY` from environment. No explicit config needed.

## Core API

### Stitch (root singleton)

```typescript
import { stitch } from "@google/stitch-sdk";

const projects = await stitch.projects();         // List all projects
const project = stitch.project("my-id");          // Get project handle (sync)
```

### Project

```typescript
const project = stitch.project("project-123");  // sync — returns handle

// Generate screen from prompt (positional params, uppercase device types)
const screen = await project.generate(
  "Login page with email/password",
  "MOBILE"  // optional: "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC"
);

const screens = await project.screens();           // List all screens
const screen = await project.getScreen(screenId);  // Get specific screen
```

### Screen

```typescript
// Export
const htmlUrl = await screen.getHtml();     // Returns download URL (HTML + Tailwind)
const imageUrl = await screen.getImage();   // Returns download URL (PNG screenshot)

// Edit/refine (positional: prompt, deviceType?, modelId?)
const edited = await screen.edit("Make colors darker, add search bar");

// Generate variants (positional: prompt, variantOptions, deviceType?, modelId?)
const variants = await screen.variants("Different color schemes", {
  variantCount: 3,            // 1-5 variants
  creativeRange: "medium",    // "low" | "medium" | "high"
  aspects: ["COLOR_SCHEME"]   // "COLOR_SCHEME" | "LAYOUT" | etc.
});
```

### StitchToolClient (low-level MCP access)

```typescript
import { StitchToolClient } from "@google/stitch-sdk";

const client = new StitchToolClient({ apiKey: "sk_..." });
const tools = await client.listTools();
const result = await client.callTool("create_project", { title: "My App" });
```

### Vercel AI SDK Integration

```typescript
import { stitchTools } from "@google/stitch-sdk/ai";
import { generateText } from "ai";

const { text } = await generateText({
  model: yourModel,
  tools: stitchTools(),
  prompt: "Create a modern dashboard"
});
```

## Type Definitions

```typescript
type DeviceType = "DEVICE_TYPE_UNSPECIFIED" | "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC";
type ModelId = "MODEL_ID_UNSPECIFIED" | "GEMINI_3_PRO" | "GEMINI_3_FLASH";

interface Stitch {
  projects(): Promise<Project[]>;
  createProject(title?: string): Promise<Project>;
  project(id: string): Project;  // sync — returns handle, no API call
}

interface Project {
  id: string;
  generate(prompt: string, deviceType?: DeviceType, modelId?: ModelId): Promise<Screen>;
  screens(): Promise<Screen[]>;
  getScreen(screenId: string): Promise<Screen>;
}

interface Screen {
  id: string;
  getHtml(): Promise<string>;   // Download URL
  getImage(): Promise<string>;  // Download URL
  edit(prompt: string, deviceType?: DeviceType, modelId?: ModelId): Promise<Screen>;
  variants(prompt: string, variantOptions: any, deviceType?: DeviceType, modelId?: ModelId): Promise<Screen[]>;
}

class StitchError extends Error {
  code: "AUTH_FAILED" | "NOT_FOUND" | "RATE_LIMITED" | string;
}
```

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| `AUTH_FAILED` | Bad/missing API key | Check `STITCH_API_KEY` env var |
| `NOT_FOUND` | Screen/project doesn't exist | Verify ID |
| `RATE_LIMITED` | Daily quota exceeded | Wait until midnight UTC or use fallback |

```typescript
try {
  const screen = await project.generate(prompt);
} catch (error) {
  if (error.code === "RATE_LIMITED") {
    console.error("Quota exceeded — use ck:ui-ux-pro-max fallback");
  }
}
```
