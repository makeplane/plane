<!-- Scope: plane/tests/**, packages/i18n/**, packages/types/** -->

# Backend Testing & i18n

## Test Structure

```
plane/tests/
├── conftest.py          # Shared fixtures
├── factories.py         # Factory Boy factories
├── unit/                # Unit tests (models, serializers, utils)
├── contract/            # API contract tests (endpoint behavior)
└── smoke/               # End-to-end smoke tests
```

### Key Fixtures:

- `session_client` — authenticated client for `plane/app/` (internal API)
- `api_key_client` — API key authenticated client for `plane/api/` (external API)
- `create_user`, `api_token` — user and token setup

### Writing Tests:

```python
@pytest.mark.django_db
class TestMyEndpoint:
    def test_list(self, session_client):
        url = reverse("my-models")
        response = session_client.get(url)
        assert response.status_code == 200
```

### Commands:

```bash
cd apps/api
python run_tests.py   # or pytest
```

## i18n Translation Structure

```
packages/i18n/src/locales/
├── en/translations.ts
├── ko/translations.ts
└── vi/translations.ts
```

Translation files are **TypeScript modules** (NOT JSON). When adding new user-facing strings:

1. Add key to all 3 language files — en, ko, vi
2. Keep nesting structure consistent across languages
3. Use `useTranslation()` hook in frontend components

### Pluralization (ICU MessageFormat):

```typescript
items: "{count, plural, one {Work item} other {Work items}}";
```

## Frontend ↔ Backend Integration

### 1. TypeScript Types (`packages/types/`)

```typescript
export interface IMyModel {
  id: string;
  name: string;
  workspace: string;
  created_at: string;
}
```

### 2. API Service (`apps/web/core/services/` or `ce/services/`)

```typescript
export class MyModelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<IMyModel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/my-models/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

### URL Matching:

- Frontend: `/api/workspaces/${workspaceSlug}/my-models/`
- Backend: `workspaces/<str:slug>/my-models/`
- Django prepends `/api/` via ROOT_URLCONF
