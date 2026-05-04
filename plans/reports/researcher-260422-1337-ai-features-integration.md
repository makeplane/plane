# Plane.so AI Features Integration Report

## Executive Summary

**AI Framework**: OpenAI SDK (`openai==1.63.2`)

**Architecture**: Instance-level configuration with workspace-scoped endpoints. Two distinct AI features:
1. **GPT Assistant** (task-based) — accessible in issue modals
2. **Editor AI Menu** (tone/grammar) — accessible in CE editor (pages)

**High-level Flow**:
```
[Admin Config] → [Instance Variables] → [Backend Endpoints] → [Frontend Service]
  (LLM_API_KEY)      (encrypted store)     (OpenAI client)      (AIService)
```

---

## 1. Backend: LLM Configuration & Endpoints

### 1.1 Environment Variables (Instance-Level)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/instance_config_variables/core.py` (lines 276–302)

```python
llm_config_variables = [
    { "key": "LLM_API_KEY", "is_encrypted": True, "category": "AI" },
    { "key": "LLM_PROVIDER", "default": "openai", "is_encrypted": False },
    { "key": "LLM_MODEL", "default": "gpt-4o-mini", "is_encrypted": False },
    { "key": "GPT_ENGINE", "default": "gpt-3.5-turbo", "is_encrypted": False },  # deprecated
]
```

**Storage**: Instance configuration database (encrypted for API key)

### 1.2 LLM Providers & Models

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/external/base.py` (lines 26–73)

Supported providers:
- **OpenAI** (default): gpt-3.5-turbo, gpt-4o-mini, gpt-4o, o1-mini, o1-preview
- **Anthropic**: claude-3-5-sonnet-20240620, claude-3-haiku-20240307, claude-3-opus-20240229, ...
- **Gemini**: gemini-pro, gemini-1.5-pro-latest, gemini-pro-vision

**Note**: Only OpenAI SDK imported (`from openai import OpenAI`); other providers validated but use same OpenAI client with model prefix (e.g., `gemini/gemini-pro`)

### 1.3 Backend Endpoints

#### Endpoint A: Project-level AI Assistant
**URL**: `/api/workspaces/<slug>/projects/<project_id>/ai-assistant/`
**Method**: POST
**Class**: `GPTIntegrationEndpoint` (lines 148–181)
**Auth**: ADMIN or MEMBER role
**Payload**:
```json
{ "task": "string", "prompt": "string" }
```
**Response**:
```json
{
  "response": "string",
  "response_html": "string (newlines → <br/>)",
  "project_detail": {...},
  "workspace_detail": {...}
}
```

#### Endpoint B: Workspace-level AI Assistant
**URL**: `/api/workspaces/<slug>/ai-assistant/`
**Method**: POST
**Class**: `WorkspaceGPTIntegrationEndpoint` (lines 184–212)
**Auth**: ADMIN or MEMBER role (workspace-level)
**Payload**: Same as above
**Response**: `{ "response", "response_html" }`

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/urls/external.py`

### 1.4 Configuration Resolution Flow

**Function**: `get_llm_config()` (lines 76–120)

1. Fetch `LLM_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL` from instance config
2. Validate provider is in `SUPPORTED_PROVIDERS`
3. If no model specified, use provider's default
4. Validate model is in provider's supported list
5. Return `(api_key, model, provider)` or `(None, None, None)` if invalid

### 1.5 LLM Request Handler

**Function**: `get_llm_response()` (lines 123–145)

- Concatenates task + prompt
- For Gemini, prefixes model with `gemini/`
- Uses OpenAI client: `OpenAI(api_key=api_key).chat.completions.create(model=model, messages=[...])`
- Error handling for `AuthenticationError`, `RateLimitError`

---

## 2. Admin God-Mode: Instance Configuration

### 2.1 AI Configuration Page

**File**: `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/ai/page.tsx`

**Route**: `/(all)/(dashboard)/ai`

**Metadata**: "Artificial Intelligence Settings - God Mode"

**What it does**:
1. Fetches instance configurations on mount
2. Renders `InstanceAIForm` with config data
3. Shows loading skeleton while fetching

### 2.2 AI Form Component

**File**: `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/ai/form.tsx` (lines 24–140)

**Form Fields**:
1. **LLM Model** (text input)
   - Placeholder: `gpt-4o-mini`
   - Help text: "Choose an OpenAI engine" + link to OpenAI docs

2. **API Key** (password input)
   - Placeholder: `sk-asddassdfasdefqsdfasd23das3dasd...`
   - Help text: Link to OpenAI API keys page

**On Submit**:
- Calls `updateInstanceConfigurations(payload)`
- Shows success/error toast
- Persists to instance config database (encrypted for API key)

**UI Note**: "If you have a preferred AI models vendor, please get in touch with us."

---

## 3. Workspace-Level Enablement

**Finding**: No workspace-specific enable/disable toggle found.

**Current behavior**:
- AI features are **enabled globally** if instance config is set
- No per-workspace AI toggle in database
- No per-workspace UI switch in workspace settings

**Implication**: AI is all-or-nothing at instance level; cannot disable for specific workspaces.

---

## 4. Portal User Experience (Frontend)

### 4.1 AI Service Layer

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/services/ai.service.ts` (lines 25–50)

```typescript
class AIService extends APIService {
  async createGptTask(workspaceSlug: string, data: { prompt, task }): Promise<any>
    → POST /api/workspaces/{slug}/ai-assistant/

  async performEditorTask(workspaceSlug: string, data: TTaskPayload): Promise<{ response }>
    → POST /api/workspaces/{slug}/rephrase-grammar/
}
```

**Types**:
```typescript
type TTaskPayload = {
  casual_score?: number;
  formal_score?: number;
  task: AI_EDITOR_TASKS;
  text_input: string;
}
```

### 4.2 Feature 1: GPT Assistant Popover (Issue Modal)

**Component**: `GptAssistantPopover` 
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/core/modals/gpt-assistant-popover.tsx`

**Props**:
- `workspaceSlug`, `workspaceId`, `projectId`
- `prompt` (existing content to enhance)
- `button` (render prop for trigger)
- `onResponse`, `onError` callbacks

**UI**:
- Popover with task input field
- Shows original prompt/content (read-only editor)
- Shows AI response (read-only editor)
- "Use this response" button inserts into form
- Rate limit: 50 requests/month/user

**Used in**:
- Issue description editor (auto-generate description button)
- Issue modal form

**Integration Example** (description-editor.tsx, lines 111–115):
```typescript
const handleAiAssistance = async (response: string) => {
  editorRef.current?.setEditorValueAtCursorPosition(response);
};

// Auto-generate on "I'm Feeling Lucky" click:
aiService.createGptTask(workspaceSlug, {
  prompt: issueName,
  task: "Generate a proper description for this work item."
})
```

### 4.3 Feature 2: Editor AI Menu (CE Pages)

**Component**: `EditorAIMenu`
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/pages/editor/ai/menu.tsx`

**Task Types**:
```typescript
enum AI_EDITOR_TASKS { ASK_ANYTHING = "ASK_ANYTHING" }
```

**Submenu**: AskPiMenu (component for "Ask Anything" task)

**UI**:
- Collapsible menu (210px → 700px when expanded)
- Single menu item: "Ask Pi" (Sparkles icon)
- Tone selector: Default, Professional (💼), Casual (😃)
- Action buttons: Replace selection, Add to next line, Regenerate
- Warning: "By using this feature, you consent to sharing..."

**Request Flow**:
```typescript
await aiService.performEditorTask(workspaceSlug, {
  task: "ASK_ANYTHING",
  text_input: editorRef.getSelectedText(),
  casual_score: 5,
  formal_score: 5
})
```

**Constants**:
- Loading text: "Pi is generating response"

---

## 5. Data Flow Example: User Requests AI Assistance

```
1. User clicks "Sparkle" button in issue description editor
   ↓
2. GptAssistantPopover opens
   - Shows current issue title/description
   - User enters task (e.g., "Make this more formal")
   ↓
3. Frontend calls: aiService.createGptTask(workspace, { prompt, task })
   ↓
4. Backend endpoint: POST /api/workspaces/{slug}/ai-assistant/
   - Calls get_llm_config() → validates OpenAI credentials
   - Calls get_llm_response(task, prompt, api_key, model, provider)
   - OpenAI.chat.completions.create(...)
   ↓
5. Response returned with HTML formatting
   ↓
6. User clicks "Use this response" 
   - editorRef.setEditorValueAtCursorPosition(response)
   - Popover closes, description updated
```

---

## 6. Environment Variables Summary

### Instance-Level (`.env` or DB)
```
LLM_API_KEY         # OpenAI API key (encrypted in DB)
LLM_PROVIDER        # "openai" | "anthropic" | "gemini" (default: openai)
LLM_MODEL           # e.g., "gpt-4o-mini" (default: gpt-4o-mini)
GPT_ENGINE          # deprecated, use LLM_MODEL
```

### Deprecated (still in code for backward compatibility)
```
OPENAI_API_BASE     # deprecated
OPENAI_API_KEY      # deprecated
```

---

## 7. Key Files & Line Numbers

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Instance config | `apps/api/plane/utils/instance_config_variables/core.py` | 276–302 | Define LLM env vars |
| Endpoints | `apps/api/plane/app/views/external/base.py` | 26–212 | OpenAI client, providers, endpoints |
| URL routing | `apps/api/plane/app/urls/external.py` | 12–23 | Route `/ai-assistant/` |
| Admin page | `apps/admin/app/(all)/(dashboard)/ai/page.tsx` | 1–50 | God-mode page |
| Admin form | `apps/admin/app/(all)/(dashboard)/ai/form.tsx` | 24–140 | LLM config form |
| AI service | `apps/web/core/services/ai.service.ts` | 25–50 | Frontend API calls |
| Issue popover | `apps/web/core/components/core/modals/gpt-assistant-popover.tsx` | 44–302 | Issue AI assistant |
| Description editor | `apps/web/core/components/issues/issue-modal/components/description-editor.tsx` | 111–150 | Integration point |
| Editor menu | `apps/web/ce/components/pages/editor/ai/menu.tsx` | 34–309 | CE page AI menu |
| AI constants | `apps/web/core/constants/ai.ts` | 7–15 | Task enum, loading text |
| Dependencies | `apps/api/requirements/base.txt` | 40 | `openai==1.63.2` |

---

## 8. Gaps & Unresolved Questions

1. **Workspace AI Toggle**: No database model or UI for per-workspace AI enable/disable. Is this intentional?
   
2. **Endpoint Mismatch**: Frontend calls `/api/workspaces/{slug}/rephrase-grammar/` (in ai.service.ts line 44) but no such endpoint found in backend URLs. Is this deprecated or missing?

3. **Anthropic/Gemini Support**: Code validates Anthropic and Gemini providers, but `OpenAI()` client is used for all. For non-OpenAI providers, the SDK would fail — are these placeholders for future?

4. **Rate Limiting**: Frontend shows "50 requests/month" but no backend enforcement found. Where is this limit enforced?

5. **Admin Sidebar**: Where is the "AI" menu item registered in admin sidebar? (not found in hooks/use-sidebar-menu)

6. **Admin Form Styling**: Admin form uses `text-color-tertiary` (deprecated token) on line 104 of form.tsx. Should be `text-tertiary`.

---

## Vietnamese Summary (Tóm tắt Tiếng Việt)

**Khung AI**: OpenAI SDK (phiên bản 1.63.2)

**Cấu hình**: Quản lý ở cấp instance (thông qua Admin God-Mode). Hai tính năng chính:
1. **GPT Assistant** - hỗ trợ trong modal issue (tạo/chỉnh sửa mô tả)
2. **Editor AI Menu** - hỗ trợ trong trình soạn thảo trang (CE)

**Luồng**: Admin cấu hình API key → lưu encrypted → backend gọi OpenAI → frontend ghi kết quả

**Endpoints chính**:
- `POST /api/workspaces/{slug}/ai-assistant/` — hỗ trợ GPT chung
- `POST /api/workspaces/{slug}/projects/{id}/ai-assistant/` — hỗ trợ project-level
- Không tìm thấy endpoint `/rephrase-grammar/` (có trong code frontend nhưng không ở backend)

**Chưa giải quyết**: Không có toggle enable/disable AI per-workspace; hỗ trợ Anthropic/Gemini được validate nhưng code chỉ dùng OpenAI client thực tế.
