# AI Copilot — документация

Workspace-level AI-ассистент, который понимает естественный язык и умеет управлять проектами и задачами через инструменты (tools).

## Принцип работы

```
Пользователь → Фронтенд → POST /api/workspaces/{slug}/ai-chat/ → AIChatEndpoint
                                                                          ↓
                                                              Anthropic Claude API
                                                                          ↓
                                                              Claude решает: нужен ли tool?
                                                                    ↙           ↘
                                                              Да (tool_use)    Нет → ответ текстом
                                                                ↓
                                                          execute_tool()
                                                                ↓
                                                          Python функция → Django ORM → DB
                                                                ↓
                                                          Результат → обратно в Claude
                                                                ↓
                                                          Claude формулирует ответ
                                                                ↓
                                                          { response, actions } → Фронтенд
```

### Agentic loop

Claude может вызвать несколько инструментов подряд. Например: сначала `list_projects`, потом `list_issues` для найденного проекта.

```python
# views.py — упрощённо
while response.stop_reason == "tool_use":
    results = [execute_tool(block.name, block.input) for block in response.content]
    messages += [assistant_message, tool_results]
    response = claude.messages.create(messages=messages, ...)

return response.text  # финальный ответ пользователю
```

### Stateless по дизайну

Бэкенд **не хранит историю чата**. Вся история (`messages`) приходит с фронтенда в каждом запросе — как в ChatGPT API. Это позволяет горизонтально масштабировать бэкенд без синхронизации состояния между воркерами.

---

## Структура файлов

```
apps/api/plane/app/ai/
├── views.py          # HTTP endpoint, agentic loop
├── executor.py       # вызов tool-функций, обработка ошибок
├── tools/
│   ├── registry.py   # декоратор @register_tool, хранилище инструментов
│   ├── __init__.py   # импорты всех инструментов (обязательно!)
│   ├── issues.py     # инструменты для работы с задачами
│   └── projects.py   # инструменты для работы с проектами
```

---

## Как добавить новый инструмент

### Шаг 1 — создать файл `tools/my_feature.py`

```python
from plane.app.ai.tools.registry import register_tool
from plane.db.models import MyModel  # нужные модели


@register_tool(
    name="my_tool_name",          # имя, которое видит Claude
    description="Что делает инструмент. Чем точнее описание — тем лучше Claude понимает когда его использовать.",
    input_schema={
        "type": "object",
        "properties": {
            "param_one": {
                "type": "string",
                "description": "Что это за параметр",
            },
            "param_two": {
                "type": "integer",
                "description": "Ещё один параметр (необязательный)",
            },
        },
        "required": ["param_one"],  # только обязательные параметры
    },
)
def my_tool_name(
    workspace_slug: str,   # всегда есть, из URL
    user,                  # всегда есть, из request.user
    param_one: str,        # из input_schema
    param_two: int = 10,   # необязательный — задай default
    **kwargs,              # ОБЯЗАТЕЛЬНО: поглощает лишние аргументы
) -> dict:
    # ... логика ...
    return {"result": "данные для Claude"}
```

> **Важно:** `**kwargs` обязателен в сигнатуре — иначе упадёт если Claude передаст неожиданный параметр.

### Шаг 2 — зарегистрировать импорт в `tools/__init__.py`

```python
# tools/__init__.py
from .issues import create_issue, list_issues, update_issue
from .projects import list_projects
from .my_feature import my_tool_name   # ← добавить строку
```

Это обязательно: `views.py` делает `import plane.app.ai.tools`, что запускает `__init__.py` и регистрирует все декораторы.

**Всё.** Claude автоматически узнает о новом инструменте и начнёт его использовать.

---

## Примеры существующих инструментов

### Чтение данных — `list_projects`

[`tools/projects.py`](tools/projects.py)

Самый простой пример: фильтрует по `workspace_slug` и `user`, возвращает список.

```python
@register_tool(name="list_projects", description="...", input_schema={...})
def list_projects(workspace_slug: str, user, **kwargs) -> dict:
    projects = Project.objects.filter(
        workspace__slug=workspace_slug,
        project_projectmember__member=user,  # только проекты пользователя
        project_projectmember__is_active=True,
    ).values("id", "name", "description", "identifier")

    return {"projects": [...]}
```

### Создание объекта — `create_issue`

[`tools/issues.py`](tools/issues.py) — функция `create_issue`

Показывает как правильно создавать задачи:

- Использует `IssueCreateSerializer` (не `Issue.objects.create()` напрямую) — это важно для генерации `sequence_id` и других полей
- Вызывает `issue_activity.delay()` — Celery-задача, которая уведомляет фронтенд через WebSocket и добавляет запись в историю

```python
serializer = IssueCreateSerializer(data=data, context={...})
if not serializer.is_valid():
    return {"error": str(serializer.errors)}
issue = serializer.save()

issue_activity.delay(type="issue.activity.created", ...)
```

### Обновление объекта — `update_issue`

[`tools/issues.py`](tools/issues.py) — функция `update_issue`

Паттерн обновления: получить объект → изменить поля → сохранить.

---

## Правила написания инструментов

**Безопасность:**

- Всегда фильтруй по `workspace__slug=workspace_slug` — иначе пользователь сможет достать данные из другого воркспейса
- Всегда проверяй членство пользователя (`project_projectmember__member=user`) — иначе можно получить данные чужого проекта

**Формат возврата:**

- Возвращай `dict` — Claude преобразует его в строку и читает как контекст
- При ошибке: `return {"error": "описание ошибки"}`
- При успехе: верни данные + опционально `"message"` для краткого резюме

```python
# хорошо
return {"id": str(issue.id), "message": "Issue created successfully"}

# тоже хорошо — Claude сам сформулирует ответ
return {"issues": [...список...]}
```

**Django ORM:**

- `select_related` — только для ForeignKey (например `issue.state`, `issue.project`)
- `prefetch_related` — для ManyToMany (например `issue.assignees`, `issue.labels`)
- Не используй `select_related` для ManyToMany — упадёт с ошибкой

---

## Конфигурация

Настраивается в Instance Admin (`/god-mode/`) или через env-переменные (при `SKIP_ENV_VAR=0`):

| Переменная     | Значение                                            |
| -------------- | --------------------------------------------------- |
| `LLM_PROVIDER` | провайдер (`anthropic`, в будущем — `openai` и др.) |
| `LLM_API_KEY`  | API ключ провайдера                                 |
| `LLM_MODEL`    | модель (`claude-sonnet-4-6` и др.)                  |

### Поддерживаемые провайдеры

Сейчас поддерживается только **Anthropic**. `views.py` явно проверяет `LLM_PROVIDER == "anthropic"` и возвращает ошибку для остальных.

**Почему пока только Anthropic:**

- Формат описания инструментов в `@register_tool` использует ключ `input_schema` — это Anthropic-специфичный формат. OpenAI и другие провайдеры используют ключ `parameters`
- `views.py` использует `anthropic.Anthropic()` клиент напрямую

### Как добавить поддержку другого провайдера

Реестр инструментов (`registry.py`) и сами tool-функции **не зависят от провайдера** — они просто Python-функции, которые возвращают `dict`. Нужно адаптировать только два места:

1. **Конвертер схемы** — написать функцию, которая превращает `input_schema` (Anthropic) → `parameters` (OpenAI) при передаче инструментов в API
2. **`views.py`** — добавить ветку под новый провайдер с соответствующим SDK-клиентом и форматом tool_results

Пример минимального изменения в `views.py`:

```python
if provider == "anthropic":
    # текущая реализация
elif provider == "openai":
    # openai.OpenAI() клиент, tools с "parameters" вместо "input_schema"
```

---

## Что добавить в будущем

| Фича                       | Описание                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| Персистентность чата       | Хранить `messages` в БД, загружать при открытии панели                   |
| Инструменты для циклов     | `list_cycles`, `add_issue_to_cycle`                                      |
| Инструменты для модулей    | `list_modules`, `create_module`                                          |
| Инструменты для участников | `list_members`, `assign_issue`                                           |
| Streaming ответов          | Server-Sent Events вместо polling — ответ появляется по словам           |
| Контекст страницы          | Передавать текущий `project_id` из URL, чтобы не спрашивать пользователя |
