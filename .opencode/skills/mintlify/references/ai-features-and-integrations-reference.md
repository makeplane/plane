# AI Features and Integrations Reference

Complete guide for Mintlify's AI-powered features including AI assistant, llms.txt, MCP, and automation.

## AI Assistant

Built-in AI assistant for documentation search and Q&A.

### Configuration

Enable AI assistant in `docs.json`:

```json
{
  "search": {
    "prompt": "Ask me anything about our documentation..."
  }
}
```

### Features

**Conversational Search:**
- Natural language queries
- Context-aware responses
- Source citations from docs
- Follow-up questions

**Capabilities:**
- Search across all documentation
- Answer technical questions
- Provide code examples
- Navigate to relevant pages
- Suggest related content

### Customization

**Custom Prompt:**
```json
{
  "search": {
    "prompt": "How can I help you with the API?",
    "placeholder": "Ask about authentication, endpoints, or SDKs..."
  }
}
```

**Search Scope:**
```json
{
  "search": {
    "scope": ["api", "guides"],
    "exclude": ["internal", "deprecated"]
  }
}
```

## llms.txt

Optimize documentation for LLM consumption and indexing.

### What is llms.txt?

Special file format that makes documentation machine-readable for AI models:
- Structured content for LLMs
- Optimized token usage
- Hierarchical organization
- Metadata for context

### Auto-Generation

Mintlify automatically generates `llms.txt` from your documentation.

**Access:** `https://docs.example.com/llms.txt`

### Manual Configuration

Customize llms.txt generation:

```json
{
  "ai": {
    "llmsTxt": {
      "enabled": true,
      "include": ["introduction", "api/*", "guides/*"],
      "exclude": ["internal/*", "deprecated/*"],
      "format": "structured"
    }
  }
}
```

### llms.txt Format

Generated file structure:

```
# Product Name Documentation

## Overview
Brief description of product and documentation

## Getting Started
> /introduction
Quick introduction to get started

> /quickstart
Step-by-step quickstart guide

## API Reference
> /api/authentication
Authentication methods and API keys

> /api/users
User management endpoints

> /api/posts
Post creation and management

## Guides
> /guides/deployment
Deployment guide for production

> /guides/security
Security best practices
```

### Use Cases

**Feed to LLMs:**
- Provide entire docs context to ChatGPT, Claude, etc.
- Enable AI to answer questions about your product
- Generate code examples based on documentation

**RAG Systems:**
- Index for retrieval-augmented generation
- Build custom AI assistants
- Create documentation chatbots

## skill.md

Make documentation agent-ready with skill definitions.

### What is skill.md?

Defines your API/product as a "skill" that AI agents can execute:
- Function signatures
- Parameter schemas
- Authentication requirements
- Example usage

### Generation

Mintlify auto-generates `skill.md` from OpenAPI specs.

**Access:** `https://docs.example.com/skill.md`

### Format

```markdown
# API Skills

## Create User

Create a new user account

**Function:** `createUser`

**Parameters:**
- `email` (string, required) - User email address
- `name` (string, required) - Full name
- `password` (string, required) - Password (min 8 chars)

**Returns:** User object with ID and timestamps

**Example:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## List Users

Retrieve paginated list of users

**Function:** `listUsers`

**Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)
- `sort` (string, optional) - Sort field (default: created_at)

**Returns:** Array of user objects with pagination metadata
```

### Configuration

Customize skill.md generation:

```json
{
  "ai": {
    "skillMd": {
      "enabled": true,
      "includeExamples": true,
      "includeErrors": true,
      "format": "agent-ready"
    }
  }
}
```

### Use Cases

**AI Agents:**
- Claude Code, Cursor, Windsurf
- Auto-discover API capabilities
- Generate correct API calls
- Handle errors appropriately

**Documentation Tools:**
- Auto-complete in IDEs
- API client generation
- Testing frameworks

## MCP (Model Context Protocol)

Expose documentation through Model Context Protocol for AI tools.

### What is MCP?

Protocol that allows AI tools to access and interact with documentation:
- Standardized interface
- Real-time doc access
- Function calling support
- Resource discovery

### Configuration

Enable MCP in `docs.json`:

```json
{
  "contextual": {
    "options": ["mcp"]
  },
  "ai": {
    "mcp": {
      "enabled": true,
      "endpoint": "/mcp",
      "capabilities": ["read", "search", "navigate"]
    }
  }
}
```

### MCP Capabilities

**Resources:**
- List all documentation pages
- Read page content
- Access metadata

**Search:**
- Full-text search
- Semantic search
- Filter by section

**Navigation:**
- Get navigation structure
- Find related pages
- Access breadcrumbs

### MCP Client Integration

**Claude Desktop:**
```json
{
  "mcpServers": {
    "docs": {
      "url": "https://docs.example.com/mcp",
      "apiKey": "optional-key"
    }
  }
}
```

**VSCode with Continue:**
```json
{
  "contextProviders": [
    {
      "name": "docs",
      "type": "mcp",
      "url": "https://docs.example.com/mcp"
    }
  ]
}
```

## Contextual Menu Options

Quick access to AI tools from documentation pages.

### Configuration

```json
{
  "contextual": {
    "options": [
      "copy",
      "view",
      "chatgpt",
      "claude",
      "perplexity",
      "mcp",
      "cursor",
      "vscode"
    ]
  }
}
```

### Available Options

**copy** - Copy page content to clipboard
```
Copies: Markdown content with frontmatter
Use: Paste into any editor or tool
```

**view** - View raw markdown source
```
Opens: Raw .mdx file content
Use: See exact markdown structure
```

**chatgpt** - Open in ChatGPT
```
Action: Opens ChatGPT with page context
Prompt: "Explain this documentation: [content]"
```

**claude** - Open in Claude
```
Action: Opens Claude.ai with page context
Prompt: "Help me understand: [content]"
```

**perplexity** - Open in Perplexity
```
Action: Search Perplexity with page topic
Query: Key concepts from page
```

**mcp** - Copy MCP resource URI
```
Copies: MCP resource identifier
Use: Reference in MCP-enabled tools
```

**cursor** - Open in Cursor editor
```
Action: cursor://open?url=[page-url]
Use: Edit in Cursor IDE
```

**vscode** - Open in VS Code
```
Action: vscode://file/[local-path]
Use: Edit in VS Code
```

### Custom Options

Add custom contextual menu items:

```json
{
  "contextual": {
    "custom": [
      {
        "name": "Open in Notion",
        "icon": "notion",
        "url": "https://notion.so/import?url={pageUrl}"
      },
      {
        "name": "Translate",
        "icon": "language",
        "url": "https://translate.google.com/?text={content}"
      }
    ]
  }
}
```

## Discord Bot

AI-powered Discord bot for documentation queries.

### Setup

1. **Enable Bot:**
   - Go to Mintlify dashboard
   - Navigate to Integrations > Discord
   - Click "Enable Discord Bot"

2. **Add to Server:**
   - Copy bot invite URL
   - Open in browser
   - Select Discord server
   - Authorize permissions

3. **Configure:**
   ```json
   {
     "integrations": {
       "discord": {
         "enabled": true,
         "channelIds": ["123456789", "987654321"],
         "prefix": "!docs",
         "permissions": ["read", "search"]
       }
     }
   }
   ```

### Usage

**Search Documentation:**
```
!docs search authentication
!docs how to create API key
!docs what is rate limiting
```

**Get Page:**
```
!docs page introduction
!docs link api/users
```

**Ask Questions:**
```
!docs What authentication methods are supported?
!docs How do I paginate results?
!docs Show me example of creating a user
```

### Bot Features

- Natural language search
- Code example formatting
- Inline documentation links
- Contextual answers
- Source citations
- Slash commands support

## Slack Bot

AI assistant for Slack workspaces.

### Setup

1. **Enable Integration:**
   - Go to Mintlify dashboard
   - Navigate to Integrations > Slack
   - Click "Add to Slack"

2. **Authorize:**
   - Select workspace
   - Approve permissions
   - Configure channels

3. **Configuration:**
   ```json
   {
     "integrations": {
       "slack": {
         "enabled": true,
         "channels": ["#engineering", "#support"],
         "notifyUpdates": true,
         "dailyDigest": true
       }
     }
   }
   ```

### Usage

**Ask Questions:**
```
@DocsBot How do I authenticate API requests?
@DocsBot Show me user creation example
@DocsBot What's the rate limit for /users endpoint?
```

**Search:**
```
/docs search webhooks
/docs find deployment guide
```

**Get Updates:**
```
/docs subscribe api-updates
/docs notifications on
```

### Features

- Conversational interface
- Code snippet formatting
- Direct message support
- Channel subscriptions
- Documentation update notifications
- Daily digest summaries

## Agent Automation

AI agent for automated documentation tasks.

### Configuration

```json
{
  "ai": {
    "agent": {
      "enabled": true,
      "capabilities": [
        "suggest-improvements",
        "detect-outdated",
        "generate-examples",
        "fix-broken-links"
      ],
      "schedule": "daily",
      "notifications": {
        "slack": "#docs-updates",
        "email": "team@example.com"
      }
    }
  }
}
```

### Capabilities

**Suggest Improvements:**
- Identify unclear explanations
- Suggest better wording
- Recommend additional examples
- Highlight missing sections

**Detect Outdated Content:**
- Compare with codebase
- Check API version compatibility
- Flag deprecated features
- Identify stale examples

**Generate Examples:**
- Auto-generate code examples
- Create usage scenarios
- Build tutorial content
- Produce troubleshooting guides

**Fix Broken Links:**
- Scan for 404s
- Update redirected URLs
- Fix internal references
- Validate external links

### Slack Integration

Receive agent suggestions in Slack:

```
Agent Report - Daily Digest

Suggestions (3):
- Add Python example to /api/authentication
- Update rate limits in /api/overview (changed in v2.5)
- Clarify webhook signature verification in /webhooks

Broken Links (1):
- /guides/deployment links to removed page /setup

Outdated Content (2):
- /api/users references deprecated `user_type` field
- /quickstart shows old authentication method
```

### Workflow Automation

Configure automated workflows:

```json
{
  "ai": {
    "workflows": [
      {
        "name": "Weekly Review",
        "trigger": "schedule",
        "schedule": "0 9 * * MON",
        "actions": [
          "detect-outdated",
          "broken-links",
          "suggest-improvements"
        ],
        "output": "slack"
      },
      {
        "name": "PR Review",
        "trigger": "pull_request",
        "actions": [
          "validate-changes",
          "suggest-examples",
          "check-consistency"
        ],
        "output": "github"
      }
    ]
  }
}
```

## AI API Access

Programmatic access to AI features.

### Endpoints

**Search:**
```bash
curl -X POST https://api.mintlify.com/v1/ai/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I authenticate?",
    "scope": "api"
  }'
```

**Ask Question:**
```bash
curl -X POST https://api.mintlify.com/v1/ai/ask \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the rate limits?",
    "context": ["api/overview", "api/rate-limits"]
  }'
```

**Generate Example:**
```bash
curl -X POST https://api.mintlify.com/v1/ai/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code_example",
    "endpoint": "POST /users",
    "language": "python"
  }'
```

### SDK Usage

**JavaScript:**
```javascript
import { MintlifyAI } from '@mintlify/ai';

const ai = new MintlifyAI({ apiKey: 'YOUR_API_KEY' });

const answer = await ai.ask({
  question: 'How do I authenticate API requests?',
  context: ['api/authentication']
});

console.log(answer.response);
console.log(answer.sources);
```

**Python:**
```python
from mintlify import MintlifyAI

ai = MintlifyAI(api_key='YOUR_API_KEY')

answer = ai.ask(
    question='How do I authenticate API requests?',
    context=['api/authentication']
)

print(answer.response)
print(answer.sources)
```

## Analytics and Insights

Track AI feature usage and effectiveness.

### AI Metrics

**Search Analytics:**
- Popular queries
- Query success rate
- Zero-result searches
- Click-through rates

**Question Analytics:**
- Most asked questions
- Response accuracy
- User satisfaction ratings
- Follow-up questions

**Usage Patterns:**
- Peak usage times
- User segments
- Feature adoption
- Integration usage

### Dashboard

View AI analytics in Mintlify dashboard:
- AI > Analytics
- Filter by date range
- Export reports
- Track trends

### Configuration

```json
{
  "ai": {
    "analytics": {
      "enabled": true,
      "trackQueries": true,
      "trackClicks": true,
      "collectFeedback": true
    }
  }
}
```
